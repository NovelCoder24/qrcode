import React, { useState, useMemo } from 'react';
import { 
    Star, 
    X, 
    Sparkles, 
    Copy, 
    Check, 
    MessageCircle, 
    ShieldAlert, 
    Heart, 
    Gift
} from 'lucide-react';

/**
 * ReviewFunnel Component
 * 
 * In-Store Google Review Engine & Private WhatsApp Shield:
 * 1. Floating Bottom Pill: "⭐ Loved our food? Tap to leave a 10s Google Review"
 * 2. In-Menu Review Modal with 5 interactive stars:
 *    - 4-5 Stars: 3 AI-synthesized review drafts based on actual menu dishes -> 1-tap copy & open Google Maps.
 *    - 1-3 Stars: Private WhatsApp Shield routing dissatisfied guests directly to owner with voucher/resolution.
 */
const ReviewFunnel = ({
    restaurantName = 'Our Cafe',
    googleReviewUrl = '',
    shieldPhone = '',
    categories = [],
    resolutionOffer = '20% off your next visit & direct resolution'
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isPillDismissed, setIsPillDismissed] = useState(false);
    
    // Low rating (1-3 stars) shield state
    const [selectedIssues, setSelectedIssues] = useState([]);
    const [customComplaint, setCustomComplaint] = useState('');
    const [complaintSent, setComplaintSent] = useState(false);

    // Format WhatsApp phone number (default India +91 if 10 digits)
    const cleanPhone = useMemo(() => {
        if (!shieldPhone) return '';
        const digits = String(shieldPhone).replace(/\D/g, '');
        if (digits.length === 10) return `91${digits}`;
        return digits;
    }, [shieldPhone]);

    // Extract bestseller / top dishes from menu categories for AI synthesis
    const featuredDishes = useMemo(() => {
        const dishList = [];
        if (Array.isArray(categories)) {
            categories.forEach(cat => {
                if (Array.isArray(cat?.items)) {
                    cat.items.forEach(item => {
                        if (item?.name && typeof item.name === 'string') {
                            const trimmed = item.name.trim();
                            if (trimmed && !dishList.includes(trimmed)) {
                                dishList.push(trimmed);
                            }
                        }
                    });
                }
            });
        }
        return dishList.slice(0, 5);
    }, [categories]);

    // Synthesize 3 natural AI review drafts
    const reviewDrafts = useMemo(() => {
        const dish1 = featuredDishes[0] || 'Cold Coffee';
        const dish2 = featuredDishes[1] || 'food';
        const dish3 = featuredDishes[2] || 'specialties';

        return [
            {
                id: 'draft-1',
                tag: '✨ Food & Ambience',
                text: `Loved the food and aesthetic ambience at ${restaurantName}! The ${dish1} was absolutely delicious and freshly made. Super warm staff and quick service. 10/10 recommendation! ⭐⭐⭐⭐⭐`
            },
            {
                id: 'draft-2',
                tag: '☕ Quality & Vibe',
                text: `Had an amazing dining experience at ${restaurantName}. The ${dish2} and hospitality were top notch! Great music, cozy seating, and wonderful presentation. Definitely coming back!`
            },
            {
                id: 'draft-3',
                tag: '🔥 Must Visit',
                text: `One of the best dining spots in town! Tried their ${dish1} and ${dish3}—everything tasted incredible. Quick service and pocket-friendly pricing. Highly recommend everyone to visit!`
            }
        ];
    }, [restaurantName, featuredDishes]);

    // Rating descriptor text
    const getRatingDescriptor = (stars) => {
        switch (stars) {
            case 5: return { label: 'Amazing! 🌟', sub: 'You made our day! Could you share the love on Google?' };
            case 4: return { label: 'Great experience! 😊', sub: 'We are so glad you enjoyed! Help others find us on Google.' };
            case 3: return { label: 'Could be better 😐', sub: 'We are sorry your visit was just okay. Let us make it right.' };
            case 2: return { label: 'Disappointing 😕', sub: 'We fell short of our standard. Please let the owner fix this.' };
            case 1: return { label: 'Poor experience 😞', sub: 'We sincerely apologize. Please connect with management directly.' };
            default: return { label: 'Tap a star to rate', sub: 'Takes only 10 seconds and means the world to our team.' };
        }
    };

    // 1-Tap Copy & Open Google Maps Review link
    const handleCopyAndOpenGoogle = async (draftText, index) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(draftText);
            }
        } catch (e) {
            console.error('Clipboard copy failed', e);
        }

        setCopiedIndex(index);

        // Target Google review URL or Google Maps search fallback
        const targetUrl = googleReviewUrl && googleReviewUrl.trim().startsWith('http')
            ? googleReviewUrl.trim()
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}`;

        setTimeout(() => {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }, 350);

        setTimeout(() => {
            setCopiedIndex(null);
        }, 4000);
    };

    // Open Private WhatsApp Shield
    const handleOpenWhatsAppShield = () => {
        if (!cleanPhone) {
            alert('Owner WhatsApp number is not configured for direct chat.');
            return;
        }

        const issuesStr = selectedIssues.length > 0 
            ? `\nIssues noticed: ${selectedIssues.join(', ')}` 
            : '';
        const notesStr = customComplaint.trim() 
            ? `\nNote: "${customComplaint.trim()}"` 
            : '';

        const message = `Hi, I just visited ${restaurantName} and rated my experience ${rating} star${rating > 1 ? 's' : ''}.${issuesStr}${notesStr}\n\nI am sharing this privately so management can look into it.`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        setComplaintSent(true);
    };

    const toggleIssueTag = (tag) => {
        setSelectedIssues(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const currentDescriptor = getRatingDescriptor(hoverRating || rating);

    return (
        <>
            {/* 1. Subtle, Persistent Floating Bottom Pill (Mobile Responsive) */}
            {!isPillDismissed && (
                <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] w-max pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-950/95 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/20 select-none">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3 py-1.5 sm:py-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold tracking-tight cursor-pointer whitespace-nowrap"
                        >
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-xs shrink-0">
                                ★
                            </span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
                                <span className="text-slate-200 hidden min-[390px]:inline">Loved our food?</span>
                                <span className="text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors">
                                    Leave a 10s Review
                                </span>
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPillDismissed(true)}
                            aria-label="Dismiss review banner"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 text-xs shrink-0 cursor-pointer mr-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Reopen floating pill shortcut if dismissed */}
            {isPillDismissed && !isModalOpen && (
                <button
                    type="button"
                    onClick={() => {
                        setIsPillDismissed(false);
                        setIsModalOpen(true);
                    }}
                    className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl flex items-center justify-center font-black text-base sm:text-lg active:scale-95 transition-all border-2 border-white cursor-pointer select-none"
                    title="Leave a Review"
                >
                    ★
                </button>
            )}

            {/* 2. IN-MENU REVIEW & REPUTATION SHIELD MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
                    <div 
                        className="bg-white text-slate-900 rounded-t-[2rem] sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 font-black text-sm shrink-0">
                                    ★
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-extrabold text-slate-900 text-sm truncate">
                                        {restaurantName}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Customer Experience & Rating
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setRating(0);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">

                            {/* Question & 5-Star Rating Control */}
                            <div className="text-center space-y-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 10-Second Feedback
                                </span>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    How was your visit today?
                                </h2>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                    {currentDescriptor.sub}
                                </p>

                                {/* 5 Big Stars */}
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    {[1, 2, 3, 4, 5].map((starVal) => {
                                        const isFilled = (hoverRating || rating) >= starVal;
                                        return (
                                            <button
                                                key={starVal}
                                                type="button"
                                                onClick={() => setRating(starVal)}
                                                onMouseEnter={() => setHoverRating(starVal)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1.5 rounded-xl hover:bg-amber-50 transition-all transform hover:scale-115 active:scale-95 cursor-pointer focus:outline-none"
                                                aria-label={`Rate ${starVal} stars`}
                                            >
                                                <Star
                                                    className={`w-9 h-9 transition-colors ${
                                                        isFilled 
                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                                                            : 'text-slate-200'
                                                    }`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="h-5">
                                    <p className="text-xs font-extrabold text-amber-600 uppercase tracking-wide">
                                        {currentDescriptor.label}
                                    </p>
                                </div>
                            </div>

                            {/* ═══════════════════════════════════════════════════
                                BRANCH A: 4 or 5 STARS (AI Google Review Booster)
                                ═══════════════════════════════════════════════════ */}
                            {(rating === 4 || rating === 5) && (
                                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 p-4 rounded-2xl border border-amber-200/60 text-center space-y-1">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                                            <span>Thank you so much!</span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                            Google reviews help our small local team thrive. Tap any 1-click draft below to copy & open Google Maps:
                                        </p>
                                    </div>

                                    {/* 3 AI Generated Review Draft Cards */}
                                    <div className="space-y-3">
                                        {reviewDrafts.map((draft, idx) => {
                                            const isCopied = copiedIndex === idx;
                                            return (
                                                <div 
                                                    key={draft.id}
                                                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 transition-all space-y-2.5"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                            {draft.tag}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                                            AI Draft #{idx + 1}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                                                        "{draft.text}"
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyAndOpenGoogle(draft.text, idx)}
                                                        className={`w-full py-2.5 px-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 ${
                                                            isCopied
                                                                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                        }`}
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="w-4 h-4 text-emerald-200" />
                                                                <span>Copied! Opening Google Reviews...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5 text-amber-300" />
                                                                <span>1-Tap Copy & Open Google Reviews ↗</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ═══════════════════════════════════════════════════
                                BRANCH B: 1, 2, or 3 STARS (Private WhatsApp Shield)
                                ═══════════════════════════════════════════════════ */}
                            {(rating >= 1 && rating <= 3) && (
                                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                            <span>Private Owner Resolution Shield</span>
                                        </div>
                                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
                                            We are so sorry your visit wasn't perfect! Please message the owner privately on WhatsApp so we can fix this immediately.
                                        </p>
                                        {resolutionOffer && (
                                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                                                <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                <span>Owner Offer: {resolutionOffer}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selectable issue tags */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                            What can we improve? (Tap all that apply)
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['Food Taste', 'Slow Service', 'Cleanliness', 'Order Accuracy', 'Staff Behavior', 'Pricing'].map((tag) => {
                                                const isSelected = selectedIssues.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => toggleIssueTag(tag)}
                                                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border cursor-pointer active:scale-95 ${
                                                            isSelected
                                                                ? 'bg-rose-600 text-white border-rose-600'
                                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {isSelected ? `✓ ${tag}` : tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Optional text area */}
                                    <div>
                                        <textarea
                                            rows={2}
                                            value={customComplaint}
                                            onChange={(e) => setCustomComplaint(e.target.value)}
                                            placeholder="Tell us what went wrong (Optional)..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        />
                                    </div>

                                    {/* Big WhatsApp Shield CTA */}
                                    <button
                                        type="button"
                                        onClick={handleOpenWhatsAppShield}
                                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                    >
                                        <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                                        <span>Message Owner on WhatsApp (Private)</span>
                                    </button>

                                    <p className="text-[11px] text-slate-400 text-center">
                                        🛡️ Your feedback goes directly to management, protecting our team while ensuring you are taken care of.
                                    </p>

                                    {complaintSent && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800">
                                            Thank you! WhatsApp opened. Management will respond promptly.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReviewFunnel;
