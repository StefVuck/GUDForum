package main

import (
	"time"

	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetUserActivityStats(userID uint, includePrivate bool) (*UserActivityStats, error) {
	stats := &UserActivityStats{
		ActivityMap: make(map[string]int64),
	}

	// Get base counts
	if err := s.db.Model(&Thread{}).Where("user_id = ? AND deleted_at IS NULL", userID).Count(&stats.TotalThreads).Error; err != nil {
		return nil, err
	}
	if err := s.db.Model(&Reply{}).Where("user_id = ? AND deleted_at IS NULL", userID).Count(&stats.TotalReplies).Error; err != nil {
		return nil, err
	}

	// Get top sections
	if err := s.db.Model(&Thread{}).
		Select("section, count(*) as count").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Group("section").
		Order("count desc").
		Limit(5).
		Scan(&stats.TopSections).Error; err != nil {
		return nil, err
	}

	// Get recent activity
	recentActivity, err := s.getUserRecentActivity(userID)
	if err != nil {
		return nil, err
	}
	stats.RecentPosts = *recentActivity

	// Include private metrics if requested
	if includePrivate {
		metrics, err := s.getUserEngagementMetrics(userID)
		if err != nil {
			return nil, err
		}
		stats.Metrics = *metrics

		// Get activity map
		activityMap, err := s.getActivityMap(userID)
		if err != nil {
			return nil, err
		}
		stats.ActivityMap = activityMap
	}

	return stats, nil
}

func (s *UserService) getUserRecentActivity(userID uint) (*UserRecentActivity, error) {
	activity := &UserRecentActivity{}

	// Get recent threads
	if err := s.db.Model(&Thread{}).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at desc").
		Limit(5).
		Find(&activity.Threads).Error; err != nil {
		return nil, err
	}

	// Get recent replies with thread titles
	if err := s.db.Table("replies").
		Select("replies.id, replies.content, replies.thread_id, replies.created_at, threads.title as thread_title").
		Joins("left join threads on threads.id = replies.thread_id").
		Where("replies.user_id = ? AND replies.deleted_at IS NULL", userID).
		Order("replies.created_at desc").
		Limit(5).
		Scan(&activity.Replies).Error; err != nil {
		return nil, err
	}

	return activity, nil
}

func (s *UserService) getUserEngagementMetrics(userID uint) (*UserEngagementMetrics, error) {
	metrics := &UserEngagementMetrics{
		ActivityHeatmap: make(map[string]int64),
	}

	// Calculate average response time
	var totalTime float64
	var responseCount int64

	rows, err := s.db.Raw(`
        SELECT r.created_at, t.created_at as thread_created_at
        FROM replies r
        JOIN threads t ON t.id = r.thread_id
        WHERE r.user_id = ? AND r.deleted_at IS NULL
    `, userID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var replyTime, threadTime time.Time
		if err := rows.Scan(&replyTime, &threadTime); err != nil {
			return nil, err
		}
		totalTime += replyTime.Sub(threadTime).Hours()
		responseCount++

		// Build activity heatmap
		dayHour := replyTime.Format("Mon-15")
		metrics.ActivityHeatmap[dayHour]++
	}

	if responseCount > 0 {
		metrics.AvgResponseTime = totalTime / float64(responseCount)
	}

	// Get last active timestamp
	lastActive, err := s.getLastActiveTime(userID)
	if err != nil {
		return nil, err
	}
	metrics.LastActive = lastActive

	return metrics, nil
}

func (s *UserService) getLastActiveTime(userID uint) (time.Time, error) {
	var lastActive time.Time

	// Get the most recent activity between threads and replies
	err := s.db.Raw(`
        SELECT GREATEST(
            COALESCE((
                SELECT created_at 
                FROM threads 
                WHERE user_id = ? AND deleted_at IS NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            ), '1970-01-01'),
            COALESCE((
                SELECT created_at 
                FROM replies 
                WHERE user_id = ? AND deleted_at IS NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            ), '1970-01-01')
        ) as last_active
    `, userID, userID).Scan(&lastActive).Error

	return lastActive, err
}

func (s *UserService) getActivityMap(userID uint) (map[string]int64, error) {
	activityMap := make(map[string]int64)

	// Get combined activity by month using SQL
	rows, err := s.db.Raw(`
        SELECT DATE_TRUNC('month', activity_date) as month, COUNT(*) as count
        FROM (
            SELECT created_at as activity_date FROM threads 
            WHERE user_id = ? AND deleted_at IS NULL
            UNION ALL
            SELECT created_at FROM replies 
            WHERE user_id = ? AND deleted_at IS NULL
        ) combined_activity
        GROUP BY DATE_TRUNC('month', activity_date)
        ORDER BY month DESC
    `, userID, userID).Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var month time.Time
		var count int64
		if err := rows.Scan(&month, &count); err != nil {
			return nil, err
		}
		activityMap[month.Format("2006-01")] = count
	}

	return activityMap, nil
}

func (s *UserService) GetUserActivity(userID uint, page, pageSize int) (*PaginatedActivity, error) {
	result := &PaginatedActivity{
		Page:     page,
		PageSize: pageSize,
	}

	offset := (page - 1) * pageSize

	// Get total count first
	var totalCount int64
	err := s.db.Raw(`
        SELECT COUNT(*) 
        FROM (
            SELECT id FROM threads WHERE user_id = ? AND deleted_at IS NULL
            UNION ALL
            SELECT id FROM replies WHERE user_id = ? AND deleted_at IS NULL
        ) combined_count
    `, userID, userID).Count(&totalCount).Error

	if err != nil {
		return nil, err
	}
	result.Total = totalCount

	// Get paginated activities
	rows, err := s.db.Raw(`
        SELECT * FROM (
            SELECT 
                'thread' as type,
                id,
                title as content,
                id as thread_id,
                title,
                created_at,
                section
            FROM threads 
            WHERE user_id = ? AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT 
                'reply' as type,
                replies.id,
                replies.content,
                replies.thread_id,
                threads.title,
                replies.created_at,
                NULL as section
            FROM replies 
            LEFT JOIN threads ON threads.id = replies.thread_id
            WHERE replies.user_id = ? AND replies.deleted_at IS NULL
        ) combined_activity
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `, userID, userID, pageSize, offset).Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []Activity
	for rows.Next() {
		var activity Activity
		err := rows.Scan(
			&activity.Type,
			&activity.ID,
			&activity.Content,
			&activity.ThreadID,
			&activity.Title,
			&activity.CreatedAt,
			&activity.Section,
		)
		if err != nil {
			return nil, err
		}
		activities = append(activities, activity)
	}

	result.Activities = activities
	return result, nil
}
