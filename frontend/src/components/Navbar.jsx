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
    ? 'text-white bg-white/[0.06]'
    : 'text-[#8b8fad] hover:text-white hover:bg-white/[0.04]';

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
    <nav className="bg-[#0c0e14] border-b border-[#1e2030] sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-[#818cf8]">f</span>elicity
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-[#1e2030] mx-2" />
            <button onClick={logout}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#f87171] hover:bg-red-500/10 cursor-pointer transition-all">
              Logout
            </button>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-white cursor-pointer p-1">
            {open ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-3 space-y-1 border-t border-[#1e2030] pt-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm rounded-lg ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { logout(); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-[#f87171] hover:bg-red-500/10 rounded-lg cursor-pointer">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
