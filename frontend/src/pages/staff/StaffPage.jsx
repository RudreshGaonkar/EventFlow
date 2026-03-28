import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, ShieldCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StaffPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <div className="text-center mb-2">
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase mb-1">EventFlow</p>
          <h1 className="text-2xl font-bold tracking-wide">Staff Portal</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.full_name}</p>
            <p className="text-sm text-white/40 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-xs text-violet-400 mt-0.5">
              <ShieldCheck size={12} />
              {user?.role_name}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/scanner')}
          className="w-full bg-violet-600 hover:bg-violet-500 transition-colors rounded-2xl p-5 flex items-center gap-4 text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ScanLine size={22} />
          </div>
          <div>
            <p className="font-semibold">Check-in Portal</p>
            <p className="text-sm text-white/60">Validate tickets at entry</p>
          </div>
        </motion.button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors py-2"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
