# Forum for Glasgow Univesity Drone Society

This project is structured into a backend and frontend. The backend is built using Go and Gin framework, handling API requests and database interactions. The frontend is built using a React web framework, handling user interface and client-side logic.

# Demonstration
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


# Running it all
For now, then easiest way is to start up two terminal windows, one in backend/, one in frontend/

In `frontend` you should run:
```bash
npm install
npm run dev
```

In `backend` you should run:
```
go run cmd/server/*.go
```

### Extra Export
`export JWT_SECRET="your-secure-secret-key"`

### Database Guide 
Setting Up a PostgreSQL Database for the Forum Application
This guide will help you set up a PostgreSQL database on Windows, macOS, and Linux to work with the forum application.
Prerequisites
- Ensure you have Go installed on your machine.
- Install PostgreSQL on your system.
### Step 1: Install PostgreSQL
#### Windows
1. Download the PostgreSQL installer from the official website.
2. Run the installer and follow the prompts to install PostgreSQL.
3. During installation, set a password for the postgres user and remember it.

#### macOS
1. You can install PostgreSQL using Homebrew. Open your terminal and run:
`brew install postgresql`
2. After installation, start the PostgreSQL service:
`brew services start postgresql`

#### Linux
For Debian-based distributions (like Ubuntu), run:
```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
```
2. For Red Hat-based distributions (like CentOS), run:
```bash
   sudo yum install postgresql-server postgresql-contrib
```
3. After installation, initialize the database and start the service:
```bash
   sudo service postgresql start
```
### Step 2: Create a Database and User
Open the PostgreSQL command line interface (psql) as the postgres user:
`psql -U postgres`
You may need to enter the password you set during installation.
Create a new database for the forum application:
```sql
-- First, disconnect all users and drop the database
DROP DATABASE IF EXISTS drones_forum;

-- Create the new database
CREATE DATABASE drones_forum;

-- Create user if not exists
CREATE USER forumuser WITH PASSWORD 'yourpassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE drones_forum TO forumuser;

-- Connect to the new database and create tables
\c drones_forum

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    verified BOOLEAN DEFAULT FALSE,
    verify_token VARCHAR(255),
    verify_expires TIMESTAMP WITH TIME ZONE
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    section VARCHAR(50) NOT NULL,
    tags TEXT,
    views INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    content TEXT NOT NULL,
    thread_id INTEGER REFERENCES threads(id),
    user_id INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_replies_thread_id ON replies(thread_id);
CREATE INDEX idx_replies_user_id ON replies(user_id);
CREATE INDEX idx_threads_section ON threads(section);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_threads_tags ON threads USING gin(to_tsvector('english', tags));
CREATE INDEX idx_threads_title ON threads USING gin(to_tsvector('english', title));
CREATE INDEX idx_threads_content ON threads USING gin(to_tsvector('english', content));

\q
```


## Structure (Outdated post v0.1.0)
The full repo structure at the moment of writing is:
```
├── ReadME.md
├── backend
│   ├── cmd
│   │   ├── main
│   │   └── server
│   │       ├── main.go
│   │       ├── reply.go
│   │       └── thread.go
│   ├── go.mod
│   ├── go.sum
│   ├── internal
│   │   ├── auth
│   │   │   └── auth.go
│   │   ├── config
│   │   ├── handlers
│   │   ├── models
│   │   ├── repository
│   │   └── services
│   └── pkg
│       └── utils
├── docker
└── frontend
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── public
    │   └── vite.svg
    ├── src
    │   ├── App.css
    │   ├── App.tsx
    │   ├── assets
    │   │   └── react.svg
    │   ├── components
    │   │   ├── auth
    │   │   │   └── AuthModal.tsx
    │   │   ├── common
    │   │   │   └── MarkdownContent.tsx
    │   │   ├── forum
    │   │   │   ├── CreateThreadModal.tsx
    │   │   │   ├── ReplySection.tsx
    │   │   │   ├── ThreadCard.tsx
    │   │   │   ├── ThreadList.tsx
    │   │   │   └── ThreadView.tsx
    │   │   └── layout
    │   │       └── Sidebar.tsx
    │   ├── config
    │   │   └── sections.ts
    │   ├── context
    │   │   └── AuthContext.tsx
    │   ├── hooks
    │   ├── index.css
    │   ├── main.tsx
    │   ├── services
    │   │   └── api.ts
    │   ├── styles
    │   ├── types
    │   │   └── index.ts
    │   ├── utils
    │   └── vite-env.d.ts
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

However this can be simplified to:
```
├── ReadME.md
├── backend
│   ├── cmd
│   │   └── server
│   │       ├── main.go
│   │       ├── reply.go
│   │       └── thread.go
│   └── internal
│       └── auth
│           └── auth.go
└── frontend
    ├── src
    │   ├── App.tsx
    │   │   └── react.svg
    │   ├── components
    │   │   ├── auth
    │   │   │   └── AuthModal.tsx
    │   │   ├── common
    │   │   │   └── MarkdownContent.tsx
    │   │   ├── forum
    │   │   │   ├── CreateThreadModal.tsx
    │   │   │   ├── ReplySection.tsx
    │   │   │   ├── ThreadCard.tsx
    │   │   │   ├── ThreadList.tsx
    │   │   │   └── ThreadView.tsx
    │   │   └── layout
    │   │       └── Sidebar.tsx
    │   ├── config
    │   │   └── sections.ts
    │   ├── context
    │   │   └── AuthContext.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   ├── services
    │   │   └── api.ts
    │   └── types
    │       └── index.ts
    │   
    └── config files
```

The tree represents the directory structure of the project. The project is divided into two main directories: `backend` and `frontend`.

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
