import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, ChevronDown, User, Users,
  BookOpen, LogOut, Settings, Shield, Menu, X, LayoutDashboard, Building2
} from 'lucide-react';
import useAuth from '../../hooks/useAuth'; // '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled,     setScrolled]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [location]);

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const userRoles = user?.roles || (user?.role_name ? [user.role_name] : []);
  const hasRole = (role) => userRoles.includes(role);

  return (
    <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-lg shadow-black/20'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-primary-container rounded-xl flex items-center justify-center">
            <Ticket size={16} className="text-on-primary-container" fill="currentColor" />
          </div>
          <span className="font-headline text-lg font-extrabold text-on-surface tracking-tight">
            EventFlow
          </span>
        </Link>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          
          <Link to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
              text-on-surface-variant hover:text-on-surface transition-all"
          >
            Browse
          </Link>

          {hasRole('System Admin') && (
            <Link to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full
                hover:bg-amber-400/20 transition-all"
            >
              <Shield size={13} /> Admin
            </Link>
          )}

          {hasRole('Event Organizer') && (
            <Link to="/organizer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full
                hover:bg-violet-400/20 transition-all"
            >
              <LayoutDashboard size={13} /> Dashboard
            </Link>
          )}

          {hasRole('Venue Owner') && (
            <Link to="/venue-owner"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full
                hover:bg-emerald-400/20 transition-all"
            >
              <Building2 size={13} /> My Venues
            </Link>
          )}

          {hasRole('Venue Staff') && (
            <>
              <Link to="/staff"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full
                  hover:bg-blue-400/20 transition-all"
              >
                <Settings size={13} /> Staff Portal
              </Link>
              <Link to="/scanner"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full
                  hover:bg-cyan-400/20 transition-all"
              >
                <Settings size={13} /> Scanner
              </Link>
            </>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
                  hover:bg-surface-container transition-all border border-transparent
                  hover:border-outline-variant/20"
              >
                <div className="w-7 h-7 bg-primary-container rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-on-primary-container">{initials}</span>
                </div>
                <span className="text-sm font-medium text-on-surface max-w-[100px] truncate">
                  {user.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} className={`text-on-surface-variant transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1   }}
                    exit={{    opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-52 bg-surface-container
                      border border-outline-variant/20 rounded-2xl shadow-2xl shadow-black/40
                      overflow-hidden py-1"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant/10">
                      <p className="text-sm font-semibold text-on-surface truncate">{user.full_name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {userRoles.map(r => (
                          <span key={r} className="px-2 py-0.5 text-[10px] font-bold
                            tracking-wide uppercase bg-primary/20 text-primary rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {[
                      { icon: BookOpen, label: 'My Bookings',      to: '/my-bookings'      },
                      { icon: Users,    label: 'My Registrations', to: '/my-registrations' },
                      { icon: Ticket,   label: 'My Tickets',       to: '/my-tickets'       },
                      { icon: User,     label: 'Profile',          to: '/profile'          },
                    ].map(({ icon: Icon, label, to }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm
                          text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                          transition-all"
                      >
                        <Icon size={15} /> {label}
                      </Link>
                    ))}

                    <div className="border-t border-outline-variant/10 mt-1">
                      <button onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                          text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary-container text-on-primary-container
                text-sm font-semibold rounded-full hover:opacity-90 transition-all"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(o => !o)}
          className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0      }}
            className="md:hidden bg-surface-container-lowest border-t border-outline-variant/10 px-6 pb-4"
          >
            <div className="pt-4 space-y-1">
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-3 mb-2 border-b border-outline-variant/10">
                    <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-on-primary-container">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{user.full_name}</p>
                      <p className="text-xs text-on-surface-variant">{userRoles.join(' · ')}</p>
                    </div>
                  </div>

                  {[
                    { label: 'Browse Events',    to: '/'                 },
                    { label: 'My Bookings',      to: '/my-bookings'      },
                    { label: 'My Registrations', to: '/my-registrations' },
                    { label: 'My Tickets',       to: '/my-tickets'       },
                    { label: 'Profile',          to: '/profile'          },
                    ...(hasRole('System Admin')    ? [{ label: 'Admin Panel',         to: '/admin'       }] : []),
                    ...(hasRole('Event Organizer') ? [{ label: 'Organizer Dashboard', to: '/organizer'   }] : []),
                    ...(hasRole('Venue Owner')     ? [{ label: 'My Venues',           to: '/venue-owner' }] : []),
                    ...(hasRole('Venue Staff')     ? [{ label: 'Staff Portal',        to: '/staff'       }] : []),
                  ].map(({ label, to }) => (
                    <Link key={to} to={to}
                      className="block py-2.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                      {label}
                    </Link>
                  ))}

                  <button onClick={logout}
                    className="block w-full text-left py-2.5 text-sm text-red-400 hover:text-red-300 transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/login')}
                  className="w-full py-3 bg-primary-container text-on-primary-container
                    font-semibold rounded-2xl text-sm">
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}