# Forum for Glasgow Univesity Drone Society

This project is structured into a backend and frontend. The backend is built using Go and Gin framework, handling API requests and database interactions. The frontend is built using a React web framework, handling user interface and client-side logic.

## Running the Project
If you have docker setup you simply need to run:
```bash
docker-compose up
```
Or for a hard reboot (including the DB):
```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build
```

If for some reason docker isnt an option, please refer to [Dockerless Guide](https://github.com/StefVuck/GUDForum/blob/main/Dockerless.md)

# Demonstration (Outdated)
![image](https://github.com/user-attachments/assets/8d4b0faa-2642-4a43-bfec-61a774975893)

## Registration Funcitonality
![image](https://github.com/user-attachments/assets/52c18330-bcb1-44c7-a1b4-f561775c43f5)
![image](https://github.com/user-attachments/assets/17b78d11-b523-42df-b5c5-2c546a1cc774)

In production, users must verify their token received in their email in order to register, in addition to this, only users with a valid glasgow student email (@student.gla.ac.uk) can register

## Search Functionality
#### Basic Search
![image](https://github.com/user-attachments/assets/136c6eab-12f7-45d3-a75b-a53c61bc4d59)

#### Advanced Search
![image](https://github.com/user-attachments/assets/42f262f5-1d61-4d8a-9233-c3fae5f7306e)
![image](https://github.com/user-attachments/assets/83ad7537-877a-47ec-aeb8-f9a54e345dc0)

## Thread Creation
![image](https://github.com/user-attachments/assets/120973b6-b49f-4369-bc18-4547062b723f)
![image](https://github.com/user-attachments/assets/28a4f801-f690-4b3a-bdd2-8c10ea80d73c)
![image](https://github.com/user-attachments/assets/710f6a63-57e6-4ac2-81ed-544d2514b09e)
![image](https://github.com/user-attachments/assets/209ffaeb-e131-454e-b717-fba55e3b431c)

## Reply Creation
![image](https://github.com/user-attachments/assets/557e944a-90bf-4624-9eb2-028e7c9205b9)


# Structure 
The project is divided into two main directories: `backend` and `frontend`.

The `backend` directory contains the server-side code, which is written in Go. It has the following subdirectories:

* `cmd`: This directory contains the main entry points for the backend application. This holds the main file, which acts as the main starting point for the server, handling Routing, as well as the general DB connection and population logic

* `internal`: This directory contains internal packages that are used by the backend application. It has one subdirectory: `auth`, which contains authentication-related logic.

The `frontend` directory contains the client-side code, which is written in TypeScript and uses React. It has the following subdirectories:

* `src`: This directory contains the source code for the frontend application. It has several subdirectories:
	+ `components`: This directory contains reusable React components. It has several subdirectories, each containing a specific type of component (e.g. `auth`, `common`, `forum`, `layout`).
	+ `config`: This directory contains configuration files for the frontend application.
	+ `context`: This directory contains context-related logic, such as authentication for the frontend application.
	+ `services`: This directory contains service-related logic, such as api connection for the frontend application.
	+ `types`: This directory contains type definitions, such as Thread, User, Reply, Section for the frontend application.
* `config files`: This section contains configuration files for the frontend application.


# For Development:
To extend routes in the backend API, you can follow these general steps:

### Extending Existing Routes

* Identify the route you want to extend and locate its corresponding handler function in the code.
* Determine what additional functionality you want to add to the route.
* Update the handler function to include the new functionality.
* Use the `db` object to query the database and retrieve any required data.
* Use the `c.JSON()` function to return the response in JSON format.


### Extending Existing GET Routes

To create the `getUserProfile` route, you can add additional query parameters or modify the database query to include more data. The pseudocode structure for this extension would be:

Backend:
* Define the input parameters for the route (e.g. user ID, query parameters)
* Validate the input parameters
* Query the database to retrieve the user's profile information
* Modify the database query to include additional data (e.g. user's threads, replies)
* Return the user's profile information in JSON format

Frontend:
* Add route to api.ts

Example in Go:

```go
// Example of extending getUserProfile route
func getUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			UserID uint `json:"user_id" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		userID := getUserIdFromToken(c)

		// Validate the user ID
		if userID == 0 {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}

		// Query the database to retrieve the user's profile information
		var user User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(404, gin.H{"error": "User not found"})
			return
		}

		// Modify the database query to include additional data
		var threads []Thread
		if err := db.Model(&user).Association("Threads").Find(&threads).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to retrieve user's threads"})
			return
		}

		// Return the user's profile information in JSON format
		c.JSON(200, gin.H{
			"user": user,
			"threads": threads,
		})
	}
}
```

Remembering also to add this route in [main.go](https://github.com/StefVuck/GUDForum/blob/main/backend/cmd/server/main.go)
```go
	// Define API routes
	api := r.Group("/api")
	{
        // Existing Sections ...
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
            // Existing Routes...

            // Profile Routes
            protected.POST("/users/:id", getUserProfile(db))
		}
	}
```
Example in Frontend:
In [api.ts](https://github.com/StefVuck/GUDForum/blob/main/frontend/src/services/api.ts)
```typescript
export const api = {
  // ... existing functions

  getUserProfile: async (userId: number) => {
    const response = await fetchApi(`/users/${userId}`);
    return response;
  },
};
```





### Extending Existing POST/PUT Routes

To create the `updateUserProfile` route, you can modify the database query to update the user's profile information with additional data. The pseudocode structure for this extension would be:

Backend:
* Define the input parameters for the route (e.g. user ID, updated profile information)
* Validate the input parameters
* Query the database to update the user's profile information
* Modify the database query to update additional data (e.g. user's profile picture, bio)
* Return the updated user's profile information in JSON format

Frontend:
* Add route to api.ts

Example in Go:

```go
// Example of extending updateUserProfile route
func updateUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Name   string `json:"name" binding:"required"`
			Email  string `json:"email" binding:"required"`
			Bio    string `json:"bio" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		userID := getUserIdFromToken(c)

		// Validate the user ID
		if userID == 0 {
			c.JSON(400, gin.H{"error": "Invalid user ID"})
			return
		}


		// Query the database to update the user's profile information
		var user User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(404, gin.H{"error": "User not found"})
			return
		}

		// Update the user's profile information
		user.Name = input.Name
		user.Email = input.Email
		user.Bio = input.Bio

		if err := db.Save(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to update user's profile"})
			return
		}

		// Return the updated user's profile information in JSON format
		c.JSON(200, gin.H{
			"user": user,
		})
	}
}
```

Remembering also to add this route in [main.go](https://github.com/StefVuck/GUDForum/blob/main/backend/cmd/server/main.go)
```go
	// Define API routes
	api := r.Group("/api")
	{
        // Existing Sections ...
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
            // Existing Routes...

            // Profile Routes
            protected.PUT("/users/:id", updateUserProfile(db))
		}
	}
```

Example in Frontend:
In [api.ts](https://github.com/StefVuck/GUDForum/blob/main/frontend/src/services/api.ts)
```typescript
export const api = {
  // ... existing functions

  updateUserProfile: async (userId: number, profileData: { name: string; email: string; bio: string }) => {
    const response = await fetchApi(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response;
  },
};
```

## To-Do List:

The to-do list can be found in the form of github issues here:
[Issues](https://github.com/StefVuck/GUDForum/issues)
