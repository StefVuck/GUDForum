package main

import (
	"fmt"
	"net/http"
	"time"

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

// Get current user's profile
func getCurrentUserProfile(db *gorm.DB) gin.HandlerFunc {
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

		var threadCount, replyCount int64
		db.Model(&Thread{}).Where("user_id = ?", userID).Count(&threadCount)
		db.Model(&Reply{}).Where("user_id = ?", userID).Count(&replyCount)

		// Get last active timestamp
		var lastActive time.Time
		var lastThread, lastReply time.Time

		if result := db.Model(&Thread{}).Where("user_id = ?", userID).
			Order("created_at DESC").Select("created_at").Row().Scan(&lastThread); result == nil {
			lastActive = lastThread
		}

		if result := db.Model(&Reply{}).Where("user_id = ?", userID).
			Order("created_at DESC").Select("created_at").Row().Scan(&lastReply); result == nil {
			if lastReply.After(lastActive) {
				lastActive = lastReply
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"id":            user.ID,
			"name":          user.Name,
			"email":         user.Email,
			"role":          user.Role,
			"total_threads": threadCount,
			"total_replies": replyCount,
			"join_date":     user.CreatedAt,
			"last_active":   lastActive,
			"verified":      user.Verified,
		})
	}
}

// Get current user's stats
func getCurrentUserStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := getUserIdFromToken(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var threads []Thread
		var replies []Reply
		threadsBySection := make(map[string]int)
		repliesByMonth := make(map[string]int)

		// Get threads by section
		db.Where("user_id = ?", userID).Find(&threads)
		for _, thread := range threads {
			threadsBySection[thread.Section]++
		}

		// Calculate reply statistics
		db.Where("user_id = ?", userID).Find(&replies)
		var totalResponseTime float64
		var responseCount int

		for _, reply := range replies {
			repliesByMonth[reply.CreatedAt.Format("2006-01")]++

			var thread Thread
			if err := db.First(&thread, reply.ThreadID).Error; err != nil {
				continue
			}
			responseTime := reply.CreatedAt.Sub(thread.CreatedAt).Hours()
			totalResponseTime += responseTime
			responseCount++
		}

		avgResponseTime := 0.0
		if responseCount > 0 {
			avgResponseTime = totalResponseTime / float64(responseCount)
		}

		c.JSON(http.StatusOK, gin.H{
			"threadsBySection": threadsBySection,
			"repliesByMonth":   repliesByMonth,
			"avgResponseTime":  avgResponseTime,
		})
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
