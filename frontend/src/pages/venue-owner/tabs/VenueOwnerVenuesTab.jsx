import { useState, useEffect } from 'react';
import { Pencil, Armchair, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { getMyVenues, createMyVenue, updateMyVenue, getCities,
         getVenueSeats, addVenueSeats, toggleVenueSeat } from '../../../services/venue-owner';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const BLANK = { city_id: '', venue_name: '', address: '', total_capacity: '', is_rentable: false };
const SEAT_BLANK = { tier_id: '1', seat_row: '', seat_count: '10' };

const STATUS_COLORS = {
  Active:   'bg-primary/10 text-primary',
  Pending:  'bg-yellow-500/15 text-yellow-400',
  Inactive: 'bg-error/10 text-error',
};

const TIER_NAMES = { 1: 'Recliner', 2: 'Prime', 3: 'Classic' };
const TIER_COLORS = {
  Recliner: 'bg-purple-500/15 text-purple-300',
  Prime:    'bg-blue-500/15 text-blue-300',
  Classic:  'bg-green-500/15 text-green-300',
};

export default function VenueOwnerVenuesTab() {
  const [venues,    setVenues]    = useState([]);
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);       // venue add/edit
  const [seatPanel, setSeatPanel] = useState(null);       // { venue }
  const [seats,     setSeats]     = useState([]);
  const [seatForm,  setSeatForm]  = useState(SEAT_BLANK);
  const [form,      setForm]      = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([getMyVenues(), getCities()]);
      setVenues(vRes.data.data || []);
      setCities(cRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(BLANK); setModal({ mode: 'add' }); };
  const openEdit = (v) => {
    setForm({ city_id: v.city_id, venue_name: v.venue_name, address: v.address || '', total_capacity: v.total_capacity, is_rentable: !!v.is_rentable });
    setModal({ mode: 'edit', data: v });
  };

  const openSeats = async (venue) => {
    setSeatPanel({ venue });
    setSeatForm(SEAT_BLANK);
    try {
      const r = await getVenueSeats(venue.venue_id);
      setSeats(r.data.data || []);
    } catch { showToast('Failed to load seats', 'error'); }
  };

  const handleSave = async () => {
    if (!form.city_id || !form.venue_name || !form.total_capacity)
      return showToast('Fill all required fields', 'warning');
    setSaving(true);
    try {
      if (modal.mode === 'add') { await createMyVenue(form); showToast('Venue submitted for approval!', 'success'); }
      else { await updateMyVenue(modal.data.venue_id, form); showToast('Venue updated', 'success'); }
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddSeats = async () => {
    if (!seatForm.seat_row) return showToast('Enter a row letter', 'warning');
    setSaving(true);
    try {
      await addVenueSeats(seatPanel.venue.venue_id, seatForm);
      showToast('Seats added!', 'success');
      setSeatForm(SEAT_BLANK);
      const r = await getVenueSeats(seatPanel.venue.venue_id);
      setSeats(r.data.data || []);
      load(); // refresh capacity
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggleSeat = async (seat) => {
    try {
      await toggleVenueSeat(seat.seat_id, !seat.is_active);
      const r = await getVenueSeats(seatPanel.venue.venue_id);
      setSeats(r.data.data || []);
      load();
    } catch { showToast('Failed to update seat', 'error'); }
  };

  // Group seats by tier then row
  const grouped = seats.reduce((acc, s) => {
    const key = s.tier_name;
    if (!acc[key]) acc[key] = {};
    if (!acc[key][s.seat_row]) acc[key][s.seat_row] = [];
    acc[key][s.seat_row].push(s);
    return acc;
  }, {});

  return (
    <>
      <AdminTable
        title="My Venues"
        loading={loading}
        onAdd={openAdd}
        columns={['Venue', 'City', 'Capacity', 'Status', 'Actions']}
        rows={venues.map(v => [
          <div>
            <p className="font-medium text-on-surface text-sm">{v.venue_name}</p>
            <p className="text-xs text-on-surface-variant">{v.address || '—'}</p>
          </div>,
          <span className="text-sm text-on-surface">{v.city_name}</span>,
          v.total_capacity?.toLocaleString(),
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status] || ''}`}>
            {v.status}
          </span>,
          <div className="flex items-center gap-1">
            <button onClick={() => openSeats(v)}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              title="Manage Seats">
              <Armchair size={14} />
            </button>
            <button onClick={() => openEdit(v)}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
              <Pencil size={14} />
            </button>
          </div>
        ])}
      />

      {/* Pending notice */}
      <div className="mt-4 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
        <p className="text-xs text-yellow-300">
          New venues start as <strong>Pending</strong> and must be approved by an admin before they go live.
        </p>
      </div>

      {/* Venue Add/Edit Modal */}
      <AdminModal
        open={!!modal}
        title={modal?.mode === 'add' ? 'Add New Venue' : 'Edit Venue'}
        onClose={() => setModal(null)}
        onSave={handleSave}
        saving={saving}
      >
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">City *</label>
          <select value={form.city_id} onChange={e => setForm(f => ({ ...f, city_id: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none">
            <option value="">Select City</option>
            {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}, {c.state_name}</option>)}
          </select>
        </div>
        <AdminField label="Venue Name *" value={form.venue_name}
          onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} placeholder="e.g. Kala Academy" />
        <AdminField label="Address" value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
        <AdminField label="Total Capacity *" type="number" value={form.total_capacity}
          onChange={e => setForm(f => ({ ...f, total_capacity: e.target.value }))} placeholder="e.g. 500" />
        
        <div className="flex items-center justify-between px-1 py-1 mt-2 mb-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            List as Rentable
          </label>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_rentable: !f.is_rentable }))}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200
              ${form.is_rentable ? 'bg-primary' : 'bg-surface-container-highest'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                transition-transform duration-200
                ${form.is_rentable ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </AdminModal>

      {/* Seat Management Panel */}
      {seatPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h2 className="text-on-surface font-semibold">Manage Seats</h2>
                <p className="text-xs text-on-surface-variant">{seatPanel.venue.venue_name}</p>
              </div>
              <button onClick={() => setSeatPanel(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">

              {/* Add Row Form */}
              <div className="bg-surface-container-highest rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Add Seat Row</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Row Letter *</label>
                    <input
                      value={seatForm.seat_row}
                      onChange={e => setSeatForm(f => ({ ...f, seat_row: e.target.value.toUpperCase().slice(0, 2) }))}
                      placeholder="e.g. A"
                      maxLength={2}
                      className="w-full px-3 py-2 bg-surface-container text-on-surface rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Tier *</label>
                    <select value={seatForm.tier_id}
                      onChange={e => setSeatForm(f => ({ ...f, tier_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-container text-on-surface rounded-xl text-sm outline-none">
                      <option value="1">Recliner (₹800)</option>
                      <option value="2">Prime (₹400)</option>
                      <option value="3">Classic (₹200)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Seat Count *</label>
                    <input
                      type="number" min={1} max={50}
                      value={seatForm.seat_count}
                      onChange={e => setSeatForm(f => ({ ...f, seat_count: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-container text-on-surface rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <button onClick={handleAddSeats} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                  <Plus size={14} /> Add Row
                </button>
              </div>

              {/* Seat Map */}
              {seats.length === 0
                ? <p className="text-center text-on-surface-variant text-sm py-8">No seats yet. Add a row above.</p>
                : Object.entries(grouped).map(([tierName, rows]) => (
                  <div key={tierName}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_COLORS[tierName]}`}>{tierName}</span>
                      <span className="text-xs text-on-surface-variant">
                        {Object.values(rows).flat().filter(s => s.is_active).length} active seats
                      </span>
                    </div>
                    {Object.entries(rows).map(([rowLetter, rowSeats]) => (
                      <div key={rowLetter} className="mb-3">
                        <p className="text-xs text-on-surface-variant mb-1.5">Row {rowLetter}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rowSeats.map(seat => (
                            <button key={seat.seat_id}
                              onClick={() => handleToggleSeat(seat)}
                              title={seat.is_active ? 'Click to deactivate' : 'Click to activate'}
                              className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all border
                                ${seat.is_active
                                  ? 'bg-primary/20 border-primary/40 text-primary hover:bg-error/20 hover:border-error/40 hover:text-error'
                                  : 'bg-surface-container-highest border-outline-variant/30 text-on-surface-variant/40 hover:bg-primary/10 hover:text-primary'
                                }`}>
                              {seat.seat_number}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              }
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-outline-variant/30 flex justify-between items-center">
              <p className="text-xs text-on-surface-variant">
                Total active seats: <strong className="text-on-surface">{seats.filter(s => s.is_active).length}</strong>
              </p>
              <button onClick={() => setSeatPanel(null)}
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}