import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Edit2, Check, X,
    Ticket, ClipboardList, Star, ChevronRight, LogOut, Shield,
    Camera, AlertCircle, CheckCircle, Loader2, Calendar, Clock,
} from 'lucide-react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

// Helpers 
const fmt = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLE = {
    Confirmed: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    Pending: 'bg-gold/10 text-gold border-gold/20',
    Cancelled: 'bg-error/10 text-error border-error/20',
    Refunded: 'bg-blue/10 text-blue border-blue/20',
};

//  Toast 
function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      border backdrop-blur-sm transition-all
      ${type === 'error'
                ? 'bg-error/10 border-error/20 text-error'
                : 'bg-tertiary/10 border-tertiary/20 text-tertiary'}`}>
            {type === 'error'
                ? <AlertCircle size={15} />
                : <CheckCircle size={15} />}
            {msg}
        </div>
    );
}

// Password Form 
function PasswordSection({ onToast }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [show, setShow] = useState({ current: false, next: false });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (form.next.length < 8) return setErr('New password must be at least 8 characters.');
        if (form.next !== form.confirm) return setErr('Passwords do not match.');
        setSaving(true); setErr('');
        try {
            await api.patch('/auth/change-password', {
                currentPassword: form.current,
                newPassword: form.next,
            });
            onToast('Password updated successfully', 'success');
            setOpen(false);
            setForm({ current: '', next: '', confirm: '' });
        } catch (e) {
            setErr(e.response?.data?.message || 'Could not update password');
        } finally { setSaving(false); }
    };

    if (!open)
        return (
            <button onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white
          border border-white/10 rounded-xl px-4 py-2.5 hover:bg-[#222] transition-all w-full">
                <Lock size={14} className="text-primary" />
                Change Password
                <ChevronRight size={14} className="ml-auto" />
            </button>
        );

    return (
        <form onSubmit={submit} className="bg-[#18181b] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Lock size={14} className="text-primary" /> Change Password
                </p>
                <button type="button" onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                    <X size={14} />
                </button>
            </div>
            {['current', 'next', 'confirm'].map((field) => (
                <div key={field}>
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">
                        {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                        <input
                            type={show[field] ? 'text' : 'password'}
                            value={form[field]}
                            onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))}
                            required
                            className="w-full bg-[#141414] text-white text-sm rounded-xl px-4 py-2.5
                border border-white/10 focus:border-primary/50 outline-none pr-10"
                        />
                        {field !== 'confirm' && (
                            <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {err && <p className="text-xs text-error">{err}</p>}
            <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-primary text-black text-sm font-semibold rounded-xl
          hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Updating…' : 'Update Password'}
            </button>
        </form>
    );
}

function BookingCard({ booking }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(`/booking/${booking.booking_id}`)}
            className="w-full text-left p-6 rounded-2xl border bg-[#18181b] border-white/10 shadow-none
        hover:border-primary/40 hover:bg-[#222222] transition-all group">
            <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-base font-semibold text-gray-100 leading-tight">{booking.event_title}</p>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[booking.booking_status] || ''}`}>
                    {booking.booking_status}
                </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar size={13} />{fmt(booking.show_date)}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} />{booking.show_time?.slice(0, 5)}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} />{booking.venue_name}</span>
            </div>
            <p className="mt-4 text-sm font-bold text-primary">₹{Number(booking.total_amount || 0).toLocaleString('en-IN')}</p>
        </button>
    );
}

function RegCard({ reg }) {
    return (
        <div className="p-6 rounded-2xl border bg-[#18181b] border-white/10 shadow-none transition-all">
            <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-base font-semibold text-gray-100 leading-tight">{reg.eventtitle}</p>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[reg.status] || ''}`}>
                    {reg.status}
                </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar size={13} />{fmt(reg.registered_at)}</span>
                {reg.team_name && <span className="flex items-center gap-1.5"><User size={13} />Team: {reg.team_name}</span>}
                {reg.amount_paid > 0 && (
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                        ₹{Number(reg.amount_paid || 0).toLocaleString('en-IN')} paid
                    </span>
                )}
            </div>
        </div>
    );
}

function MyReviewCard({ review }) {
    return (
        <div className="p-6 rounded-2xl border bg-[#18181b] border-white/10 shadow-none transition-all">
            <div className="flex items-center justify-between mb-2">
                <p className="text-base font-semibold text-gray-100">{review.eventtitle || review.sessiontitle || 'Event'}</p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14}
                            className={s <= review.rating ? 'text-gold' : 'text-gray-600'}
                            fill={s <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                </div>
            </div>
            {review.review_text && <p className="text-sm text-gray-400 leading-relaxed mt-3">{review.review_text}</p>}
            <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">{fmt(review.created_at)}</p>
        </div>
    );
}

