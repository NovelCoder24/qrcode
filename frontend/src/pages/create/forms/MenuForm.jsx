import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFile } from '../../../api/axios';

const MenuForm = ({ data, onChange }) => {
    // Defaults
    const d = data || {};
    const restaurantName = d.restaurantName || '';
    const currency = d.currency || '$';
    const menuTemplate = d.menuTemplate || 'modern'; // 'immersive', 'lighthouse', 'modern', 'playful'
    const categories = d.categories || [
        { id: Date.now().toString(), name: 'Starters', items: [{ id: Date.now().toString() + '1', name: 'Garlic Bread', description: 'Toasted with herb butter', price: '4.99' }] }
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
                categories
            });
        }
    }, []);

    const updateData = (updates) => {
        onChange({ ...d, ...updates });
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
                return { ...c, items: [...c.items, { id: Date.now().toString(), name: 'New Item', description: '', price: '0.00' }] };
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

    return (
        <div className="space-y-8 pb-10">
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
                            <option value="$">$ (Dollar)</option>
                            <option value="₹">₹ (INR)</option>
                        </select>
                    </div>
                </div>
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
