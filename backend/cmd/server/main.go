package main

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/stefvuck/forum/internal/auth"
)

// User model represents a user in the system
type User struct {
	gorm.Model
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"-"`
	Role     string `json:"role"`
	Threads  []Thread
	Replies  []Reply
}

// TODO:
// Middleware to verify @glasgow.ac.uk emails
// func verifyUniversityEmail() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		// Add email verification logic here
// 		c.Next()
// 	}
// }

// Seed the database with initial data
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
	// Initialize database connection
	dsn := "host=localhost user=forumuser password=yourpassword dbname=drones_forum port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database")
	}
	fmt.Println("Successfully connected to database!")

	// Auto migrate the schema
	db.AutoMigrate(&User{}, &Thread{}, &Reply{})
	seedDatabase(db)

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Your Vite dev server
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Define API routes
	api := r.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handleLogin(db))
			auth.POST("/register", handleRegister(db))
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			// Thread routes
			protected.GET("/sections/:section/threads", getThreadsBySection(db))
			protected.GET("/threads/:id", getThread(db))
			protected.POST("/threads", createThread(db))

			// Reply routes
			protected.POST("/threads/:id/replies", createReply(db))
			protected.GET("/threads/:id/replies", getReplies(db))
		}
	}

	// Start the server
	r.Run(":8080")
}

func getUserIdFromToken(c *gin.Context) uint {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return 1 // or handle the error later
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
	claims := &auth.Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return auth.JwtKey, nil
	})

	if err != nil || !token.Valid {
		return 1 // or handle the error later
	}

	return claims.UserID // Return the user ID from the claims
}

func handleLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		var user User
		if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
			c.JSON(401, gin.H{"error": "Invalid credentials"})
			return
		}

		// For now, accept any password (for development)
		token, err := auth.GenerateToken(user.ID, user.Email)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(200, gin.H{
			"token": token,
			"user": gin.H{
				"id":    user.ID,
				"email": user.Email,
				"name":  user.Name,
				"role":  user.Role,
			},
		})
	}
}

// Handle user registration
func handleRegister(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read the raw body
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to read request body"})
			return
		}
		// Log the raw body
		fmt.Println("Raw request body:", string(body))

		// Reset the body so it can be read again
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

		var input struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
			Name     string `json:"name" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if !strings.HasSuffix(input.Email, "@glasgow.ac.uk") {
			c.JSON(400, gin.H{"error": "Must use a Glasgow University email"})
			return
		}

		user := User{
			Email: input.Email,
			Name:  input.Name,
			Role:  "member",
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(400, gin.H{"error": "Email already registered"})
			return
		}

		token, err := auth.GenerateToken(user.ID, user.Email)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(201, gin.H{
			"token": token,
			"user": gin.H{
				"id":    user.ID,
				"email": user.Email,
				"name":  user.Name,
				"role":  user.Role,
			},
		})
	}
}

// Add this middleware function
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		claims := &auth.Claims{} // Use auth.Claims instead of local Claims

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return auth.JwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Next()
	}
}
