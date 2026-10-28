import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Sparkles, Scissors, Coffee, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { setBusinessCategory } from '../redux/authSlice';

const BusinessCategoryModal = ({ isOpen }) => {
    const dispatch = useDispatch();
    const [selectedCategory, setSelectedCategory] = useState('salon');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setIsSaving(true);
            await api.put('/users/profile', { businessCategory: selectedCategory });
            dispatch(setBusinessCategory(selectedCategory));
        } catch (err) {
            console.error('Failed to save business vertical', err);
            // Even if network fails, dispatch to allow local workflow continuity
            dispatch(setBusinessCategory(selectedCategory));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-100 overflow-hidden relative">
                {/* Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick Personalization</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    What type of business do you run?
                </h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    QRVibe automatically tailors your QR creator labels, templates, and Google review generator to your specific industry.
                </p>

                {/* Vertical Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Option 1: Salon & Beauty */}
                    <div
                        onClick={() => setSelectedCategory('salon')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                            selectedCategory === 'salon'
                                ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-500/10 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                        {selectedCategory === 'salon' && (
                            <div className="absolute top-3.5 right-3.5 text-indigo-600">
                                <CheckCircle2 className="w-5 h-5 fill-indigo-100 text-indigo-600" />
                            </div>
                        )}
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center mb-3">
                                <Scissors className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base mb-1">
                                Salon, Spa & Beauty
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                Hair styling, nail spas, aesthetics, skin care, bridal lookbooks & grooming.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-auto">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200/60">Rate Cards</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">Lookbooks</span>
                        </div>
                    </div>

                    {/* Option 2: Cafe & Restaurant */}
                    <div
                        onClick={() => setSelectedCategory('cafe')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                            selectedCategory === 'cafe'
                                ? 'border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-500/10 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                        {selectedCategory === 'cafe' && (
                            <div className="absolute top-3.5 right-3.5 text-indigo-600">
                                <CheckCircle2 className="w-5 h-5 fill-indigo-100 text-indigo-600" />
                            </div>
                        )}
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                                <Coffee className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base mb-1">
                                Cafe & Dining
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                Coffee shops, bakeries, casual diners, bars, QSRs & cloud kitchens.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-auto">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">Digital Menus</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">Dietary Tags</span>
                        </div>
                    </div>
                </div>

                {/* Confirm Action */}
                <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Setting up your dashboard...</span>
                        </>
                    ) : (
                        <>
                            <span>Continue to Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BusinessCategoryModal;
