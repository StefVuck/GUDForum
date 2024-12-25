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
			"id":                  user.ID,
			"name":                user.Name,
			"email":               user.Email,
			"role":                user.Role,
			"bio":                 user.Bio,
			"join_date":           user.CreatedAt,
			"verified":            user.Verified,
			"stats":               stats,
			"profile_picture_url": user.ProfilePictureURL,
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
			"id":                  user.ID,
			"name":                user.Name,
			"role":                user.Role,
			"join_date":           user.CreatedAt,
			"bio":                 user.Bio,
			"profile_picture_url": user.ProfilePictureURL,
			"stats":               stats,
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
		// Extract userId from URL
		userIdStr := c.Param("userId")
		userId, err := strconv.Atoi(userIdStr)
		if err != nil || userId <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Parse input payload
		var input struct {
			RoleID json.Number `json:"roleId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		// Convert RoleID to integer
		roleID, err := input.RoleID.Int64()
		if err != nil || roleID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
			return
		}

		// Ensure the role exists
		var role Role
		if err := db.First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Role does not exist"})
			return
		}

		// Update user's role
		if err := db.Model(&User{}).Where("id = ?", userId).Update("role_id", uint(roleID)).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
			return
		}

		// Fetch updated user with role
		var updatedUser User
		if err := db.Preload("Role").First(&updatedUser, userId).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
			return
		}

		// Return the updated user object
		c.JSON(http.StatusOK, gin.H{
			"message": "Role updated successfully",
			"user":    updatedUser,
		})
	}
}

func handleGetUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract and validate JWT token
		userID := getUserIdFromToken(c)

		// Fetch user with role information
		var requestingUser User
		if err := db.Preload("Role").Where("id = ?", userID).First(&requestingUser).Error; err != nil {
			c.JSON(403, gin.H{"error": "Access denied"})
			return
		}

		// Check if user has admin role
		if requestingUser.RoleID != 1 {
			c.JSON(403, gin.H{"error": "Access denied"})
			return
		}

		// Handle pagination
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
		offset := (page - 1) * pageSize

		// Fetch users with roles
		var users []User
		if err := db.Preload("Role").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to fetch users"})
			return
		}

		// Total count for pagination
		var total int64
		if err := db.Model(&User{}).Count(&total).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to count users"})
			return
		}

		// Return users with pagination info
		c.JSON(200, gin.H{
			"users": users,
			"pagination": gin.H{
				"page":      page,
				"page_size": pageSize,
				"total":     total,
			},
		})
	}
}

func updateUserProfile(db *gorm.DB) gin.HandlerFunc {
	userService := NewUserService(db) // Add this
	return func(c *gin.Context) {
		userID := getUserIdFromToken(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var input ProfileUpdateInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updates := make(map[string]interface{})
		if input.Bio != nil {
			updates["bio"] = *input.Bio
		}
		if input.ProfilePictureURL != nil {
			updates["profile_picture_url"] = *input.ProfilePictureURL
		}

		if len(updates) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No updates provided"})
			return
		}

		if err := db.Model(&User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}

		// Fetch updated user
		var user User
		if err := db.Preload("Role").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated profile"})
			return
		}

		// Get stats like in getCurrentUserProfile
		stats, err := userService.GetUserActivityStats(userID, true)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user stats"})
			return
		}

		// Return the same structure as getCurrentUserProfile
		c.JSON(http.StatusOK, gin.H{
			"id":                  user.ID,
			"name":                user.Name,
			"email":               user.Email,
			"role":                user.Role,
			"bio":                 user.Bio,
			"profile_picture_url": user.ProfilePictureURL,
			"join_date":           user.CreatedAt,
			"verified":            user.Verified,
			"stats":               stats,
		})
	}
}
