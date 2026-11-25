import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          🗑️ WasteNet
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-green-200 transition-colors">Home</Link>
          <Link to="/map" className="hover:text-green-200 transition-colors">Map</Link>

          {user && user.role === 'citizen' && (
            <>
              <Link to="/report" className="hover:text-green-200 transition-colors">Report</Link>
              <Link to="/my-complaints" className="hover:text-green-200 transition-colors">My Complaints</Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" className="hover:text-green-200 transition-colors">Admin</Link>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="text-lg hover:text-green-200 transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-white text-green-700 px-3 py-1 rounded font-medium hover:bg-green-50 transition-colors"
            >
              Logout ({user.name})
            </button>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-200 transition-colors">Login</Link>
              <Link
                to="/register"
                className="bg-white text-green-700 px-3 py-1 rounded font-medium hover:bg-green-50 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile: dark toggle + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="text-lg"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleMenu} className="text-2xl focus:outline-none" aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-green-800 px-4 pb-4 flex flex-col gap-3 text-sm">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-green-200">Home</Link>
          <Link to="/map" onClick={() => setMenuOpen(false)} className="hover:text-green-200">Map</Link>

          {user && user.role === 'citizen' && (
            <>
              <Link to="/report" onClick={() => setMenuOpen(false)} className="hover:text-green-200">Report</Link>
              <Link to="/my-complaints" onClick={() => setMenuOpen(false)} className="hover:text-green-200">My Complaints</Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-green-200">Admin</Link>
          )}

          {user ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="bg-white text-green-700 px-3 py-1 rounded font-medium text-left"
            >
              Logout ({user.name})
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-green-200">Login</Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-white text-green-700 px-3 py-1 rounded font-medium inline-block"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
