import { useState } from 'react';
import { Building2, Users, CalendarClock } from 'lucide-react';
import VenueOwnerVenuesTab from './tabs/VenueOwnerVenuesTab';
import VenueOwnerStaffTab  from './tabs/VenueOwnerStaffTab';
import RentalRequestList from '../../components/venue-owner/RentalRequestList';

const TABS = [
  { key: 'requests', label: 'Rental Requests', icon: CalendarClock },
  { key: 'venues', label: 'My Venues', icon: Building2 },
  { key: 'staff',  label: 'Staff',     icon: Users     },
];

export default function VenueOwnerPage() {
  const [activeTab, setActiveTab] = useState('venues');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Venue Owner Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage your venues and staff</p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-2xl w-fit mb-8">
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
          {activeTab === 'requests' && <RentalRequestList />}
          {activeTab === 'venues' && <VenueOwnerVenuesTab />}
          {activeTab === 'staff'  && <VenueOwnerStaffTab  />}
        </div>
      </div>
    </div>
  );
}