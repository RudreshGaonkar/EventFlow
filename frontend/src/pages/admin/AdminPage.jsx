import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, MapPin, Building2,
  Map, Users, ChevronRight, Menu, X, UserCog, Shield
} from 'lucide-react';


import StatesTab       from './tabs/StatesTab';
import CitiesTab       from './tabs/CitiesTab';
import VenuesTab       from './tabs/VenuesTab';
import EventsTab       from './tabs/EventsTab';
import SessionsTab     from './tabs/SessionsTab';
import UsersTab        from './tabs/UsersTab';
import StaffTab        from './tabs/StaffTab';
import RoleRequestsTab from './tabs/RoleRequestsTab';

const TABS = [
  { key: 'events',        label: 'Events',        icon: LayoutDashboard },
  { key: 'sessions',      label: 'Sessions',      icon: CalendarDays    },
  { key: 'venues',        label: 'Venues',        icon: Building2       },
  { key: 'cities',        label: 'Cities',        icon: Map             },
  { key: 'states',        label: 'States',        icon: MapPin          },
  { key: 'users',         label: 'Users',         icon: Users           },
  { key: 'staff',         label: 'Staff',         icon: UserCog         },
  { key: 'roleRequests',  label: 'Role Requests', icon: Shield          },
];

export default function AdminPage() {
  const [active,      setActive]      = useState('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ActiveTab = {
    events:        EventsTab,
    sessions:      SessionsTab,
    venues:        VenuesTab,
    cities:        CitiesTab,
    states:        StatesTab,
    users:         UsersTab,
    staff:         StaffTab,
    roleRequests:  RoleRequestsTab,
  }[active];

  return (
    <div className="flex h-screen bg-surface-container-lowest pt-16 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 pt-16 lg:pt-0
        w-60 bg-surface-container-low border-r border-outline-variant/10
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-outline-variant/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            Admin Panel
          </p>
          <h2 className="text-base font-extrabold text-on-surface font-headline mt-0.5">
            EventFlow
          </h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActive(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-base sm:text-sm
                font-medium transition-all group
                ${active === key
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Icon size={17} className={active === key ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'} />
              {label}
              {active === key && (
                <ChevronRight size={14} className="ml-auto text-primary" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-headline font-bold text-on-surface capitalize">{active}</h1>
        </div>

        <div className="p-6 lg:p-8 max-w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{    opacity: 0, y: -8  }}
              transition={{ duration: 0.2 }}
            >
              <ActiveTab />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
