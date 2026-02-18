import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/auth/Onboarding';

// Participant
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import ParticipantProfile from './pages/participant/Profile';
import Clubs from './pages/participant/Clubs';
import OrganizerDetail from './pages/participant/OrganizerDetail';

// Organizer
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import OrganizerEventDetail from './pages/organizer/EventDetail';
import EditEvent from './pages/organizer/EditEvent';
import OrganizerProfile from './pages/organizer/Profile';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResets from './pages/admin/PasswordResets';

function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'organizer') return <Navigate to="/organizer/dashboard" />;
  return <Navigate to="/dashboard" />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Routes>
        {/* Public / Auth */}
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Participant */}
        <Route path="/onboarding" element={<ProtectedRoute role="participant"><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="participant"><ParticipantDashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute role="participant"><BrowseEvents /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute role="participant"><EventDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="participant"><ParticipantProfile /></ProtectedRoute>} />
        <Route path="/clubs" element={<ProtectedRoute role="participant"><Clubs /></ProtectedRoute>} />
        <Route path="/organizers/:id" element={<ProtectedRoute role="participant"><OrganizerDetail /></ProtectedRoute>} />

        {/* Organizer */}
        <Route path="/organizer" element={<ProtectedRoute role="organizer"><Navigate to="/organizer/dashboard" /></ProtectedRoute>} />
        <Route path="/organizer/dashboard" element={<ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/organizer/create-event" element={<ProtectedRoute role="organizer"><CreateEvent /></ProtectedRoute>} />
        <Route path="/organizer/events/:id" element={<ProtectedRoute role="organizer"><OrganizerEventDetail /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/edit" element={<ProtectedRoute role="organizer"><EditEvent /></ProtectedRoute>} />
        <Route path="/organizer/profile" element={<ProtectedRoute role="organizer"><OrganizerProfile /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><Navigate to="/admin/dashboard" /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/organizers" element={<ProtectedRoute role="admin"><ManageOrganizers /></ProtectedRoute>} />
        <Route path="/admin/password-resets" element={<ProtectedRoute role="admin"><PasswordResets /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </div>
  );
}
