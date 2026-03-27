import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Lock, Mail, User, Phone,
  MapPin, Loader2, Ticket, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { login, register } from '../../services/auth';
import api from '../../services/api';

const CARDS = [
  {
    title: 'Neon Pulse Festival',
    badge: 'LIVE NOW',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAYofYueQ4SQDQ0VOgvqT4JCe8fHiGFFDjWlLBkFXDSDX5egIywFN26-5_i8EULIxx7gEhp5c2N1-msqHIzi6fenqcZkd-xagJ51DKfdX_UgQZ64WKUadCbK0ZnopY7u6U7gf9JzbuOPt4QMbFRwtKK60CIsMz7BWPKnNJSfb8C9at_k2JI8dQu5IeAdqfhir4opOYpP3R0hZxwXGByG0y5bvPJXq1WWpSTDTXJgkxqXhsdDW_fl84whilHAk9HqphI9kS90jETHt-',
  },
  {
    title: 'The Golden Stage Gala',
    badge: null,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpZr1ync4LYNKMKqqNXHYsq-iG-I4xN6ovhtoqUG_ZLRMCbuheYgIzObzUcC9FfV1WJsSC2ymCn9_X3POz2sqtthi3K2GdgZ0ubEJB75nYXr-1F9b9rtg-fkw_y7KwCKX9FMS0yxwlyfftB94aJhmTC9W0k34wYgaujtrKwmGLTZNdfOr6cuAteoAmAGCI0YfR_RZPEQkcfkEmXaC6djvYTiS5XTfCwFeChHhfLfZuTYC2XdWG3u3it56g4YfxwvC-_OZXq2FrsKly',
  },
  {
    title: 'TechSummit 2026',
    badge: null,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGhx0dL4QYVKwFVt1ic35RFym1JL_zJPIKAZ0IlH4rjln_uDqlF8ZjWCLFB3u1ZW-DJrGj9HvxM-Icao_1EMqDM1XC4gnictnvoct7agXBGvi_8A503Myaj6h2UPZRTrGFD7AsrhfM3UZoft7Lis5j0qaerfe3pXGDBytgAQx-a4gUK3Sj1ti66-2gt8Fy4Y3yH_ttvknG1433KUHRgnDUB1Buxsn8MNQo9y8YwUUFrabXPjkKIBpIUIFdkvfybOhhAq8ScYA6arh0',
  },
];

// Card positions: [top, left] in px — more spread out
const CARD_POSITIONS = [
  { top: 0,   left: 0   },
  { top: 55,  left: 130 },
  { top: 110, left: 260 },
];

