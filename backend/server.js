const dotenv = require("dotenv");
// Load environment variables FIRST, before any modules that use them
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoute = require("./routes/authRoute");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const organizerRoutes = require("./routes/organizerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const teamRoutes = require("./routes/teamRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const forumRoutes = require("./routes/forumRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const server = http.createServer(app);

// Shared CORS options
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
};

// Socket.IO setup
const io = new Server(server, {
    cors: corsOptions
});

app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
    socket.on("joinEvent", (eventId) => {
        socket.join(`event-${eventId}`);
    });
    socket.on("leaveEvent", (eventId) => {
        socket.leave(`event-${eventId}`);
    });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/events", eventRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/organizers", organizerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/upload", uploadRoutes);

// Basic route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Event Management API" });
});

// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

