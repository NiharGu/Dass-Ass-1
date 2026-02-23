# Event Management Platform

## 📚 Tech Stack & Libraries Used

### Frontend Libraries & Frameworks
| Library / Framework | Problem Solved | Justification |
| :--- | :--- | :--- |
| **React** | Creating dynamic, state-driven interfaces. | Chose React for its component-based architecture, which allows for highly reusable UI elements (like event cards and forms), efficient state management, and high performance via the Virtual DOM. |
| **Vite** | Slow local development server and build tooling. | Replaced traditional Create React App (CRA) with Vite because of its near-instant Hot Module Replacement (HMR) and significantly faster build times, keeping development friction low. |
| **Tailwind CSS** | Writing complex, repetitive CSS and managing class names. | Serves as the primary UI framework. Used for utility-first styling to build modern, responsive, and highly customizable interfaces quickly without maintaining separate CSS files. |
| **React Router Dom** | Managing navigation without page reloads. | Essential for Single Page Applications (SPAs). It provides clean client-side routing to seamlessly navigate between Participant, Organizer, and Admin dashboards. |
| **Axios** | Handling HTTP requests and interceptors clearly. | Chosen over native `fetch` because it automatically transforms JSON data and provides a robust interceptor API, which is critical for consistently injecting JWT auth tokens into request headers. |
| **Socket.io-client** | Real-time communication for the frontend. | Required to listen for pushed events from the backend to enable the live unread message badges and real-time chat in the discussion forum. |
| **React Hot Toast** | Managing user feedback (success/error popups). | Provides beautiful, easily configurable, and lightweight notifications for user actions, significantly improving UX compared to native browser alerts. |
| **Html5-Qrcode** | Reading QR codes directly from the browser. | Solves the problem of needing native apps for event entry. It directly accesses the device camera to scan participant QR codes for fast attendance tracking. |

### Backend Libraries & Modules
| Library / Framework | Problem Solved | Justification |
| :--- | :--- | :--- |
| **Node.js & Express.js** | Handling RESTful APIs and middleware. | Node.js provides a fast, non-blocking asynchronous runtime. Express.js was chosen for its lightweight, unopinionated routing engine and vast middleware ecosystem. |
| **MongoDB & Mongoose** | Flexible data modeling and querying. | MongoDB (NoSQL) easily adapts to highly dynamic data (like custom forms). Mongoose provides ODM features to enforce schema validation and typed querying. |
| **Socket.io** | WebSockets server for real-time bidirectionality. | Chosen for its robust fallback mechanisms and easy implementation of "rooms" for enabling event-specific real-time chat in the discussion forums. |
| **JsonWebToken (JWT)** | Secure authentication and authorization. | Allows for a stateless, secure authentication strategy to verify user sessions and dynamically protect routes based on user roles without constantly querying the database. |
| **Bcryptjs** | Securing user passwords. | Chosen to hash all user passwords before storing them in the database, preventing plain-text data breaches. |
| **Nodemailer** | Sending automated transactional emails. | A robust SMTP client for Node used to reliably send automated emails containing event tickets, QR codes, and password reset links. |
| **Qrcode** | Generating encoded QR code images. | Needed to take the JSON registration payload and generate base64 QR code data URLs embedded directly into the ticket emails. |
| **Cloudinary & Multer** | Handling and storing user media reliably. | Solves the problem of storing images locally which breaks in serverless environments. Uploads are intuitively streamed directly to Cloudinary cloud storage via Multer. |

---

## Advanced Features Implemented

### Tier A (Core Advanced Features)
**1. Hackathon Team Registration**
- **Justification / Selection Reason:** Many technical events (like hackathons or case studies) are inherently team-based. Giving participants an automated way to form teams enhances user experience and significantly reduces organizer overhead.
- **Explanation of Design & Approach:** Created a distinct `Team` mongoose model referencing the parent `Event`. A user creates a team and becomes the "Leader", generating a unique 8-character `inviteCode`. Other users can request to join using this specific code.
- **Technical Decisions:** 
  - Implemented custom dynamic form validation iteratively for *every* individual member of the team.
  - Registration execution is intentionally decoupled from team creation—it must be triggered explicitly by the leader only when the minimum required team size is met.
  - Generates a single unified QR code attached only to the leader's ticket to streamline bulk team entry at the actual venue.

**2. QR Scanner & Attendance Tracking**
- **Justification / Selection Reason:** Managing physical entry for large-scale events manually via spreadsheets is tedious and prone to errors. An integrated scanner eliminates physical bottlenecks at the venue.
- **Explanation of Design & Approach:** Built a dedicated `AttendanceScanner` React component accessing the device camera. The backend verifies the decoded JSON ticket payload against the `Registration` database collection.
- **Technical Decisions:** 
  - Tracks a boolean/status on whether a ticket has already been scanned to actively reject duplicate entries. 
  - Provides a real-time table update pushing "Present" tags directly to the UI.
  - Implemented CSV export functionality directly from the MongoDB cursor for post-event reporting.

### Tier B (Real-time & Communication Features)
**1. Real-Time Discussion Forum**
- **Justification / Selection Reason:** Participants frequently need a localized place to clarify doubts directly with organizers and interact with peers without leaving the platform.
- **Explanation of Design & Approach:** Integrated Socket.io namespaces and segregated communication into isolated "rooms", specifically mapped to each `eventId`. 
- **Technical Decisions:** 
  - Decided to strongly restrict forum access—only explicitly registered participants and the event organizer can emit or listen to the socket namespace for that specific event.
  - Granted organizers administrative privileges (like deleting inappropriate messages) via socket broadcasts. 
  - Engineered an atomic unread message badge notification counter logic tied to user sessions.

**2. Organizer Password Reset Workflow**
- **Justification / Selection Reason:** Event organizers frequently lose access. However, automatically granting arbitrary access resets poses a severe security risk, necessitating Admin oversight.
- **Explanation of Design & Approach:** Built a distinct `PasswordResetRequest` collection. Organizers submit requests -> Admins review a dedicated dashboard panel -> Admin Approves/Rejects the request.
- **Technical Decisions:** 
  - Decoupled the reset implementation: Upon Admin approval, instead of sending a link, a secure temporary alphanumeric password is automatically generated, hashed via bcrypt, updated in the DB, and sent directly to the organizer's email using Nodemailer.

### Tier C (Integration & Enhancement Features)
**1. Bot Protection (reCAPTCHA v3)**
- **Justification / Selection Reason:** Event platforms are highly susceptible to spam bot registrations and brute-force credential stuffing.
- **Explanation of Design & Approach:** Integrated Google's invisible reCAPTCHA directly on the unified Auth endpoints (Login and Register).
- **Technical Decisions:** Decided against traditional image-based captchas preferring an invisible v3 integration via the programmatic `window.grecaptcha.execute()` method to ensure security without negatively impacting the user conversion funnel with clunky checkboxes.

---

## 🛠 Setup and Installation Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Database (Local instance or MongoDB Atlas)
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
3. Create a `.env` file in the `backend` folder and configure the following required variables:
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
   npm run dev
   # Runs locally on http://localhost:5000
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
3. Create a `.env` file in the `frontend` folder with your reCAPTCHA site key and backend URL mapping:
   ```env
   VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` (or `http://localhost:5173` depending on Vite's port allocation).