const Field = ({ label, rightSlot, icon: Icon, error, ...props }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center px-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </label>
      {rightSlot}
    </div>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <Icon size={15} />
      </span>
      <input
        className={`w-full pl-10 pr-4 py-2.5 bg-surface-container-highest border-none
          focus:ring-2 focus:ring-primary/50 text-white rounded-2xl transition-all
          placeholder:text-outline-variant outline-none text-sm
          ${error ? 'ring-2 ring-error/60' : ''}`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-error text-[11px] font-medium px-1 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

const PasswordField = ({ label, rightSlot, error, show, onToggle, ...props }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center px-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </label>
      {rightSlot}
    </div>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <Lock size={15} />
      </span>
      <input
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        className={`w-full pl-10 pr-10 py-2.5 bg-surface-container-highest border-none
          focus:ring-2 focus:ring-primary/50 text-white rounded-2xl transition-all
          placeholder:text-outline-variant outline-none text-sm
          ${error ? 'ring-2 ring-error/60' : ''}`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
    {error && (
      <p className="text-error text-[11px] font-medium px-1 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

export default function LoginPage() {
  const [tab, setTab]= useState('login');
  const [showPass, setShowPass]= useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]= useState(false);
  const [states, setStates]= useState([]);
  const [errors, setErrors]= useState({});
  const [form, setForm]= useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', phone: '', home_state_id: '',
    requested_role: 'Attendee'

  });

  const { login: authLogin } = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  useEffect(() => {
    api.get('/admin/states/public')
      .then(r => setStates(r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    if (tab === 'register') {
      if (!form.full_name) e.full_name = 'Name is required';
      if (form.password !== form.confirmPassword)
        e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await login({ email: form.email, password: form.password });
        authLogin(res.data.data);
        showToast('Welcome back!', 'success');
        navigate('/');
      } else {
        await register({
          full_name:     form.full_name,
          email:         form.email,
          password:      form.password,
          phone:         form.phone         || undefined,
          home_state_id: form.home_state_id || undefined,
          requested_role: form.requested_role,
        });
        showToast('Account created! Please sign in.', 'success');
        setTab('login');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      showToast(msg, 'error');
      setErrors({ global: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-surface-container-lowest text-on-surface overflow-hidden font-body">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <section className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-between py-10 px-14 bg-gradient-to-br from-[#0A0E1A] via-[#171B28] to-[#0A0E1A]">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3">
            <Ticket size={30} className="text-primary" fill="currentColor" />
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-white">EventFlow</h1>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant/80 font-headline font-medium">
            Book moments. Live experiences.
          </p>
        </motion.div>

        {/* Cards — spread diagonally across the panel */}
        <div className="relative z-10 flex-1 flex items-center">
          {/* Container wide enough to fit all 3 spread cards */}
          {/* Cards — all 3 visible, cascading diagonal */}
        {/* Cards — diagonal flex, no overlap */}
        <div className="relative z-10 flex flex-col gap-3 py-6">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.13, duration: 0.45 }}
              style={{ marginLeft: `${i * 120}px` }}
              className="w-96 bg-surface-container-high/40 backdrop-blur-md rounded-2xl
                hover:scale-105 transition-transform duration-500 shadow-2xl p-1"
            >
              <div className="relative overflow-hidden rounded-xl h-46 bg-surface-container-highest">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-2">
                  {card.badge && (
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-widest
                      uppercase bg-primary text-on-primary-container rounded-full mb-1 font-mono">
                      {card.badge}
                    </span>
                  )}
                  <p className="font-headline font-bold text-xs leading-tight text-white drop-shadow">
                    {card.title}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>


        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="relative z-10 flex flex-wrap gap-5 text-on-surface-variant/60 font-medium text-xs"
        >
          {/* <span>🔒 Secure Payments</span>
          <span>🎟 Instant Tickets</span>
          <span>📍 Pan-India Venues</span> */}
        </motion.div>
      </section>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <section className="w-full lg:w-[40%] bg-surface-container-low flex items-center justify-center p-5 overflow-y-auto">

        {/* Mobile logo */}
        <div className="absolute top-5 left-5 lg:hidden flex items-center gap-2">
          <Ticket size={20} className="text-primary" fill="currentColor" />
          <h1 className="font-headline text-lg font-extrabold text-white">EventFlow</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm my-auto"
        >
          {/* Glass Card */}
          <div className="bg-surface-container-highest/30 backdrop-blur-xl border border-outline-variant/10 px-6 py-6 rounded-3xl shadow-2xl">

            {/* Header */}
            <div className="text-center mb-5">
              <h2 className="font-headline text-xl font-extrabold text-white mb-0.5">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-on-surface-variant text-xs">
                {tab === 'login' ? 'The stage is waiting for you.' : 'Join and start booking today.'}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex p-1 bg-surface-container-lowest rounded-full mb-5">
              {[
                { key: 'login',    label: 'Sign In'        },
                { key: 'register', label: 'Create Account' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setErrors({}); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    tab === key
                      ? 'bg-primary-container text-on-primary-container shadow-lg'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Global error */}
            <AnimatePresence>
              {errors.global && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-error text-xs font-medium px-1 mb-3 flex items-center gap-1"
                >
                  <AlertCircle size={11} /> {errors.global}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              <AnimatePresence>
                {tab === 'register' && (
                  <motion.div
                    key="fullname"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Field
                      label="Full Name"
                      icon={User}
                      type="text"
                      placeholder="Your full name"
                      value={form.full_name}
                      onChange={set('full_name')}
                      error={errors.full_name}
                    />
                  </motion.div>
                  
                )}
              </AnimatePresence>

              <Field
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="alex@eventflow.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
              />

              <PasswordField
                label="Password"
                rightSlot={
                  tab === 'login' && (
                    <a href="#" className="text-[10px] font-semibold text-primary hover:text-primary-container transition-colors">
                      Forgot?
                    </a>
                  )
                }
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                show={showPass}
                onToggle={() => setShowPass(p => !p)}
              />

              <AnimatePresence>
                {tab === 'register' && (
                  <motion.div
                    key="register-extra"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <PasswordField
                      label="Confirm Password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      error={errors.confirmPassword}
                      show={showConfirm}
                      onToggle={() => setShowConfirm(p => !p)}
                    />
                    <Field
                      label="Phone (optional)"
                      icon={Phone}
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={set('phone')}
                    />
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
                        Home State (optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                          <MapPin size={15} />
                        </span>
                        <select
                          value={form.home_state_id}
                          onChange={set('home_state_id')}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest border-none
                            focus:ring-2 focus:ring-primary/50 text-on-surface-variant rounded-2xl
                            transition-all outline-none appearance-none text-sm"
                        >
                          <option value="">Select your state</option>
                          {states.map(s => (
                            <option key={s.state_id} value={s.state_id}>
                              {s.state_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                   {/* Organizer checkbox */}
                    <div className="flex items-start gap-3 px-1">
                      <input
                        type="checkbox"
                        id="organizer"
                        checked={form.requested_role === 'Event Organizer'}
                        onChange={e => setForm(f => ({
                          ...f,
                          requested_role: e.target.checked ? 'Event Organizer' : 'Attendee'
                        }))}
                        className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                      />
                      <label htmlFor="organizer" className="text-sm text-on-surface-variant cursor-pointer leading-snug">
                        I want to list events as an <span className="text-primary font-semibold">Event Organizer</span>
                      </label>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {tab === 'login' && (
                <div className="flex items-center gap-2.5 px-1">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded bg-surface-container-highest border-none text-primary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs text-on-surface-variant font-medium cursor-pointer">
                    Keep me signed in
                  </label>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 mt-1 bg-gradient-to-r from-primary-container to-[#6C63FF]
                  text-white font-bold rounded-2xl font-headline text-sm tracking-wide
                  shadow-[0px_12px_28px_rgba(108,99,255,0.25)]
                  hover:shadow-[0px_12px_28px_rgba(108,99,255,0.4)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 transition-all"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                  : tab === 'login' ? 'Sign in' : 'Sign Up'
                }
              </motion.button>
            </form>
          </div>

          {/* Footer */}
          <footer className="flex justify-center gap-5 mt-4">
            {['Privacy Policy', 'Terms of Service', 'Help Center'].map(link => (
              <a key={link} href="#"
                className="text-[11px] font-semibold text-on-surface-variant hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </footer>
        </motion.div>
      </section>
    </main>
  );
}
