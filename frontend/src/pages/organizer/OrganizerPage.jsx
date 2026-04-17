import { useState } from 'react';
import { CalendarDays, Users, CalendarClock, UserCog } from 'lucide-react';
import OrganizerEventsTab   from './tabs/OrganizerEventsTab';
import OrganizerSessionsTab from './tabs/OrganizerSessionsTab';
import OrganizerCastTab     from './tabs/OrganizerCastTab';
import OrganizerStaffTab    from './tabs/OrganizerStaffTab';
import MyRentalRequests     from '../../components/organizer/MyRentalRequests';

const TABS = [
  { key: 'requests', label: 'Rental Requests', icon: CalendarClock },
  { key: 'events',   label: 'My Events',  icon: CalendarDays  },
  { key: 'sessions', label: 'Sessions',   icon: CalendarClock },
  { key: 'cast',     label: 'Cast & Crew', icon: Users        },
  { key: 'staff',    label: 'Staff',      icon: UserCog       },
];

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState('events');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Organizer Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your events, sessions, cast and venue staff</p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-2xl w-fit mb-8 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-primary text-on-primary shadow-lg'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-surface-container rounded-3xl p-6">
          {activeTab === 'requests' && <MyRentalRequests />}
          {activeTab === 'events'   && <OrganizerEventsTab   />}
          {activeTab === 'sessions' && <OrganizerSessionsTab />}
          {activeTab === 'cast'     && <OrganizerCastTab     />}
          {activeTab === 'staff'    && <OrganizerStaffTab    />}
        </div>
      </div>
    </div>
  );
}