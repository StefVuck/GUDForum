package main

import (
	"fmt"
	"net/http"
	"strconv"

	"database/sql/driver"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// JSON Handling
func (p Permissions) Value() (driver.Value, error) {
	return json.Marshal(p)
}

func (p *Permissions) Scan(value interface{}) error {
	if value == nil {
		*p = make(Permissions)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONB value: %v", value)
	}
	return json.Unmarshal(bytes, &p)
}

/*

ROLE LOGIC

*/

// Initialize roles table and add default roles
func initializeRoles(db *gorm.DB) error {
	if err := db.AutoMigrate(&Role{}); err != nil {
		return err
	}

	defaultRoles := []Role{
		{
			Name:  "admin",
			Color: "#FF4444",
			Permissions: Permissions{
				"can_manage_roles":   true,
				"can_manage_users":   true,
				"can_delete_threads": true,
				"can_pin_threads":    true,
			},
		},
		{
			Name:  "moderator",
			Color: "#44AA44",
			Permissions: Permissions{
				"can_delete_threads": true,
				"can_pin_threads":    true,
			},
		},
		{
			Name:  "member",
			Color: "#808080",
			Permissions: Permissions{
				"can_create_threads": true,
				"can_reply":          true,
			},
		},
	}

	for _, role := range defaultRoles {
		var existingRole Role
		if err := db.Where("name = ?", role.Name).First(&existingRole).Error; err != nil {
			if err := db.Create(&role).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func getRoles(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var roles []Role
		if err := db.Find(&roles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
			return
		}
		c.JSON(http.StatusOK, roles)
	}
}

/*

PROFILE LOGIC

*/

func getCurrentUserProfile(db *gorm.DB) gin.HandlerFunc {
	userService := NewUserService(db)

	return func(c *gin.Context) {
		userID := getUserIdFromToken(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var user User
		if err := db.Preload("Role").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get full stats including private data
		stats, err := userService.GetUserActivityStats(userID, true)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user stats"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"email":     user.Email,
			"role":      user.Role,
			"join_date": user.CreatedAt,
			"verified":  user.Verified,
			"stats":     stats,
		})
	}
}

func getPublicUserProfile(db *gorm.DB) gin.HandlerFunc {
	userService := NewUserService(db)

	return func(c *gin.Context) {
		userID := c.Param("id")
		var uid uint
		if _, err := fmt.Sscanf(userID, "%d", &uid); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		var user User
		if err := db.Preload("Role").First(&user, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get public stats only
		stats, err := userService.GetUserActivityStats(uid, false)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user stats"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"role":      user.Role,
			"join_date": user.CreatedAt,
			"stats":     stats,
		})
	}
}

func getCurrentUserStats(db *gorm.DB) gin.HandlerFunc {
	userService := NewUserService(db)

	return func(c *gin.Context) {
		userID := getUserIdFromToken(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		stats, err := userService.GetUserActivityStats(userID, true)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user stats"})
			return
		}

		c.JSON(http.StatusOK, stats)
	}
}

func getUserActivity(db *gorm.DB) gin.HandlerFunc {
	userService := NewUserService(db)

	return func(c *gin.Context) {
		// Parse user ID
		userID := c.Param("id")
		var uid uint
		if _, err := fmt.Sscanf(userID, "%d", &uid); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Parse pagination parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

		if page < 1 {
			page = 1
		}
		if pageSize < 1 || pageSize > 50 {
			pageSize = 10
		}

		// Get paginated activity
		activity, err := userService.GetUserActivity(uid, page, pageSize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user activity"})
			return
		}

		c.JSON(http.StatusOK, activity)
	}
}

/*

ADMIN LOGIC

*/

func updateUserRole(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentUserID := getUserIdFromToken(c)
		var currentUser User
		if err := db.Preload("Role").First(&currentUser, currentUserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		if !currentUser.Role.Permissions["can_manage_roles"] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			return
		}

		var input struct {
			UserID uint `json:"userId" binding:"required"`
			RoleID uint `json:"roleId" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Model(&User{}).Where("id = ?", input.UserID).
			Update("role_id", input.RoleID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Role updated successfully"})
	}
}
