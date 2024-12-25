package main

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email             string    `json:"email"`
	Name              string    `json:"name"`
	Password          string    `json:"-"`
	RoleID            uint      `json:"role_id"`
	Role              Role      `json:"role" gorm:"foreignKey:RoleID"`
	Verified          bool      `json:"verified"`
	VerifyToken       string    `json:"-"`
	VerifyExpires     time.Time `json:"-"`
	Bio               string    `json:"bio"`
	ProfilePictureURL string    `json:"profile_picture_url"`
	Threads           []Thread
	Replies           []Reply
}

// Reply model represents a reply to a thread
type Reply struct {
	gorm.Model
	Content  string `json:"content"`
	ThreadID uint   `json:"thread_id"`
	UserID   uint   `json:"user_id"`
	Thread   Thread `gorm:"foreignKey:ThreadID"`
	User     User   `gorm:"foreignKey:UserID"`
}

type ReplyInfo struct {
	ID          uint      `json:"ID"`
	Content     string    `json:"content"`
	ThreadID    uint      `json:"thread_id"`
	ThreadTitle string    `json:"thread_title"`
	CreatedAt   time.Time `json:"created_at"`
}

// Thread model represents a discussion thread
type Thread struct {
	gorm.Model
	Title   string  `json:"title"`
	Content string  `json:"content"`
	Section string  `json:"section"`
	Tags    string  `json:"tags"`  // Comma-separated tags
	Views   int     `json:"views"` // View count
	UserID  uint    `json:"user_id"`
	User    User    `json:"user"`
	Replies []Reply `json:"replies"`
}

type ThreadInfo struct {
	ID        uint      `json:"ID"`
	Title     string    `json:"title"`
	Section   string    `json:"section"`
	CreatedAt time.Time `json:"created_at"`
}

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

// UserActivityStats represents common statistics for both public and private profiles
type UserActivityStats struct {
	TotalThreads int64                 `json:"total_threads"`
	TotalReplies int64                 `json:"total_replies"`
	TopSections  []SectionCount        `json:"top_sections"`
	RecentPosts  UserRecentActivity    `json:"recent_activity"`
	ActivityMap  map[string]int64      `json:"activity_map,omitempty"`
	Metrics      UserEngagementMetrics `json:"metrics,omitempty"`
}

type SectionCount struct {
	Section string `json:"section"`
	Count   int64  `json:"count"`
}

type UserRecentActivity struct {
	Threads []ThreadInfo `json:"threads"`
	Replies []ReplyInfo  `json:"replies"`
}

type UserEngagementMetrics struct {
	AvgResponseTime float64          `json:"avg_response_time"`
	ActivityHeatmap map[string]int64 `json:"activity_heatmap"`
	LastActive      time.Time        `json:"last_active"`
}

type PaginatedActivity struct {
	Activities []Activity `json:"activities"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
}

type Activity struct {
	Type      string    `json:"type"`
	ID        uint      `json:"id"`
	Content   string    `json:"content"`
	ThreadID  uint      `json:"thread_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	Section   string    `json:"section,omitempty"`
}

// Permissions type for JSONB handling
type Permissions map[string]bool

type Role struct {
	gorm.Model
	Name        string      `json:"name" gorm:"unique"`
	Color       string      `json:"color"`
	Permissions Permissions `json:"permissions" gorm:"type:jsonb"`
}

type ProfileUpdateInput struct {
	Bio               *string `json:"bio"`
	ProfilePictureURL *string `json:"profile_picture_url"`
}
