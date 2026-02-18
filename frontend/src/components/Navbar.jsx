import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'text-indigo-400' : 'text-gray-300 hover:text-white';

  const participantLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/events', label: 'Browse Events' },
    { to: '/clubs', label: 'Clubs' },
    { to: '/profile', label: 'Profile' },
  ];

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Dashboard' },
    { to: '/organizer/create-event', label: 'Create Event' },
    { to: '/organizer/profile', label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/organizers', label: 'Manage Clubs' },
    { to: '/admin/password-resets', label: 'Password Resets' },
  ];

  const links = user.role === 'admin' ? adminLinks
    : user.role === 'organizer' ? organizerLinks
    : participantLinks;

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-white">Felicity</Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={`text-sm font-medium ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer">
              Logout
            </button>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-white cursor-pointer">
            {open ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { logout(); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 cursor-pointer">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
