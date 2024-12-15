package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SearchParams struct {
	Type       string   `form:"type" binding:"required,oneof=title content user tags"`
	Query      string   `form:"query" binding:"required"`
	Section    string   `form:"section"`
	DateRange  string   `form:"dateRange"`
	HasReplies *bool    `form:"hasReplies"`
	IsResolved *bool    `form:"isResolved"`
	Tags       []string `form:"tags[]"`
	SortBy     string   `form:"sortBy"`
	TeamFilter string   `form:"teamFilter"`
}

type SearchResult struct {
	Thread
	ReplyCount  int       `json:"replyCount"`
	LastReplyAt time.Time `json:"lastReplyAt"`
	Matches     []string  `json:"matches"` // Snippets of matching content
}

// search.go
func handleSearch(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var params SearchParams
		if err := c.ShouldBindQuery(&params); err != nil {
			c.JSON(400, gin.H{"error": "Invalid search parameters"})
			return
		}

		// Main query with correct column selection
		query := db.Model(&Thread{}).
			Select(`
                threads.*,
                COUNT(DISTINCT replies.id) as reply_count,
                MAX(replies.created_at) as last_reply_at
            `).
			Preload("User").
			Preload("Replies").
			Preload("Replies.User").
			Joins("LEFT JOIN replies ON replies.thread_id = threads.id")

		// Base search conditions
		switch params.Type {
		case "title":
			query = query.Where("LOWER(threads.title) LIKE LOWER(?)", "%"+params.Query+"%")
		case "content":
			query = query.Where(
				"LOWER(threads.content) LIKE LOWER(?) OR LOWER(replies.content) LIKE LOWER(?)",
				"%"+params.Query+"%",
				"%"+params.Query+"%",
			)
		case "user":
			query = query.Joins("JOIN users ON threads.user_id = users.id").
				Where(
					"LOWER(users.name) LIKE LOWER(?) OR LOWER(users.email) LIKE LOWER(?)",
					"%"+params.Query+"%",
					"%"+params.Query+"%",
				)
		case "tags":
			query = query.Where("LOWER(threads.tags) LIKE LOWER(?)", "%"+params.Query+"%")
		}

		// Section filter
		if params.Section != "" && params.Section != "all" {
			query = query.Where("threads.section = ?", params.Section)
		}

		// Date range filter
		if params.DateRange != "" && params.DateRange != "all" {
			var since time.Time
			switch params.DateRange {
			case "today":
				since = time.Now().AddDate(0, 0, -1)
			case "week":
				since = time.Now().AddDate(0, 0, -7)
			case "month":
				since = time.Now().AddDate(0, -1, 0)
			case "semester":
				since = time.Now().AddDate(0, -4, 0)
			}
			query = query.Where("threads.created_at > ?", since)
		}

		// Has replies filter
		if params.HasReplies != nil && *params.HasReplies {
			query = query.Having("COUNT(DISTINCT replies.id) > 0")
		}

		// Team filter
		if params.TeamFilter != "" && params.TeamFilter != "all" {
			query = query.Where("threads.section = ?", params.TeamFilter)
		}

		// Tags filter
		if len(params.Tags) > 0 {
			for _, tag := range params.Tags {
				query = query.Where("LOWER(threads.tags) LIKE LOWER(?)", "%"+tag+"%")
			}
		}

		// Sort options
		switch params.SortBy {
		case "recent":
			query = query.Order("threads.created_at DESC")
		case "replies":
			query = query.Order("reply_count DESC")
		case "relevant":
			query = query.Order(fmt.Sprintf(
				"CASE WHEN LOWER(threads.title) LIKE LOWER(?) THEN 1 ELSE 2 END",
				"%"+params.Query+"%",
			))
		case "views":
			query = query.Order("threads.views DESC")
		default:
			query = query.Order("threads.created_at DESC")
		}

		// Group by using correct table reference
		query = query.Group("threads.id")

		var results []Thread
		if err := query.Find(&results).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to search threads: " + err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"results": results,
			"total":   len(results),
		})
	}
}

// Unused for now, GPTed, but I don't know how to integrate it well
// generateSnippets creates context snippets around matching content
func generateSnippets(result SearchResult, query string) []string {
	var snippets []string
	const snippetLength = 100 // characters on each side of match

	// Helper function to create a snippet
	createSnippet := func(text string, matchIndex int) string {
		start := matchIndex - snippetLength
		if start < 0 {
			start = 0
		}
		end := matchIndex + len(query) + snippetLength
		if end > len(text) {
			end = len(text)
		}

		snippet := text[start:end]
		if start > 0 {
			snippet = "..." + snippet
		}
		if end < len(text) {
			snippet = snippet + "..."
		}
		return snippet
	}

	// Check title
	if idx := strings.Index(strings.ToLower(result.Title), strings.ToLower(query)); idx != -1 {
		snippets = append(snippets, "Title: "+createSnippet(result.Title, idx))
	}

	// Check content
	if idx := strings.Index(strings.ToLower(result.Content), strings.ToLower(query)); idx != -1 {
		snippets = append(snippets, "Content: "+createSnippet(result.Content, idx))
	}

	return snippets
}
