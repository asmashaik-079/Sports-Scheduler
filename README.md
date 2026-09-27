# Sports Scheduler

Sports Scheduler is a full-stack web application that allows players to create, join, manage, and cancel sports sessions. Administrators can manage available sports and view reports of completed sessions.

The application provides separate features for Admin and Player users with secure authentication and role-based access.

## Features

### Player Features

- Player registration and login
- Create a new sports session
- Select a sport
- Select players and teams
- Specify additional players required
- Set date, time, and venue
- View available sports sessions
- Join existing sessions
- View joined sessions separately
- View sessions created by the player
- Cancel sessions created by the player
- Provide a cancellation reason
- View cancelled session details
- Change password
- Prevent joining past sessions

### Admin Features

- Admin login
- Create and manage available sports
- Create sports sessions
- Join sports sessions
- View all sessions
- View attendance/session details
- View reports of completed sessions
- Analyze sports popularity for a selected period
- Change password

## Authentication

The application uses session-based authentication with Passport.js.

There are two user roles:

- **Admin**
- **Player**

Role-based middleware is used to protect admin-only features.

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- Passport.js
- HTML5
- CSS3
- JavaScript
- REST APIs
- Git & GitHub
- Render

## Database

PostgreSQL is used as the database.

The database contains information related to:

- Users
- Sports
- Sessions
- Teams
- Session participants
- Password reset functionality

Database schema and changes are maintained using SQL migration files.

## Project Structure

```text
Sports-Scheduler/
│
├── migrations/
│   ├── 01_initial_schema.sql
│   ├── 02_add_teams.sql
│   └── 03_password_reset.sql
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── ui.js
│   │   └── components/
│   │       ├── account.js
│   │       ├── admin.js
│   │       ├── auth.js
│   │       └── player.js
│   │
│   └── index.html
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── sessionController.js
│   │   └── sportController.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── passport/
│   │   └── config.js
│   │
│   └── routes/
│       ├── auth.js
│       ├── health.js
│       ├── reports.js
│       ├── sessions.js
│       └── sports.js
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md

### Step 2

**Click after that closing ` ``` ` and press Enter.**

Then paste this:

```md
## Screenshots

### Homepage

![Homepage](Screenshots/homepage.png)

### Admin Dashboard

![Admin Dashboard](Screenshots/Admin-dashboard.png)

### Admin Reports

![Admin Reports](Screenshots/admin-reports.png)

### Available Sessions

![Available Sessions](Screenshots/available-sessions.png)

### Create Session

![Create Session](Screenshots/create-session.png)

### Create Session - Team Selection

![Create Session Team Selection](Screenshots/create-session-team-selection.png)

### Create Session - Details

![Create Session Details](Screenshots/create-session-details.png)

### My Created Sessions

![My Created Sessions](Screenshots/my-created.png)

### My Joined Sessions

![My Joined Sessions](Screenshots/my-joined.png)

### Cancelled Session

![Cancelled Session](Screenshots/cancelled-session.png)

### Cancelled Session Details

![Cancelled Session Details](Screenshots/cancelled-session-details.png)

### Change Password

![Change Password](Screenshots/change-password.png)

## Live Application

https://sports-scheduler-sv7f.onrender.com

## Demo Video

<!-- Add your demo video link here -->