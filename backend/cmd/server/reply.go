package main

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Reply model represents a reply to a thread
type Reply struct {
	gorm.Model
	Content  string `json:"content"`
	ThreadID uint   `json:"thread_id"`
	UserID   uint   `json:"user_id"`
	Thread   Thread `gorm:"foreignKey:ThreadID"`
	User     User   `gorm:"foreignKey:UserID"`
}

// Create a new reply to a thread
func createReply(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var reply Reply
		threadId := c.Param("id")

		if err := c.BindJSON(&reply); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Convert threadId to uint
		var threadID uint
		if id, err := strconv.ParseUint(threadId, 10, 32); err == nil {
			threadID = uint(id)
		} else {
			c.JSON(400, gin.H{"error": "Invalid thread ID"})
			return
		}

		// Verify thread exists
		var thread Thread
		if err := db.First(&thread, threadID).Error; err != nil {
			c.JSON(404, gin.H{"error": "Thread not found"})
			return
		}

		// For development, use the first user in the database
		var user User
		if err := db.First(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "No users found"})
			return
		}

		reply.ThreadID = threadID
		reply.UserID = user.ID // Use the found user's ID

		if err := db.Create(&reply).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Load the user data for the response
		db.Preload("User").First(&reply, reply.ID)

		c.JSON(201, reply)
	}
}

// Get replies for a specific thread
func getReplies(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var replies []Reply
		threadId := c.Param("id")

		if err := db.Where("thread_id = ?", threadId).Find(&replies).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, replies)
	}
}