function RoleRequestSection({ user, onToast }) {
    const [requesting, setRequesting] = useState(false);
    const [status, setStatus] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [venueDetails, setVenueDetails] = useState({ venue_name: '', address: '', state_id: '', city_id: '' });
    const [files, setFiles] = useState({ id_proof: null, photo: null });
    const [showForm, setShowForm] = useState(false);

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        api.get('/auth/role-request-status')
            .then(r => setStatus(r.data.data?.status || null))
            .catch(() => { });
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await api.get('/locations/states');
            setStates(res.data?.data || []);
        } catch { }
    };

    useEffect(() => {
        if (venueDetails.state_id) {
            api.get(`/locations/cities?state_id=${venueDetails.state_id}`)
                .then(r => setCities(r.data?.data || []))
                .catch(() => setCities([]));
        } else {
            setCities([]);
        }
    }, [venueDetails.state_id]);

    useEffect(() => {
        if (selectedRole === 'Venue Owner' && states.length === 0) {
            fetchLocations();
        }
    }, [selectedRole, states.length]);

    const handleFileChange = (e, type) => {
        setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
    };

    const submitRequest = async (e) => {
        e.preventDefault();
        if (!selectedRole) return;
        if (!files.id_proof || !files.photo) return onToast('Please upload both ID Proof and Photo', 'error');

        setRequesting(true);
        const form = new FormData();
        form.append('role', selectedRole);
        form.append('id_proof', files.id_proof);
        form.append('photo', files.photo);

        if (selectedRole === 'Venue Owner') {
            if (!venueDetails.venue_name || !venueDetails.city_id || !venueDetails.address) {
                setRequesting(false);
                return onToast('Please fill all venue details', 'error');
            }
            form.append('venue_name', venueDetails.venue_name);
            form.append('city_id', venueDetails.city_id);
            form.append('address', venueDetails.address);
        }

        try {
            await api.post('/auth/request-role', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            setStatus('Pending');
            onToast(`Role request for "${selectedRole}" submitted!`, 'success');
            setShowForm(false);
        } catch (e) {
            onToast(e.response?.data?.message || 'Could not submit request', 'error');
        } finally {
            setRequesting(false);
        }
    };

    const userRoles = user?.roles || (user?.role_name ? [user.role_name] : [user?.rolename || 'Attendee']);
    if (userRoles.includes('System Admin') || userRoles.includes('Venue Staff')) return null;

    return (
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                <Shield size={14} className="text-primary" /> Upgrade Account
            </p>
            {status === 'Pending' && (
                <p className="text-xs text-gold font-semibold mb-3">
                    Your recent role upgrade request is pending admin approval.
                </p>
            )}
            {status === 'Active' && (
                <p className="text-xs text-tertiary mb-3">
                    Your recent role upgrade request was approved ✓
                </p>
            )}

            {showForm ? (
                <form onSubmit={submitRequest} className="mt-4 space-y-4">
                    <div className="flex gap-2 mb-4">
                        {['Event Organizer', 'Venue Owner'].map(role => (
                            <button key={role} type="button" onClick={() => setSelectedRole(role)}
                                className={`px-3 py-1.5 text-xs font-semibold border rounded-xl transition-all
                                    ${selectedRole === role ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                                {role}
                            </button>
                        ))}
                    </div>

                    {selectedRole === 'Venue Owner' && (
                        <div className="p-3 bg-[#141414] rounded-xl space-y-3 mb-4">
                            <p className="text-xs font-semibold text-white">Venue Details</p>
                            <input
                                type="text" placeholder="Venue Name" required
                                value={venueDetails.venue_name} onChange={e => setVenueDetails({ ...venueDetails, venue_name: e.target.value })}
                                className="w-full bg-[#222] text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-primary"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={venueDetails.state_id} onChange={e => setVenueDetails({ ...venueDetails, state_id: e.target.value, city_id: '' })}
                                    className="bg-[#222] text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-primary">
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
                                </select>
                                <select
                                    value={venueDetails.city_id} onChange={e => setVenueDetails({ ...venueDetails, city_id: e.target.value })}
                                    required className="bg-[#222] text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-primary">
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                                </select>
                            </div>
                            <input
                                type="text" placeholder="Full Address" required
                                value={venueDetails.address} onChange={e => setVenueDetails({ ...venueDetails, address: e.target.value })}
                                className="w-full bg-[#222] text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    {selectedRole && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Government ID Proof</label>
                                <input type="file" accept="image/*,application/pdf" required onChange={e => handleFileChange(e, 'id_proof')}
                                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#222] file:text-white hover:file:bg-[#333] transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Recent Photo</label>
                                <input type="file" accept="image/*" required onChange={e => handleFileChange(e, 'photo')}
                                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#222] file:text-white hover:file:bg-[#333] transition-all" />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowForm(false)} disabled={requesting}
                            className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-400 hover:text-white transition-all">Cancel</button>
                        <button type="submit" disabled={!selectedRole || requesting}
                            className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2">
                            {requesting && <Loader2 size={14} className="animate-spin" />} Submit Request
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <p className="text-xs text-gray-400 mb-3">
                        Request an upgrade to organise events or manage venues.
                    </p>
                    <button onClick={() => setShowForm(true)}
                        className="px-4 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all">
                        Start Application
                    </button>
                </>
            )}
        </div>
    );
}

function Tab({ active, onClick, icon: Icon, label, count }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
        ${active
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/10'}`}>
            <Icon size={13} />
            {label}
            {count !== undefined && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
          ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [states, setStates] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [regs, setRegs] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('bookings');
    const [toast, setToast] = useState({ msg: '', type: '' });
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileRef = useRef();

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ fullname: '', phone: '', homestateid: '' });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 3500);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, sRes, bRes, rRes, rvRes] = await Promise.all([
                    api.get('/auth/profile'),
                    api.get('/auth/states'),
                    api.get('/booking/my'),
                    api.get('/events/registrations/my'),
                    api.get('/events/reviews/my-all'),
                ]);
                setProfile(pRes.data.data);
                setEditForm({
                    fullname: pRes.data.data.fullname || '',
                    phone: pRes.data.data.phone || '',
                    homestateid: pRes.data.data.homestateid || ''
                });
                setStates(sRes.data.data || []);
                setBookings(bRes.data.data || []);
                setRegs(rRes.data.data || []);
                setReviews(rvRes.data.data || []);
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    navigate('/login', { state: { message: 'Session expired. Please log in again.' } });
                    return;
                }
            } finally { setLoading(false); }
        };
        load();
    }, [navigate]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.patch('/auth/profile', {
                fullname: editForm.fullname,
                phone: editForm.phone,
                homestateid: editForm.homestateid || null
            });
            setProfile(p => ({ ...p, fullname: editForm.fullname, phone: editForm.phone, homestateid: editForm.homestateid }));
            if (refreshUser) refreshUser();
            showToast('Profile updated');
            setIsEditing(false);
        } catch (e) {
            showToast(e.response?.data?.message || 'Could not save', 'error');
        } finally { setSaving(false); }
    };

    const handleCancelEdit = () => {
        setEditForm({
            fullname: profile.fullname || '',
            phone: profile.phone || '',
            homestateid: profile.homestateid || ''
        });
        setIsEditing(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('avatar', file);
        setAvatarUploading(true);
        try {
            const res = await api.patch('/auth/avatar', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile(p => ({ ...p, avatar_url: res.data.data?.avatar_url }));
            showToast('Avatar updated');
        } catch { showToast('Could not upload avatar', 'error'); }
        finally { setAvatarUploading(false); }
    };

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        logout();
        navigate('/login');
    };

    if (loading)
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );

    if (!profile)
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} className="text-error opacity-60" />
                <p className="text-white font-semibold">Could not load profile</p>
                <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">Go back</button>
            </div>
        );

    return (
        <div className="min-h-screen bg-black pb-16">
            <Toast msg={toast.msg} type={toast.type} />

            {/* ── Hero Banner ── */}
            <div className="bg-[#18181b] border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                        {/* Avatar */}
                        <div className="relative shrink-0 mx-auto sm:mx-0">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-white/10
                bg-[#222] flex items-center justify-center group cursor-pointer shadow-none relative"
                                onClick={() => fileRef.current?.click()}>
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                    <User size={48} className="text-gray-600" />
                                )}
                                {avatarUploading && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 size={24} className="animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => fileRef.current?.click()}
                                className="absolute bottom-2 right-0 w-10 h-10 rounded-full 
                  bg-[#333] border border-white/20 
                  flex items-center justify-center hover:bg-[#444] hover:scale-105
                  transition-all shadow-none text-white z-10">
                                <Camera size={18} />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>

                        {/* Name & meta */}
                        <div className="flex-1 min-w-0 pb-1">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white truncate mb-1">{profile.full_name || 'User'}</h2>
                            <p className="text-sm text-gray-400 mb-3">{profile.email}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 items-center">
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                    {profile.rolename || 'Attendee'}
                                </span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5
                  text-gray-400 border border-white/10">
                                    Joined {profile.created_at ? fmt(profile.created_at) : '...'}
                                </span>
                            </div>
                        </div>

                        {/* Top Actions */}
                        <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCancelEdit} disabled={saving}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-transparent border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveProfile} disabled={saving}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-black font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── LEFT: Settings ── */}
                    <div className="space-y-6">
                        {/* Personal Info */}
                        <div className={`bg-[#18181b] rounded-2xl p-6 shadow-none border transition-all duration-300 ${isEditing ? 'border-primary/50 bg-[#1a1a1f]' : 'border-white/10'}`}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-5">
                                <User size={15} className="text-primary" /> Personal Info
                            </h2>
                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2 block">Full Name</label>
                                    {isEditing ? (
                                        <input type="text" value={editForm.fullname} onChange={e => setEditForm({ ...editForm, fullname: e.target.value })}
                                            className="w-full bg-[#222] text-white text-sm rounded-xl px-4 py-2.5 border border-white/20 focus:border-primary focus:bg-[#333] outline-none transition-all" />
                                    ) : (
                                        <p className="text-sm text-gray-200">{profile.fullname}</p>
                                    )}
                                </div>
                                {/* Email */}
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Email</p>
                                    <div className="flex items-center gap-2">
                                        <Mail size={13} className="text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-200">{profile.email}</span>
                                        {isEditing && <span className="ml-auto text-[10px] text-gray-500 italic">Cannot change</span>}
                                    </div>
                                </div>
                                {/* Phone */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2 block">Phone</label>
                                    {isEditing ? (
                                        <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full bg-[#222] text-white text-sm rounded-xl px-4 py-2.5 border border-white/20 focus:border-primary focus:bg-[#333] outline-none transition-all" />
                                    ) : (
                                        <p className="text-sm text-gray-200">{profile.phone || <span className="text-gray-500 italic">Not set</span>}</p>
                                    )}
                                </div>
                                {/* Location */}
                                <div>
                                    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2 block">Home State</h2>
                                    {isEditing ? (
                                        <select
                                            value={editForm.homestateid || ''}
                                            onChange={e => setEditForm({ ...editForm, homestateid: e.target.value })}
                                            className="w-full bg-[#222] text-white text-sm rounded-xl px-4 py-2.5 border border-white/20 focus:border-primary focus:bg-[#333] outline-none transition-all">
                                            <option value="">— Select State —</option>
                                            {states.map(s => (
                                                <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-gray-200">
                                            {profile.homestateid
                                                ? states.find(s => s.state_id == profile.homestateid)?.state_name || 'Set'
                                                : <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        {!isEditing && (
                            <div className="bg-[#18181b] rounded-2xl p-6 shadow-none border border-white/10 space-y-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Lock size={15} className="text-error" /> Security
                                </h2>
                                <PasswordSection onToast={showToast} />
                            </div>
                        )}

                        {/* Role Request */}
                        {!isEditing && <RoleRequestSection user={profile} onToast={showToast} />}

                        {/* Mobile logout */}
                        <button onClick={handleLogout}
                            className="sm:hidden flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold
                text-error border border-error/20 rounded-xl hover:bg-error/10 transition-all">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>

                    {/* ── RIGHT: Activity ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Bookings', value: bookings.length, icon: Ticket },
                                { label: 'Registered', value: regs.length, icon: ClipboardList },
                                { label: 'Reviews', value: reviews.length, icon: Star },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="bg-[#18181b] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-extrabold text-white leading-none">{value}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 slim-scroll">
                            <Tab active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')}
                                icon={Ticket} label="Bookings" count={bookings.length} />
                            <Tab active={activeTab === 'regs'} onClick={() => setActiveTab('regs')}
                                icon={ClipboardList} label="Registrations" count={regs.length} />
                            <Tab active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}
                                icon={Star} label="Reviews" count={reviews.length} />
                        </div>

                        {/* Bookings Tab */}
                        {activeTab === 'bookings' && (
                            <div className="space-y-3">
                                {bookings.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center bg-[#18181b] rounded-2xl border border-white/5">
                                        <Ticket size={28} className="text-gray-600 mb-2" />
                                        <p className="text-sm text-gray-400">No bookings yet</p>
                                        <button onClick={() => navigate('/')}
                                            className="mt-3 text-xs text-primary font-semibold hover:underline">Browse events</button>
                                    </div>
                                ) : bookings.map(b => <BookingCard key={b.bookingid} booking={b} />)}
                            </div>
                        )}

                        {/* Registrations Tab */}
                        {activeTab === 'regs' && (
                            <div className="space-y-3">
                                {regs.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center bg-[#18181b] rounded-2xl border border-white/5">
                                        <ClipboardList size={28} className="text-gray-600 mb-2" />
                                        <p className="text-sm text-gray-400">No event registrations</p>
                                        <button onClick={() => navigate('/')}
                                            className="mt-3 text-xs text-primary font-semibold hover:underline">Browse events</button>
                                    </div>
                                ) : regs.map(r => <RegCard key={r.registrationid} reg={r} />)}
                            </div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-3">
                                {reviews.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center bg-[#18181b] rounded-2xl border border-white/5">
                                        <Star size={28} className="text-gray-600 mb-2" />
                                        <p className="text-sm text-gray-400">No reviews written yet</p>
                                    </div>
                                ) : reviews.map(r => <MyReviewCard key={r.reviewid} review={r} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
