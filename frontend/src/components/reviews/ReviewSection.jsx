import { useState, useEffect, useCallback } from 'react';
import { Star, Edit2, Send, Lock, MessageSquare, ChevronDown, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

//  Star Input 
function StarInput({ value, onChange, disabled }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => !disabled && setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Rate ${star} stars`}
                >
                    <Star
                        size={24}
                        className={
                            star <= (hovered || value)
                                ? 'text-gold fill-gold'
                                : 'text-on-surface-variant'
                        }
                        fill={star <= (hovered || value) ? 'currentColor' : 'none'}
                    />
                </button>
            ))}
        </div>
    );
}

//  Static Stars Display 
function StarDisplay({ value, size = 14 }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={star <= Math.round(value) ? 'text-gold' : 'text-on-surface-variant opacity-30'}
                    fill={star <= Math.round(value) ? 'currentColor' : 'none'}
                />
            ))}
        </div>
    );
}

//  Review Card 
function ReviewCard({ review, isOwn, onEdit }) {
    return (
        <div className={`p-4 rounded-2xl border transition-all ${isOwn
                ? 'bg-primary/5 border-primary/20'
                : 'bg-surface-container border-outline-variant'
            }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    {review.avatar_url ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-outline-variant">
                            <img src={review.avatar_url} alt={review.fullname} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: `hsl(${(review.fullname?.charCodeAt(0) || 0) * 15 % 360}, 60%, 50%)` }}>
                            <User size={20} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                            {review.fullname}
                            {isOwn && (
                                <span className="ml-2 text-10px font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    You
                                </span>
                            )}
                        </p>
                        <StarDisplay value={review.rating} size={12} />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-10px text-on-surface-variant mt-0.5">
                            {new Date(review.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </span>
                        {isOwn && review.edit_count < 2 && (
                            <button
                                onClick={onEdit}
                                className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all focus:outline-none"
                                aria-label="Edit review"
                            >
                                <Edit2 size={13} />
                            </button>
                        )}
                        {isOwn && review.edit_count >= 2 && (
                            <span title="Edit limit reached" className="p-1">
                                <Lock size={13} className="text-on-surface-variant opacity-40" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {(() => {
                const rawText = review.review_text || review.comment || review.content || review.reviewtext || '';
                return rawText ? (
                    <p className="mt-2.5 text-sm text-on-surface-variant leading-relaxed pl-10"
                       dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawText) }}
                    />
                ) : (
                    <p className="mt-2.5 text-sm text-on-surface-variant/50 italic leading-relaxed pl-10">
                        No written review provided.
                    </p>
                );
            })()}
            {isOwn && review.edit_count > 0 && (
                <p className="mt-1 pl-10 text-10px text-on-surface-variant opacity-50">
                    Edited · {2 - review.edit_count} edit{2 - review.edit_count !== 1 ? 's' : ''} remaining
                </p>
            )}
        </div>
    );
}

//  Review Form 
function ReviewForm({ initial, onSubmit, onCancel, submitting, isEdit }) {
    const [rating, setRating] = useState(initial?.rating || 0);
    const [text, setText] = useState(initial?.review_text || '');
    const [err, setErr] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!rating) return setErr('Please select a star rating.');
        setErr('');
        onSubmit(rating, text.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-on-surface">
                {isEdit ? 'Edit your review' : 'Write a review'}
            </p>
            <StarInput value={rating} onChange={setRating} disabled={submitting} />
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={submitting}
                placeholder="Share your experience (optional)…"
                rows={3}
                className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl px-4 py-3
          border border-outline-variant focus:border-primary/50 outline-none resize-none
          placeholder-on-surface-variant transition-all disabled:opacity-60"
            />
            {err && <p className="text-xs text-error">{err}</p>}
            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-4 py-2 text-sm text-on-surface-variant border border-outline-variant rounded-xl
              hover:bg-surface-container-high transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting || !rating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-semibold
            rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={13} />
                    {submitting ? 'Submitting…' : isEdit ? 'Update' : 'Submit'}
                </button>
            </div>
        </form>
    );
}

// Main Component 
const REVIEWS_PER_PAGE = 5;

