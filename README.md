# Smart Attendance Management System (MERN Stack)

A complete MERN-stack web application featuring a sleek, responsive **Glassmorphism UI** with a custom dark theme. It provides student management directories, daily attendance register checks, real-time statistical analytics dashboards, and historical report exports in CSV format.

---

## 🌟 Key Features

*   **📊 Real-time Analytics Dashboard**
    *   Dynamic overview widgets showing total registered students, today's attendance rates, active classes, and at-risk metrics.
    *   Custom SVG-based historical trend graphs (last 7 days' attendance trajectory).
    *   Class-by-class performance metrics and progress bars.
    *   **Critical Alert System**: Instantly highlights students with attendance rates below 75%.
*   **👥 Student Database (CRUD)**
    *   Register, update, view, and delete students.
    *   Automatic generation of unique, collision-proof Student IDs (`STD-XXXX`).
    *   Real-time debounced searches by Student Name, Roll Number, or Student ID.
    *   Class section filter tools.
    *   Cascading deletion logic: removing a student automatically clears their attendance history.
*   **📅 Daily Attendance Register**
    *   Choose any target date and class section.
    *   Toggle status pills for each student: **Present** (Green), **Absent** (Red), **Late** (Orange), or **Excused** (Blue) with custom remarks.
    *   **Bulk Actions**: Mark all students in a class as Present or Absent with a single click.
    *   **High-performance Database Writes**: Saves updates in a single bulk operation using Mongoose `bulkWrite`.
*   **📥 Analytics Reports & CSV Export**
    *   Generate attendance history based on date ranges and class filters.
    *   Interactive data table showing calculated rates, present counts, late instances, and absences.
    *   Download spreadsheet-compatible CSV files containing complete details for administrative tracking.
*   **🔌 Resilient Offline Fallback**
    *   If the database connection is interrupted or credentials are misconfigured, the backend falls back to offline mode instead of crashing.
    *   The frontend detects the offline state and displays a warning status while loading high-fidelity mock calculations, allowing immediate visual evaluations.

---

## 🛠️ Technology Stack

### Backend
*   **Runtime Environment**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB Atlas (with Mongoose ODM)
*   **Routing**: Modular REST API Routers
*   **Packages**: `cors`, `dotenv`, `nodemon` (development)

### Frontend
*   **Framework**: React (Vite-powered SPA)
*   **Icons**: Lucide React
*   **Styling**: Pure Vanilla CSS featuring Custom Variables, CSS Grid/Flexbox layouts, glass backdrops (`backdrop-filter`), and keyframe animations.
*   **Proxy Config**: Vite dev server proxies API calls to the Express backend (avoiding CORS issues).

---

## 📂 Project Architecture

```
stduent-attendance-management-system/
├── backend/
│   ├── config/db.js          # MongoDB connection initializer
│   ├── controllers/          # Business logic handlers
│   ├── models/               # Mongoose schema models
│   ├── routes/               # API route definitions
│   ├── .env                  # Port & database credentials
│   ├── package.json          # Node scripts and dependencies
│   └── server.js             # Express application entry point
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # View components (Dashboard, Students, etc.)
│   │   ├── App.jsx           # App layout coordinator & notifications
│   │   ├── index.css         # Styling system & variables
│   │   └── main.jsx          # React tree bootstrapper
│   ├── vite.config.js        # Vite config with API proxy definitions
│   ├── index.html            # Web app title & viewport meta
│   └── package.json          # Vite scripts and dependencies
│
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Account (local instance or MongoDB Atlas cluster)

### 1. Database Setup
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/attendance?retryWrites=true&w=majority
NODE_ENV=development
```
*Note: A template `.env` has been created with default connection prefixes. Replace it with your actual Atlas cluster URI.*

### 2. Install Dependencies
Run the installation commands in both workspaces:

```bash
# Setup Backend
cd backend
npm install

# Setup Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### 3. Run Development Servers
Start both servers locally to run the app:

**Start Backend Server (Port 5000):**
```bash
cd backend
npm run dev
```

**Start Frontend Server (Port 5173):**
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛰️ REST API Endpoints Map

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Diagnostic check checking database status |
| **GET** | `/api/students` | Get list of students (filtered by name, roll, section) |
| **POST** | `/api/students` | Enroll a new student |
| **PUT** | `/api/students/:id` | Update student profile |
| **DELETE**| `/api/students/:id` | Remove student and clean up attendance logs |
| **GET** | `/api/attendance` | Get attendance checklist for class and date |
| **POST** | `/api/attendance/save`| Save class attendance checklist in bulk |
| **GET** | `/api/attendance/stats/overview` | Fetch dashboard analytics metrics and trends |
| **GET** | `/api/attendance/stats/student/:id` | Fetch metrics for an individual student |
| **GET** | `/api/attendance/export` | Download class attendance history as a CSV file |

---

## 🎨 Visual System & Animations
The application is styled with a custom CSS variables palette:
*   `--bg-primary`: Deep dark background (`#0a0b10`)
*   `--bg-secondary`: Glass widget background (`#11131c`)
*   `--accent-indigo`: Primary interaction colors (`#6366f1`)
*   `--accent-purple`: Accent accents (`#a855f7`)

Cards, modals, and list items feature:
*   Smooth linear translations (`transform: translateY(-5px)` on hover).
*   Glass border color transitions and radial background gradients.
*   Fading notifications and slider panels.
*   Compact, mobile-friendly toggle pill boxes.
