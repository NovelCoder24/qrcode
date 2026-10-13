import React, { useState, useRef } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, MessageCircle, CheckCircle2, AlertCircle, Camera, Sparkles, UploadCloud, FileText } from 'lucide-react';
import { uploadFile, parseMenuPhotos } from '../../../api/axios';
import { normalizeWhatsAppPhone } from '../../../utils/whatsappCart';
import { compressMultipleFiles } from '../../../utils/imageCompressor';
import MenuImportModal from '../../../components/MenuTemplates/MenuImportModal';

const MenuForm = ({ data, onChange }) => {
    // Defaults
    const d = data || {};
    const restaurantName = d.restaurantName || '';
    const currency = d.currency || '₹';
    const menuTemplate = d.menuTemplate || 'modern'; // 'immersive', 'lighthouse', 'modern', 'playful'
    const whatsappOrderingEnabled = d.whatsappOrderingEnabled !== undefined ? Boolean(d.whatsappOrderingEnabled) : true;
    const whatsappNumber = d.whatsappNumber || '';
    const defaultTableNumber = d.defaultTableNumber || '';
    const normalizedWaPhone = normalizeWhatsAppPhone(whatsappNumber);

    // AI Photo-to-Menu State
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState('');
    const [scanError, setScanError] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [extractedMenuData, setExtractedMenuData] = useState(null);
    const [uploadedThumbnails, setUploadedThumbnails] = useState([]);
    const [importSuccessMsg, setImportSuccessMsg] = useState(null);
    const fileInputRef = useRef(null);

    const categories = d.categories || [
        {
            id: Date.now().toString(),
            name: 'Bestsellers',
            items: [
                { id: Date.now().toString() + '1', name: 'Cold Coffee', description: 'Rich espresso blended with creamy milk & ice', price: '150' },
                { id: Date.now().toString() + '2', name: 'Garlic Bread', description: 'Toasted sourdough with roasted garlic herb butter', price: '120' }
            ]
        }
    ];

    const templates = [
        { id: 'immersive', label: 'L\'Ambroisie Immersive', desc: 'Premium interactive digital menu', image: 'https://placehold.co/400x600/0d0a0b/d4af37?text=Immersive+Design' },
        { id: 'lighthouse', label: 'Lighthouse Cafe', desc: 'Premium minimal design with diet tags', image: 'https://placehold.co/400x600/F3EFE9/2C2B29?text=Lighthouse+Cafe' },
        { id: 'modern', label: 'Modern Grid', desc: 'Card based menu', image: 'https://placehold.co/400x600/f8fafc/0f172a?text=Modern+Grid' },
        { id: 'playful', label: 'Playful Bites', desc: 'Colorful & fun', image: 'https://placehold.co/400x600/fff1f2/f43f5e?text=Playful+Bites' }
    ];

    // Initialize defaults in parent state once on mount if missing
    React.useEffect(() => {
        if (!data?.categories) {
            onChange({
                ...d,
                menuTemplate,
                currency,
                whatsappOrderingEnabled,
                whatsappNumber,
                defaultTableNumber,
                categories
            });
        }
    }, []);

    const updateData = (updates) => {
        onChange({
            ...d,
            menuTemplate,
            currency,
            whatsappOrderingEnabled,
            whatsappNumber,
            defaultTableNumber,
            categories,
            ...updates
        });
    };

    const addCategory = () => {
        const newCats = [...categories, { id: Date.now().toString(), name: 'New Category', items: [] }];
        updateData({ categories: newCats });
    };

    const removeCategory = (catId) => {
        updateData({ categories: categories.filter(c => c.id !== catId) });
    };

    const updateCategoryName = (catId, newName) => {
        updateData({ categories: categories.map(c => c.id === catId ? { ...c, name: newName } : c) });
    };

    const addItem = (catId) => {
        const newCats = categories.map(c => {
            if (c.id === catId) {
                return { ...c, items: [...c.items, { id: Date.now().toString(), name: 'New Item', description: '', price: '150' }] };
            }
            return c;
        });
        updateData({ categories: newCats });
    };

    const removeItem = (catId, itemId) => {
        const newCats = categories.map(c => {
            if (c.id === catId) {
                return { ...c, items: c.items.filter(i => i.id !== itemId) };
            }
            return c;
        });
        updateData({ categories: newCats });
    };

    const [uploadingItem, setUploadingItem] = useState(null);

    const updateItem = (catId, itemId, field, value) => {
        const newCats = categories.map(c => {
            if (c.id === catId) {
                return {
                    ...c,
                    items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
                };
            }
            return c;
        });
        updateData({ categories: newCats });
    };

    const handleImageUpload = async (e, catId, itemId) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploadingItem(itemId);
        try {
            const res = await uploadFile(file);
            updateItem(catId, itemId, 'img', res.url);
        } catch (error) {
            console.error("Item image upload failed", error);
            // Optionally could add a local error state, but failing silently to console is ok here.
        } finally {
            setUploadingItem(null);
        }
    };

    // AI Photo-to-Menu Handlers
    const handleMenuPhotoUpload = async (e) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsScanning(true);
        setScanError(null);
        setImportSuccessMsg(null);

        // Generate client thumbnails for side-by-side verification
        const thumbs = Array.from(selectedFiles)
            .filter((f) => f.type.startsWith('image/'))
            .map((f) => URL.createObjectURL(f));
        setUploadedThumbnails(thumbs);

        try {
            // Stage 1: Client compression (max 1600px, JPEG 0.8)
            setScanStage('Compressing & preparing menu pages (~200KB/page)...');
            const compressedFiles = await compressMultipleFiles(selectedFiles);

            // Stage 2: Gemini multimodal call
            setScanStage('AI is reading categories, dishes, prices & portions...');
            const data = await parseMenuPhotos({
                files: compressedFiles,
                mode: 'replace',
                autoFillPhotos: true,
                existingCategories: categories,
            });

            // Stage 3: Matching photos & descriptions
            setScanStage('Matching appetizing dish photos from catalog...');
            setExtractedMenuData(data);
            setIsReviewModalOpen(true);
        } catch (err) {
            console.error('AI Menu Photo Extraction Failed:', err);
            let msg = 'Failed to parse menu photo. Please try a clearer picture.';
            if (typeof err.response?.data?.message === 'string') {
                msg = err.response.data.message;
            } else if (typeof err.response?.data?.error === 'string') {
                msg = err.response.data.error;
            } else if (typeof err.response?.data?.error?.message === 'string') {
                msg = err.response.data.error.message;
            } else if (typeof err.response?.data === 'string' && !err.response.data.trim().startsWith('<')) {
                msg = err.response.data;
            } else if (typeof err.message === 'string') {
                msg = err.message;
            }
            setScanError(String(msg));
        } finally {
            setIsScanning(false);
            setScanStage('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleApplyExtractedMenu = ({ categories: newCategories, currency: detectedCurrency, restaurantName: detectedName, mode }) => {
        let finalCategories = newCategories;

        if (mode === 'append') {
            // Merge with existing
            const existingMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
            newCategories.forEach((cat) => {
                const key = cat.name.toLowerCase();
                if (existingMap.has(key)) {
                    const existingCat = existingMap.get(key);
                    existingCat.items = [...(existingCat.items || []), ...(cat.items || [])];
                } else {
                    existingMap.set(key, cat);
                }
            });
            finalCategories = Array.from(existingMap.values());
        }

        updateData({
            categories: finalCategories,
            currency: detectedCurrency || currency,
            restaurantName: restaurantName || detectedName || '',
        });

        const dishCount = finalCategories.reduce((acc, c) => acc + (c.items?.length || 0), 0);
        setImportSuccessMsg(`✨ Successfully imported ${dishCount} dishes across ${finalCategories.length} categories!`);
        setTimeout(() => setImportSuccessMsg(null), 8000);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* AI Photo-to-Menu Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" /> AI Auto-Fill in 5s
                            </span>
                            <span className="text-xs text-indigo-300/80 font-medium hidden sm:inline">
                                Zero-typing menu setup
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            Upload Photo of Paper Menu
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                            Snap a picture of your physical menu card or upload a PDF. Gemini Flash AI reads all categories, dishes, prices & portion variants, matches appetizing photos, and auto-fills your menu!
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleMenuPhotoUpload}
                            disabled={isScanning}
                            className="hidden"
                            id="menu-photo-input"
                        />
                        <label
                            htmlFor="menu-photo-input"
                            className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-lg active:scale-95 ${
                                isScanning
                                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/10'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                            }`}
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                                    <span>Scanning Paper Menu...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    <span>📸 Upload Menu Photo (Auto-Fill)</span>
                                </>
                            )}
                        </label>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            Supports up to 8 photos or multi-page PDF
                        </span>
                    </div>
                </div>

                {/* Staged scanning progress banner */}
                {isScanning && (
                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3 animate-pulse">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                        <span className="text-xs font-semibold text-emerald-300">{scanStage}</span>
                    </div>
                )}

                {/* Dismissible Scan Error */}
                {scanError && (
                    <div className="mt-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <strong className="font-bold">Scan Error: </strong>
                            <span>{scanError}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setScanError(null)}
                            className="text-rose-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Success Banner */}
                {importSuccessMsg && (
                    <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{importSuccessMsg}</span>
                    </div>
                )}
            </div>

            {/* Review & Audit Modal */}
            <MenuImportModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                extractedData={extractedMenuData}
                uploadedThumbnails={uploadedThumbnails}
                onApply={handleApplyExtractedMenu}
            />

            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Restaurant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Restaurant/Cafe Name</label>
                        <input
                            type="text"
                            value={restaurantName}
                            onChange={(e) => updateData({ restaurantName: e.target.value })}
                            placeholder="e.g. The Coffee House"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Currency Symbol</label>
                        <select
                            value={currency}
                            onChange={(e) => updateData({ currency: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                        >
                            <option value="₹">₹ (INR)</option>
                            <option value="$">$ (Dollar)</option>
                            <option value="€">€ (Euro)</option>
                            <option value="£">£ (Pound)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Scan-to-WhatsApp Cart Config */}
            <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200/80 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-800 text-base">Scan-to-WhatsApp Cart</h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                    Direct wa.me Order
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                                Add a <span className="font-semibold text-slate-800">+ Add</span> button next to every dish and a sticky <span className="font-semibold text-emerald-700">Send Order on WhatsApp</span> bar at the bottom.
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            checked={whatsappOrderingEnabled}
                            onChange={(e) => updateData({ whatsappOrderingEnabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                {whatsappOrderingEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/60">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Café / Kitchen WhatsApp Number *
                            </label>
                            <input
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => updateData({ whatsappNumber: e.target.value })}
                                placeholder="e.g. +91 98765 43210"
                                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            />
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                                {normalizedWaPhone ? (
                                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        Orders will open <code className="bg-emerald-100/80 px-1 rounded">wa.me/{normalizedWaPhone}</code>
                                    </span>
                                ) : (
                                    <span className="text-amber-700 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        Enter a 10-digit mobile number to activate the cart buttons on your menu
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Default Table / Counter Label (Optional)
                            </label>
                            <input
                                type="text"
                                value={defaultTableNumber}
                                onChange={(e) => updateData({ defaultTableNumber: e.target.value })}
                                placeholder="e.g. Table 4 or Counter Pickup"
                                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            />
                            <p className="mt-1.5 text-[11px] text-slate-500">
                                Customers can also edit their Table # inside the cart before tapping Send.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Template Selection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Choose a Menu Template</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {templates.map(tpl => (
                        <div
                            key={tpl.id}
                            onClick={() => updateData({ menuTemplate: tpl.id })}
                            className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${menuTemplate === tpl.id ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2' : 'border-slate-200 hover:border-indigo-300'}`}
                        >
                            <div className="aspect-[2/3] w-full bg-slate-100 relative">
                                <img src={tpl.image} alt={tpl.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                    <h4 className="font-bold text-sm text-white">{tpl.label}</h4>
                                    <p className="text-[10px] text-white/70 line-clamp-1">{tpl.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu Builder */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Menu Categories & Items</h3>
                    <button onClick={addCategory} className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                </div>

                {categories.map((cat, cIdx) => (
                    <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={cat.name}
                                onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                                placeholder="Category Name (e.g. Starters, Mains)"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button onClick={() => removeCategory(cat.id)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 pl-2 sm:pl-6 border-l-2 border-indigo-100 ml-2 sm:ml-4">
                            {cat.items.map((item, iIdx) => (
                                <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                        <div className="sm:col-span-8">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(cat.id, item.id, 'name', e.target.value)}
                                                placeholder="Item Name"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500 mb-2"
                                            />
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => updateItem(cat.id, item.id, 'description', e.target.value)}
                                                placeholder="Item description (e.g. ingredients)"
                                                rows="2"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 resize-none mb-2"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleImageUpload(e, cat.id, item.id)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                        disabled={uploadingItem === item.id}
                                                    />
                                                    <button 
                                                        disabled={uploadingItem === item.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        {uploadingItem === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                                        {item.img ? 'Change Image' : 'Upload Image'}
                                                    </button>
                                                </div>
                                                {item.img && (
                                                    <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200 group-hover:border-indigo-200 transition-colors">
                                                        <img src={item.img} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-4 flex flex-col gap-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                                                <input
                                                    type="text"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(cat.id, item.id, 'price', e.target.value)}
                                                    placeholder="Price"
                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <button onClick={() => removeItem(cat.id, item.id)} className="text-xs text-red-500 font-semibold text-right hover:underline mt-auto">
                                                Remove Item
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button onClick={() => addItem(cat.id)} className="text-sm font-semibold text-slate-500 flex items-center gap-1 hover:text-indigo-600 mt-2 px-2 py-1">
                                <Plus className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuForm;
