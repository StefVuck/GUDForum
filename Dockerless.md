# Dockerless Setup Guide

Should you want to run this without using docker, you can follow the following steps:


# Running it all
First setup the DB, as explained in the [Database Guide](#Database-Guide)

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
```sql
# Create user and database
CREATE USER forumuser WITH PASSWORD 'yourpassword';
CREATE DATABASE drones_forum;
GRANT ALL PRIVILEGES ON DATABASE drones_forum TO forumuser;
```
```bash
# Navigate to the project's backend directory
cd backend/db/init

# Connect and run initialization script
psql -U forumuser -d drones_forum -f 01_init.sql

\q
```
