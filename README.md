# Sports Scheduler

A full-stack web application for creating, joining, managing, and tracking sports sessions.

Sports Scheduler provides separate Admin and Player experiences. Players can create and join sports sessions, while administrators can manage available sports and view session reports.

## 🚀 Live Application

**Live URL:** https://sports-scheduler-sv7f.onrender.com

## ✨ Features

### 👤 Player Features

- Player registration and login
- Secure session-based authentication
- View available sports
- Create sports sessions
- Select date, time, venue, and sport
- Add existing players to teams
- Specify additional players required
- View sessions created by the player
- Browse available sessions
- Join existing sessions
- View joined sessions separately
- Joined player information is visible to participants
- Prevent joining past sessions
- Cancel sessions created by the player
- Provide a cancellation reason
- Change password
- Forgot password functionality

### 🛡️ Admin Features

- Secure Admin login
- Admin dashboard
- Create and manage available sports
- Admin can create sports sessions
- Admin can join sports sessions
- View session information
- View reports of sessions played
- Analyze sports popularity over a selected period
- Manage sports scheduling activities

### 🔐 Authentication & Security

- Passport.js authentication
- Session-based authentication
- Role-based access control
- Separate Admin and Player permissions
- Password hashing using bcrypt
- Secure production session cookies
- HTTPS-compatible authentication for Render deployment

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap

### Backend
- Node.js
- Express.js
- Passport.js

### Database
- PostgreSQL

### Security
- bcryptjs
- Express Session
- Helmet
- Express Rate Limit

### Deployment
- Render
- GitHub

## 🗄️ Database

The application uses PostgreSQL for storing:

- Users
- Sports
- Sports sessions
- Team information
- Player participation
- Session cancellations
- Password reset information

Database migrations are available in the `migrations/` directory.

## 📁 Project Structure

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
│   ├── js/
│   └── index.html
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── passport/
│   └── routes/
│
├── .env.example
├── package.json
├── server.js
└── README.md