export default function ReviewSection({ eventId }) {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null); // null = not loaded, false = no review
    const [scores, setScores] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [ineligible, setIneligible] = useState(false);
    const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await api.get(`/events/${eventId}/reviews`);
            const data = res.data.data || [];
            setReviews(data);

            // Compute scores locally from fetched reviews
            if (data.length > 0) {
                const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
                setScores({ totalreviews: data.length, avgrating: avg.toFixed(1) });
            } else {
                setScores({ totalreviews: 0, avgrating: null });
            }
        } catch {
            // Non-fatal — reviews just won't show
        }
    }, [eventId]);

    const fetchMyReview = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/events/reviews/my', { params: { event_id: eventId } });
            setMyReview(res.data.data || false);
        } catch {
            setMyReview(false);
        }
    }, [eventId, user]);

    useEffect(() => {
        const load = async () => {
            setLoadingReviews(true);
            await Promise.all([fetchReviews(), fetchMyReview()]);
            setLoadingReviews(false);
        };
        load();
    }, [fetchReviews, fetchMyReview]);

    const handleSubmit = async (rating, reviewtext) => {
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.post('/events/reviews', { eventid: Number(eventId), rating, review_text: reviewtext });
            setShowForm(false);
            await Promise.all([fetchReviews(), fetchMyReview()]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not submit review';
            if (err.response?.status === 403) setIneligible(true);
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (rating, reviewtext) => {
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.patch(`/events/reviews/${myReview.review_id}`, { rating, review_text: reviewtext });
            setEditMode(false);
            await Promise.all([fetchReviews(), fetchMyReview()]);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Could not update review');
        } finally {
            setSubmitting(false);
        }
    };

    // Sort: own review first, then rest
    const sortedReviews = [
        ...reviews.filter((r) => r.user_id === user?.userid),
        ...reviews.filter((r) => r.user_id !== user?.userid),
    ];
    const visibleReviews = sortedReviews.slice(0, visibleCount);
    const hasMore = sortedReviews.length > visibleCount;

    return (
        <div className="mt-10 pt-8 border-t border-outline-variant">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                        <MessageSquare size={14} className="text-primary" />
                        Reviews
                    </h2>
                    {scores && scores.totalreviews > 0 && (
                        <div className="flex items-center gap-2">
                            <StarDisplay value={parseFloat(scores.avgrating)} size={14} />
                            <span className="text-sm font-bold text-on-surface">
                                {scores.avgrating} ({scores.totalreviews} review{scores.totalreviews !== 1 ? 's' : ''})
                            </span>
                        </div>
                    )}
                </div>

                {/* Write Review button — only if no review yet and not in form */}
                {user && !myReview && !showForm && !loadingReviews && (
                    <button
                        onClick={() => { setShowForm(true); setSubmitError(''); setIneligible(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
              bg-surface-container border border-outline-variant text-on-surface-variant
              rounded-xl hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                        <Star size={12} />
                        Write a Review
                    </button>
                )}
            </div>

            {/* Ineligibility notice */}
            {ineligible && (
                <div className="mb-4 flex items-start gap-2 bg-error/5 border border-error/20 rounded-xl px-4 py-3">
                    <Lock size={14} className="text-error shrink-0 mt-0.5" />
                    <p className="text-sm text-error">
                        Reviews are only available after the event/session is over and you have a confirmed booking or registration.
                    </p>
                </div>
            )}

            {/* Submit error */}
            {submitError && !ineligible && (
                <p className="text-sm text-error mb-3">{submitError}</p>
            )}

            {/* Write new review form */}
            {showForm && !myReview && (
                <div className="mb-5">
                    <ReviewForm
                        onSubmit={handleSubmit}
                        onCancel={() => { setShowForm(false); setSubmitError(''); }}
                        submitting={submitting}
                        isEdit={false}
                    />
                </div>
            )}

            {/* Loading skeleton */}
            {loadingReviews && (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loadingReviews && reviews.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
                    <MessageSquare size={28} className="text-on-surface-variant opacity-30 mb-2" />
                    <p className="text-sm text-on-surface-variant">No reviews yet.</p>
                    {user && !showForm && (
                        <p className="text-xs text-on-surface-variant mt-1">
                            Be the first to share your experience!
                        </p>
                    )}
                </div>
            )}

            {/* Review list */}
            {!loadingReviews && reviews.length > 0 && (
                <div className="space-y-3">
                    {visibleReviews.map((review) => {
                        const isOwn = review.user_id === (user?.user_id || user?.id || user?.userid);
                        return editMode && isOwn ? (
                            <ReviewForm
                                key={review.review_id}
                                initial={review}
                                onSubmit={handleEdit}
                                onCancel={() => { setEditMode(false); setSubmitError(''); }}
                                submitting={submitting}
                                isEdit={true}
                            />
                        ) : (
                            <ReviewCard
                                key={review.review_id}
                                review={review}
                                isOwn={isOwn}
                                onEdit={() => { setEditMode(true); setSubmitError(''); }}
                            />
                        );
                    })}

                    {hasMore && (
                        <button
                            onClick={() => setVisibleCount((n) => n + REVIEWS_PER_PAGE)}
                            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm text-on-surface-variant
                border border-outline-variant rounded-xl hover:bg-surface-container hover:text-on-surface transition-all"
                        >
                            <ChevronDown size={14} />
                            Show more reviews
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
