import React, { useState, useRef } from 'react';
import { 
    Plus, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    ChevronRight, 
    Image as ImageIcon, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Camera, 
    Sparkles, 
    UploadCloud, 
    FileText,
    BookOpen,
    Utensils,
    Pencil,
    Check,
    X,
    Eye
} from 'lucide-react';
import { uploadFile, parseMenuPhotos } from '../../../api/axios';
import { compressMultipleFiles } from '../../../utils/imageCompressor';
import MenuImportModal from '../../../components/MenuTemplates/MenuImportModal';

const MenuForm = ({ data, onChange }) => {
    // Defaults
    const d = data || {};
    const restaurantName = d.restaurantName || '';
    const currency = d.currency || '₹';
    const menuTemplate = d.menuTemplate || 'modern'; // 'immersive', 'lighthouse', 'modern', 'playful'

    // AI Photo-to-Menu State
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState('');
    const [scanError, setScanError] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [extractedMenuData, setExtractedMenuData] = useState(null);
    const [uploadedThumbnails, setUploadedThumbnails] = useState([]);
    const [importSuccessMsg, setImportSuccessMsg] = useState(null);
    const fileInputRef = useRef(null);

    // Dropdown Card & Abstraction States
    const [isMenuCardOpen, setIsMenuCardOpen] = useState(true);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [expandedDishes, setExpandedDishes] = useState({});
    const [hasAiImported, setHasAiImported] = useState(false);
    const menuCardRef = useRef(null);

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

    const totalDishes = categories.reduce((acc, c) => acc + (c.items?.length || 0), 0);

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
                categories
            });
        }
    }, []);

    const updateData = (updates) => {
        onChange({
            ...d,
            menuTemplate,
            currency,
            categories,
            ...updates
        });
    };

    const toggleCategoryCollapse = (catId) => {
        setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const toggleDishExpand = (itemId) => {
        setExpandedDishes(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const areAllDishesExpanded = () => {
        const allItemIds = categories.flatMap(c => (c.items || []).map(i => i.id));
        if (allItemIds.length === 0) return false;
        return allItemIds.every(id => !!expandedDishes[id]);
    };

    const toggleAllDishesExpansion = () => {
        const currentlyAllExpanded = areAllDishesExpanded();
        if (currentlyAllExpanded) {
            setExpandedDishes({});
        } else {
            const next = {};
            categories.forEach(c => {
                (c.items || []).forEach(i => {
                    next[i.id] = true;
                });
            });
            setExpandedDishes(next);
        }
    };

    const addCategory = () => {
        const newCatId = Date.now().toString();
        const newCats = [...categories, { id: newCatId, name: 'New Category', items: [] }];
        updateData({ categories: newCats });
        setCollapsedCategories(prev => ({ ...prev, [newCatId]: false }));
        setIsMenuCardOpen(true);
    };

    const removeCategory = (catId) => {
        updateData({ categories: categories.filter(c => c.id !== catId) });
    };

    const updateCategoryName = (catId, newName) => {
        updateData({ categories: categories.map(c => c.id === catId ? { ...c, name: newName } : c) });
    };

    const addItem = (catId) => {
        const newItemId = Date.now().toString();
        const newCats = categories.map(c => {
            if (c.id === catId) {
                return { ...c, items: [...(c.items || []), { id: newItemId, name: 'New Item', description: '', price: '150' }] };
            }
            return c;
        });
        updateData({ categories: newCats });
        setCollapsedCategories(prev => ({ ...prev, [catId]: false }));
        setExpandedDishes(prev => ({ ...prev, [newItemId]: true }));
        setIsMenuCardOpen(true);
    };

    const removeItem = (catId, itemId) => {
        const newCats = categories.map(c => {
            if (c.id === catId) {
                return { ...c, items: (c.items || []).filter(i => i.id !== itemId) };
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
                    items: (c.items || []).map(i => i.id === itemId ? { ...i, [field]: value } : i)
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
        setHasAiImported(true);
        setIsMenuCardOpen(true);
        // All dishes abstracted by default so they fit neatly in the dropdown card
        setExpandedDishes({});
        setCollapsedCategories({});

        // Smooth scroll to the Dropdown Card so user instantly sees their imported menu without scrolling mid to bottom
        setTimeout(() => {
            menuCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);

        setTimeout(() => setImportSuccessMsg(null), 10000);
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
                            className="text-rose-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Success Banner with Direct Smooth Scroll to Menu Dropdown Card */}
                {importSuccessMsg && (
                    <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-semibold truncate">{importSuccessMsg}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsMenuCardOpen(true);
                                menuCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="px-3 py-1 bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 rounded-lg font-bold transition-all shrink-0 cursor-pointer text-xs"
                        >
                            View Extracted Menu ↓
                        </button>
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

            {/* Basic Info: Restaurant Details */}
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Currency Symbol</label>
                        <select
                            value={currency}
                            onChange={(e) => updateData({ currency: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none font-medium text-slate-800"
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

            {/* Dropdown Card: Menu Categories & Abstracted Dishes */}
            <div 
                ref={menuCardRef} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-6 transition-all"
            >
                {/* Main Dropdown Card Header */}
                <div className="p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/20">
                    <div 
                        onClick={() => setIsMenuCardOpen(!isMenuCardOpen)}
                        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                    >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-slate-900 text-lg">
                                    Menu Categories & Dishes
                                </h3>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 tabular-nums">
                                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} • {totalDishes} {totalDishes === 1 ? 'Dish' : 'Dishes'}
                                </span>
                                {hasAiImported && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" /> AI Auto-Filled
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isMenuCardOpen 
                                    ? 'All dishes are cleanly abstracted. Click any dish to expand and edit details.'
                                    : 'Dropdown card collapsed. Click to expand and manage dishes.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isMenuCardOpen && (
                            <>
                                <button
                                    type="button"
                                    onClick={toggleAllDishesExpansion}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1"
                                    title="Toggle between compact abstracted rows and full multi-line editors"
                                >
                                    {areAllDishesExpanded() ? 'Abstract All Dishes' : 'Expand All Dishes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Category</span>
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsMenuCardOpen(!isMenuCardOpen)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title={isMenuCardOpen ? 'Collapse menu card' : 'Expand menu card'}
                        >
                            {isMenuCardOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Dropdown Card Body */}
                {isMenuCardOpen ? (
                    <div className="p-5 sm:p-6 space-y-5">
                        {categories.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-slate-700 mb-1">No categories in your menu yet.</p>
                                <p className="text-xs text-slate-500 mb-4">Upload a paper menu photo above or add categories manually.</p>
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 cursor-pointer"
                                >
                                    + Add First Category
                                </button>
                            </div>
                        ) : (
                            categories.map((cat, cIdx) => {
                                const isCatCollapsed = !!collapsedCategories[cat.id];
                                return (
                                    <div 
                                        key={cat.id || cIdx} 
                                        className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-2xs"
                                    >
                                        {/* Category Header Card */}
                                        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white border-b border-slate-200/80">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategoryCollapse(cat.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                                                    title={isCatCollapsed ? 'Expand category' : 'Collapse category'}
                                                >
                                                    {isCatCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>

                                                <input
                                                    type="text"
                                                    value={cat.name}
                                                    onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                                                    placeholder="Category Name (e.g. Starters, Mains)"
                                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-slate-50 text-sm sm:text-base font-extrabold text-slate-800 px-2 py-1 rounded-lg focus:outline-none flex-1 min-w-0"
                                                />

                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                    {cat.items?.length || 0} {cat.items?.length === 1 ? 'dish' : 'dishes'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => addItem(cat.id)}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Add Dish</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => removeCategory(cat.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Abstracted Dishes List */}
                                        {!isCatCollapsed && (
                                            <div className="p-3.5 sm:p-4 space-y-2.5 bg-slate-50/50">
                                                {(!cat.items || cat.items.length === 0) ? (
                                                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white/60">
                                                        <p className="text-xs text-slate-400 mb-2 font-medium">No dishes in this category yet.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => addItem(cat.id)}
                                                            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                                                        >
                                                            + Add first dish
                                                        </button>
                                                    </div>
                                                ) : (
                                                    cat.items.map((item, iIdx) => {
                                                        const isExpanded = !!expandedDishes[item.id];
                                                        return (
                                                            <div
                                                                key={item.id || iIdx}
                                                                className={`rounded-xl border transition-all ${
                                                                    isExpanded
                                                                        ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10 p-4 space-y-3'
                                                                        : 'bg-white hover:bg-slate-50/90 border-slate-200/90 p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300'
                                                                }`}
                                                            >
                                                                {!isExpanded ? (
                                                                    /* Abstracted Dish View (Compact Row) */
                                                                    <>
                                                                        <div 
                                                                            onClick={() => toggleDishExpand(item.id)}
                                                                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                                                                        >
                                                                            {/* Thumbnail or placeholder */}
                                                                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                                                                {item.img ? (
                                                                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <Utensils className="w-4 h-4 text-slate-400" />
                                                                                )}
                                                                            </div>

                                                                            {/* Name & Description snippet */}
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-bold text-sm text-slate-800 truncate">
                                                                                        {item.name || 'Unnamed Dish'}
                                                                                    </span>
                                                                                    {item.description_source === 'ai' && (
                                                                                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-bold shrink-0">
                                                                                            AI
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                                    {item.description ? item.description : <span className="italic text-slate-400">No description</span>}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Price & Quick Actions */}
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="font-black text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg tabular-nums">
                                                                                {currency}{item.price || '0'}
                                                                            </span>
                                                                            
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleDishExpand(item.id)}
                                                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                                                                                title="Edit dish details"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                                <span className="hidden sm:inline">Edit</span>
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeItem(cat.id, item.id)}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                                title="Remove dish"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    /* Expanded Dish Full Editor */
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                                                    <Pencil className="w-3.5 h-3.5" /> Edit Dish Details
                                                                                </span>
                                                                                {item.description_source === 'ai' && (
                                                                                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                                                                        AI-Written
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleDishExpand(item.id)}
                                                                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Done
                                                                            </button>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                                            <div className="sm:col-span-8 space-y-2">
                                                                                <div>
                                                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                                                        Dish Name
                                                                                    </label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.name}
                                                                                        onChange={(e) => updateItem(cat.id, item.id, 'name', e.target.value)}
                                                                                        placeholder="e.g. Truffle Mushroom Risotto"
                                                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                                    />
                                                                                </div>

                                                                                <div>
                                                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                                                        Description
                                                                                    </label>
                                                                                    <textarea
                                                                                        value={item.description}
                                                                                        onChange={(e) => updateItem(cat.id, item.id, 'description', e.target.value)}
                                                                                        placeholder="Ingredients, preparation, portion details..."
                                                                                        rows="2"
                                                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="sm:col-span-4 space-y-2 flex flex-col justify-between">
                                                                                <div>
                                                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                                                        Price
                                                                                    </label>
                                                                                    <div className="relative">
                                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.price}
                                                                                            onChange={(e) => updateItem(cat.id, item.id, 'price', e.target.value)}
                                                                                            placeholder="0"
                                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                                                        Photo
                                                                                    </label>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="relative">
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={(e) => handleImageUpload(e, cat.id, item.id)}
                                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                                                disabled={uploadingItem === item.id}
                                                                                            />
                                                                                            <button
                                                                                                type="button"
                                                                                                disabled={uploadingItem === item.id}
                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                                                                                            >
                                                                                                {uploadingItem === item.id ? (
                                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                                                                                ) : (
                                                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                                                )}
                                                                                                {item.img ? 'Change' : 'Upload'}
                                                                                            </button>
                                                                                        </div>

                                                                                        {item.img && (
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200 shrink-0">
                                                                                                    <img src={item.img} className="w-full h-full object-cover" alt="" />
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => updateItem(cat.id, item.id, 'img', '')}
                                                                                                    className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                                                                                                >
                                                                                                    Remove
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex justify-between items-center pt-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeItem(cat.id, item.id)}
                                                                                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => toggleDishExpand(item.id)}
                                                                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                                                                    >
                                                                                        Collapse ▲
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Collapsed Card Summary Strip */
                    <div 
                        onClick={() => setIsMenuCardOpen(true)}
                        className="px-6 py-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs text-slate-600"
                    >
                        <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-hide">
                            <span className="font-bold text-slate-700 shrink-0">Categories:</span>
                            {categories.map((cat, idx) => (
                                <span key={cat.id || idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shrink-0 shadow-2xs">
                                    {cat.name} ({cat.items?.length || 0})
                                </span>
                            ))}
                        </div>
                        <span className="text-indigo-600 font-bold shrink-0 hover:underline flex items-center gap-1">
                            Expand & Edit Dishes <ChevronDown className="w-3.5 h-3.5" />
                        </span>
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
        </div>
    );
};

export default MenuForm;

