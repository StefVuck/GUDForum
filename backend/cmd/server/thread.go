package main

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Create a new thread
func createThread(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var thread Thread
		if err := c.BindJSON(&thread); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		userID := getUserIdFromToken(c)
		thread.UserID = userID

		if err := db.Create(&thread).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Load the associated user data for the response
		db.Preload("User").First(&thread, thread.ID)

		c.JSON(201, thread)
	}
}

// Get threads by section
func getThreadsBySection(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var threads []Thread
		section := c.Param("section")

		if err := db.Where("section = ?", section).
			Preload("User").
			Preload("Replies").
			Preload("Replies.User").
			Find(&threads).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, threads)
	}
}

// Get a specific thread
func getThread(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var thread Thread
		threadId := c.Param("id")

		if err := db.Preload("User").
			Preload("Replies").
			Preload("Replies.User").
			First(&thread, threadId).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(404, gin.H{"error": "Thread not found"})
				return
			}
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, thread)
	}
}
