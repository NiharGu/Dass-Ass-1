import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path
    ? 'text-black bg-white/[0.06]'
    : 'text-gray-600 hover:text-black hover:bg-white/[0.04]';

  const participantLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/events', label: 'Events' },
    { to: '/teams', label: 'Teams' },
    { to: '/clubs', label: 'Clubs' },
    { to: '/profile', label: 'Profile' },
  ];

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Dashboard' },
    { to: '/organizer/events', label: 'My Events' },
    { to: '/organizer/create-event', label: 'Create' },
    { to: '/organizer/profile', label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/organizers', label: 'Clubs' },
    { to: '/admin/password-resets', label: 'Resets' },
  ];

  const links = user.role === 'admin' ? adminLinks
    : user.role === 'organizer' ? organizerLinks
      : participantLinks;

  return (
    <nav className="bg-white border-b border-gray-200 border sticky top-0 z-50  ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-lg font-bold  text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-black font-medium">f</span>elicity
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-1.5 rounded text-[13px] font-medium  ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-gray-100 mx-2" />
            <button onClick={logout}
              className="px-3 py-1.5 rounded text-[13px] font-medium text-black hover:bg-gray-300/20 cursor-pointer ">
              Logout
            </button>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-black cursor-pointer p-1">
            {open ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-3 space-y-1 border-t border-gray-200 border pt-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { logout(); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-300/20 rounded cursor-pointer">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
