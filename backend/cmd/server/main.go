package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
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

func seedDatabase(db *gorm.DB) {
	// First ensure member role exists
	memberRole := Role{}
	// Fetch the member role again now that we're sure it exists
	if err := db.Where("name = ?", "member").First(&memberRole).Error; err != nil {
		fmt.Println("Error finding member role:", err)
		return
	}

	// Rest of your seeding logic...
	// Create test user with hashed password
	hashedPassword, err := auth.HashPassword("test123")
	if err != nil {
		fmt.Println("Error hashing password:", err)
		return
	}

	user := User{
		Email:    "test@glasgow.ac.uk",
		Name:     "John Doe",
		RoleID:   memberRole.ID,
		Password: hashedPassword,
		Verified: true,
		Bio:      "Test user for the GU Drones Forum",
	}

	// Create the user if they don't exist
	result := db.Where(User{Email: user.Email}).FirstOrCreate(&user)
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

	// Create threads if they don't exist
	for _, thread := range threads {
		result := db.Where(Thread{Title: thread.Title}).FirstOrCreate(&thread)
		if result.Error != nil {
			fmt.Println("Error creating thread:", result.Error)
			continue
		}

		// Create replies for each thread
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

	fmt.Println("Test data seeded successfully!")
}

// Configuration struct to hold all environment variables
type Config struct {
	DBHost      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBPort      string
	JWTSecret   string
	APIUrl      string
	FrontendUrl string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() Config {
	return Config{
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBUser:      getEnv("DB_USER", "forumuser"),
		DBPassword:  getEnv("DB_PASSWORD", "yourpassword"),
		DBName:      getEnv("DB_NAME", "drones_forum"),
		DBPort:      getEnv("DB_PORT", "5432"),
		JWTSecret:   getEnv("JWT_SECRET", "your_jwt_secret_key"),
		APIUrl:      getEnv("API_URL", "http://localhost:8080"),
		FrontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

// getEnv gets an environment variable with a fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// initDB initializes the database connection with retries
func initDB(config Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		config.DBHost,
		config.DBUser,
		config.DBPassword,
		config.DBName,
		config.DBPort,
	)

	var db *gorm.DB
	var err error
	maxRetries := 5
	retryDelay := time.Second * 5

	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			fmt.Println("Successfully connected to database!")
			return db, nil
		}

		fmt.Printf("Failed to connect to database (attempt %d/%d): %v\n", i+1, maxRetries, err)
		time.Sleep(retryDelay)
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts", maxRetries)
}

func main() {
	// Load configuration
	config := LoadConfig()

	// Initialize database connection with retries
	db, err := initDB(config)
	if err != nil {
		panic(err)
	}

	if err := db.AutoMigrate(
		&Role{},   // Roles first (no foreign key dependencies)
		&User{},   // Users depend on roles
		&Thread{}, // Threads depend on users
		&Reply{},  // Replies depend on threads and users
	); err != nil {
		panic("Failed to migrate database: " + err.Error())
	}

	// Check if the database is empty before seeding
	var count int64
	db.Model(&User{}).Count(&count) // Check if there are any users
	if count < 2 {
		// Seed the database with initial data
		seedDatabase(db) // Call to seed the database
	} else {
		fmt.Println("Database already seeded, skipping seeding.")
	}

	// Initialize roles
	if err := initializeRoles(db); err != nil {
		panic("Failed to initialize roles: " + err.Error())
	}

	// Initialize Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.FrontendUrl},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
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
			protected.PATCH("/profile", updateUserProfile(db))
			protected.GET("/profile/stats", getCurrentUserStats(db))
			protected.PATCH("/users/:userId/role", updateUserRole(db))
			protected.GET("/roles", getRoles(db))
			protected.GET("/users", handleGetUsers(db))
			protected.GET("/users/:id/public-profile", getPublicUserProfile(db))
			protected.GET("/users/:id/activity", getUserActivity(db))
		}
	}

	// Start the server
	port := getEnv("PORT", "8080")
	r.Run(":" + port)
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
