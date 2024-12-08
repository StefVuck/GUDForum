package main

import (
    "github.com/gin-gonic/gin"
    // "github.com/golang-jwt/jwt/v5"
    "gorm.io/gorm"
    "gorm.io/driver/postgres"
    "github.com/gin-contrib/cors"
    "fmt"
    "strconv"
)

// Models
type User struct {
    gorm.Model
    Email     string `json:"email"`
    Name      string `json:"name"`
    Role      string `json:"role"`
    Threads   []Thread
    Replies   []Reply
}

type Thread struct {
    gorm.Model
    Title     string `json:"title"`
    Content   string `json:"content"`
    Section   string `json:"section"`
    UserID    uint   `json:"user_id"`
    User      User   `gorm:"foreignKey:UserID"`
    Replies   []Reply `gorm:"foreignKey:ThreadID"`
}

type Reply struct {
    gorm.Model
    Content   string `json:"content"`
    ThreadID  uint   `json:"thread_id"`
    UserID    uint   `json:"user_id"`
    Thread    Thread `gorm:"foreignKey:ThreadID"`
    User      User   `gorm:"foreignKey:UserID"`
}

// Middleware to verify @glasgow.ac.uk emails
func verifyUniversityEmail() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Add email verification logic here
        c.Next()
    }
}

func seedDatabase(db *gorm.DB) {
    // Create test user
    user := User{
        Email: "test@glasgow.ac.uk",
        Name:  "John Doe",
        Role:  "member",
    }
    result := db.FirstOrCreate(&user, User{Email: "test@glasgow.ac.uk"})
    if result.Error != nil {
        fmt.Println("Error creating user:", result.Error)
        return
    }

    // Create test threads
    threads := []Thread{
        {
            Title:   "Welcome to GU Drones",
            Content: "Welcome everyone! This is the official forum for the Glasgow University Drone Society. Here we'll discuss all things drone-related, from technical builds to competition strategies.",
            Section: "general",
            UserID:  user.ID,
        },
        {
            Title:   "Next Competition Preparation",
            Content: "We need to start preparing for the upcoming drone racing competition in March. Let's discuss our strategy and required equipment.",
            Section: "general",
            UserID:  user.ID,
        },
        {
            Title:   "New Flight Controller Setup",
            Content: "Has anyone had experience setting up the PixHawk 4? We just got one for our new build.",
            Section: "electronics",
            UserID:  user.ID,
        },
    }

    for _, thread := range threads {
        result := db.FirstOrCreate(&thread, Thread{Title: thread.Title})
        if result.Error != nil {
            fmt.Println("Error creating thread:", result.Error)
            continue
        }

        // Create some replies for each thread
        replies := []Reply{
            {
                Content:  "Great to be here! Looking forward to working with everyone.",
                ThreadID: thread.ID,
                UserID:   user.ID,
            },
            {
                Content:  "This is exactly what we needed. Let's make this forum active!",
                ThreadID: thread.ID,
                UserID:   user.ID,
            },
        }

        for _, reply := range replies {
            if err := db.Create(&reply).Error; err != nil {
                fmt.Println("Error creating reply:", err)
            }
        }
    }

    fmt.Println("Database seeded successfully!")
}

func main() {
    // Initialize DB
    dsn := "host=localhost user=forumuser password=yourpassword dbname=drones_forum port=5432 sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("Failed to connect to database")
    }
    fmt.Println("Successfully connected to database!")
    // Auto Migrate the schema
    db.AutoMigrate(&User{}, &Thread{}, &Reply{})
    
    seedDatabase(db)

    r := gin.Default()
    
    // Add CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"},  // Your Vite dev server
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))
    
    // Routes
    api := r.Group("/api")
    {
        // Authentication routes
        auth := api.Group("/auth")
        {
            auth.POST("/login", handleLogin)
            auth.POST("/register", handleRegister)
        }
        
        // Protected routes
        protected := api.Group("/")
        protected.Use(verifyUniversityEmail())
        {
            // Thread routes
            protected.GET("/sections/:section/threads", getThreadsBySection(db))  // Changed from /threads/:section
            protected.GET("/threads/:id", getThread(db))
            protected.POST("/threads", createThread(db))
            
            // Reply routes
            protected.POST("/threads/:id/replies", createReply(db))
            protected.GET("/threads/:id/replies", getReplies(db))
        }
    }
    
    r.Run(":8080")
}

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

func createThread(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var thread Thread
        if err := c.BindJSON(&thread); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        
        // For development, use the first user in the database
        var user User
        if err := db.First(&user).Error; err != nil {
            c.JSON(500, gin.H{"error": "No users found"})
            return
        }
        
        // Set the user ID from our test user
        thread.UserID = user.ID
        
        if err := db.Create(&thread).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        
        // Load the associated user data for the response
        db.Preload("User").First(&thread, thread.ID)
        
        c.JSON(201, thread)
    }
}

// Add these handler functions:
func getThreadWithReplies(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var thread Thread
        threadId := c.Param("id")
        
        if err := db.Preload("Replies").First(&thread, threadId).Error; err != nil {
            c.JSON(404, gin.H{"error": "Thread not found"})
            return
        }
        
        c.JSON(200, thread)
    }
}

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
        reply.UserID = user.ID  // Use the found user's ID
        
        if err := db.Create(&reply).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        
        // Load the user data for the response
        db.Preload("User").First(&reply, reply.ID)
        
        c.JSON(201, reply)
    }
}


// func createReply(db *gorm.DB) gin.HandlerFunc {
//     return func(c *gin.Context) {
//         var reply Reply
//         threadId := c.Param("id")
//
//         if err := c.BindJSON(&reply); err != nil {
//             c.JSON(400, gin.H{"error": err.Error()})
//             return
//         }
//
//         // Convert threadId to uint
//         var threadID uint
//         if id, err := strconv.ParseUint(threadId, 10, 32); err == nil {
//             threadID = uint(id)
//         } else {
//             c.JSON(400, gin.H{"error": "Invalid thread ID"})
//             return
//         }
//
//         reply.ThreadID = threadID
//
//         if err := db.Create(&reply).Error; err != nil {
//             c.JSON(500, gin.H{"error": err.Error()})
//             return
//         }
//
//         c.JSON(201, reply)
//     }
// }

func sendNewThreadNotification(thread Thread) {
    // Novu notification logic will go here
}

func handleLogin(c *gin.Context) {
    // Implement login logic here
}

func handleRegister(c *gin.Context) {
    // Implement registration logic here
}

func getThread(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var thread Thread
        threadId := c.Param("id")
        
        fmt.Printf("Fetching thread ID: %s\n", threadId)
        
        if err := db.Preload("User").
                    Preload("Replies").
                    Preload("Replies.User").
                    First(&thread, threadId).Error; err != nil {
            if err == gorm.ErrRecordNotFound {
                fmt.Printf("Thread not found: %s\n", threadId)
                c.JSON(404, gin.H{"error": "Thread not found"})
                return
            }
            fmt.Printf("Error fetching thread: %v\n", err)
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        
        fmt.Printf("Found thread with %d replies\n", len(thread.Replies))
        c.JSON(200, thread)
    }
}

func getUserIdFromToken(c *gin.Context) uint {
    // Implement logic to extract user ID from token
    return 0 // Placeholder return
}
