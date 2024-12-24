package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/stefvuck/forum/internal/auth"
)

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
	// First ensure roles exist
	memberRole := Role{
		Name:  "member",
		Color: "#808080",
		Permissions: map[string]bool{
			"can_create_threads": true,
			"can_reply":          true,
		},
	}

	// Create the member role if it doesn't exist
	var existingRole Role
	if err := db.Where("name = ?", "member").First(&existingRole).Error; err != nil {
		if err := db.Create(&memberRole).Error; err != nil {
			fmt.Println("Error creating member role:", err)
			return
		}
	} else {
		memberRole = existingRole
	}

	// Create test user
	user := User{
		Email:  "test@glasgow.ac.uk",
		Name:   "John Doe",
		RoleID: memberRole.ID, // Use the role ID instead of role name
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

	if err := initializeRoles(db); err != nil {
		panic("Failed to initialize roles: " + err.Error())
	}
	// seedDatabase(db)

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Your Vite dev server
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
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
			auth.GET("/verify", handleVerifyEmail(db))
			auth.POST("/validate", validateToken)
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
			protected.GET("/search", handleSearch(db))

			// User and role management routes
			protected.GET("/profile", getCurrentUserProfile(db))
			protected.GET("/profile/stats", getCurrentUserStats(db))
			protected.PATCH("/users/:userId/role", updateUserRole(db))
			protected.GET("/roles", getRoles(db))
			protected.GET("/users", handleGetUsers(db))
			protected.GET("/users/:id/public-profile", getPublicUserProfile(db))
			protected.GET("/users/:id/activity", getUserActivity(db))
		}
	}

	// Start the server
	r.Run(":8080")
}

// Helper function for getting UserID from token

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

/*

Login/Register Handling

*/

func handleRegister(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
			Name     string `json:"name" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if !strings.HasSuffix(input.Email, "@student.gla.ac.uk") {
			c.JSON(400, gin.H{"error": "Must use a Glasgow University email"})
			return
		}

		// Get the default member role
		var memberRole Role
		if err := db.Where("name = ?", "member").First(&memberRole).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to get default role"})
			return
		}

		// Hash password
		hashedPassword, err := auth.HashPassword(input.Password)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to process password"})
			return
		}

		// Generate verification token
		verifyToken := make([]byte, 32)
		if _, err := rand.Read(verifyToken); err != nil {
			c.JSON(500, gin.H{"error": "Failed to generate verification token"})
			return
		}
		token := base64.URLEncoding.EncodeToString(verifyToken)

		user := User{
			Email:         input.Email,
			Name:          input.Name,
			Password:      hashedPassword,
			RoleID:        memberRole.ID, // Use the role ID
			Verified:      false,
			VerifyToken:   token,
			VerifyExpires: time.Now().Add(48 * time.Hour),
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(400, gin.H{"error": "Email already registered"})
			return
		}

		// TODO: Send verification email
		c.JSON(201, gin.H{
			"message":      "Registration successful. Please check your email to verify your account.",
			"verify_token": token, // Remove this in production
		})
	}
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

		// Preload the Role relationship
		if err := db.Preload("Role").Where("email = ?", input.Email).First(&user).Error; err != nil {
			c.JSON(401, gin.H{"error": "Invalid credentials"})
			return
		}

		if !user.Verified {
			c.JSON(403, gin.H{"error": "Please verify your email before logging in"})
			return
		}

		if !auth.CheckPasswordHash(input.Password, user.Password) {
			c.JSON(401, gin.H{"error": "Invalid credentials"})
			return
		}

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

func handleVerifyEmail(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			c.JSON(400, gin.H{"error": "Verification token required"})
			return
		}

		var user User
		result := db.Where("verify_token = ? AND verify_expires > ?", token, time.Now()).First(&user)
		if result.Error != nil {
			c.JSON(400, gin.H{"error": "Invalid or expired verification token"})
			return
		}

		user.Verified = true
		user.VerifyToken = "" // Clear the token
		if err := db.Save(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to verify email"})
			return
		}

		c.JSON(200, gin.H{"message": "Email verified successfully"})
	}
}

/*

General Auth Middleware Logic

*/

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

// ValidateToken checks if the provided token is valid
func validateToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(401, gin.H{"error": "Authorization header required"})
		return
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
	claims := &auth.Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return auth.JwtKey, nil
	})

	if err != nil || !token.Valid {
		c.JSON(401, gin.H{"error": "Invalid token"})
		return
	}

	c.JSON(200, gin.H{"valid": true}) // Token is valid
}
