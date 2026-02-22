# Event Management Platform

## Tech Stack & Libraries Used

### Frontend
- **React**: Component-based UI rendering, efficient state management, and virtual DOM for fast updates.
- **Vite**: Ultra-fast development server & optimized build tool replacing Create React App.
- **React Router Dom**: Client-side routing to seamlessly navigate between Participant, Organizer, and Admin dashboards without page reloads.
- **Tailwind CSS**: Utility-first styling to build modern, responsive, and highly customizable interfaces quickly.
- **Axios**: Promised-based HTTP client for making API requests to the backend with clean interception for auth tokens.
- **Socket.io-client**: Enables real-time, bi-directional communication for the live discussion forum.
- **React Hot Toast**: Beautiful and lightweight notifications for user actions (success/error messages).
- **Html5-Qrcode**: Used to scan participant QR codes through the device camera for fast attendance tracking.

### Backend
- **Node.js & Express.js**: Fast, non-blocking, asynchronous runtime with a lightweight framework to handle RESTful APIs.
- **MongoDB & Mongoose**: NoSQL database for flexible data modeling (Events, Users, Forms, Registrations) and ODM for schema validation and typed querying.
- **Socket.io**: WebSockets server for enabling real-time chat in the discussion forums.
- **JsonWebToken (JWT)**: Stateless, secure authentication strategy to verify user sessions and roles.
- **Bcryptjs**: Password hashing before storing in the database to ensure security.
- **Nodemailer**: SMTP client for sending automated emails (event tickets, QR codes, password resets).
- **Qrcode**: Generates the QR code data URLs embedded in the tickets.
- **Cloudinary & Multer**: Handles user file uploads intuitively by streaming them directly to cloud storage.
- **Dotenv**: Environment variable management to keep secrets secure.

---

## 🔥 Advanced Features Implemented

### Tier A (Core Advanced Features)
**1. Hackathon Team Registration**
- **Justification:** Many events (like hackathons or case studies) are inherently team-based. Giving participants an automated way to form teams enhances user experience.
- **Design & Approach:** Created `Team` model referencing the `Event`. A user creates a team and becomes the "Leader", generating a unique 8-character `inviteCode`. Others join via this code.
- **Technical Decisions:** Implemented custom form validation for *every* member. Registration is triggered explicitly by the leader when the minimum size is met, and a single QR code is attached only to the leader's ticket to streamline entry.

**2. QR Scanner & Attendance Tracking**
- **Justification:** Managing entry for large events manually is tedious. A scanner eliminates bottlenecks at the venue.
- **Design & Approach:** Built a dedicated `AttendanceScanner` React component using `html5-qrcode` accessing the device camera. The backend verifies the decoded JSON ticket payload against the database.
- **Technical Decisions:** Tracks whether a ticket has already been scanned to reject duplicates. Live table updates with "Present" tags, and CSV export functionality implemented for the organizer dashboard.

### Tier B (Real-time & Communication Features)
**1. Real-Time Discussion Forum**
- **Justification:** Participants need a place to clarify doubts directly with organizers and interact with peers.
- **Design & Approach:** Integrated Socket.io rooms specific to each `eventId`. 
- **Technical Decisions:** Only registered participants and the event organizer can view and interact with the socket namespace. Organizers have administrative privileges (like deleting inappropriate messages). Added an unread message badge notification.

**2. Organizer Password Reset Workflow**
- **Justification:** Essential fail-safe for organizers who lose access without automatically granting them arbitrary access (requires Admin oversight).
- **Design & Approach:** Built a `PasswordResetRequest` collection. Organizers submit requests -> Admins see a dashboard of requests -> Admin Approves/Rejects.
- **Technical Decisions:** Upon Admin approval, a secure temporary password is automatically generated, hashed, updated in the DB, and sent directly to the organizer's email using Nodemailer.

### Tier C (Integration & Enhancement Features)
**1. Bot Protection (reCAPTCHA v3)**
- **Justification:** Protects the platform from spam bot registrations and brute-force logins.
- **Technical Decisions:** Integrated Google's invisible reCAPTCHA on the Auth pages using the programmatic `window.grecaptcha.execute()` method instead of a clunky checkbox.

---

## 🛠 Setup and Installation Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Database (Local or MongoDB Atlas)
- Cloudinary Account (for file uploads)
- Gmail App Password (for Nodemailer)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and configure the following variables:
   ```env
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-very-secure-secret>
   PORT=5000
   EMAIL_SERVICE=gmail
   EMAIL_USER=<your-gmail-address>
   EMAIL_PASSWORD=<your-gmail-app-password>
   FRONTEND_URL=http://localhost:3000
   ADMIN_EMAIL=admin@felicity.iiit.ac.in
   ADMIN_PASSWORD=admin123
   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<your-api-secret>
   ```
4. Start the backend server:
   ```bash
   node server.js
   # or with nodemon: npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder with your reCAPTCHA site key (and backend URL if modified):
   ```env
   VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` (or `3001` depending on Vite's assignment).
