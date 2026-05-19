import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Cake, Wine, Sparkles, X, Star, Flame, Clock, Search, ChevronRight, Compass } from 'lucide-react';

const ImmersiveTemplate = ({ restaurantName, currency, categories }) => {
    // Determine initial category
    const initialCat = categories && categories.length > 0 ? categories[0].name : '';
    const [currentCategoryName, setCurrentCategoryName] = useState(initialCat);
    const [filters, setFilters] = useState({ veg: false, gf: false, search: "" });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const scrollContainerRef = useRef(null);
    const heroBgRef = useRef(null);
    const searchInputRef = useRef(null);

    // Some dummy images for fallback
    const fallbackBgs = [
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1000"
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current && heroBgRef.current) {
                const scrollPos = scrollContainerRef.current.scrollTop;
                if (scrollPos < 300) {
                    heroBgRef.current.style.transform = `scale(${1.05 - (scrollPos / 3000)})`;
                }
            }
        };

        const currentRef = scrollContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (currentRef) currentRef.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const toggleSearch = () => {
        setIsSearchActive(true);
        setTimeout(() => {
            if (searchInputRef.current) searchInputRef.current.focus();
        }, 100);
    };

    const handleSearchBlur = (e) => {
        if (!e.target.value) {
            setIsSearchActive(false);
        }
    };

    const openItemDetails = (item) => {
        setSelectedItem(item);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
    };

    const getCategoryIcon = (index) => {
        const icons = [<Sparkles className="w-3.5 h-3.5" />, <ChefHat className="w-3.5 h-3.5" />, <Cake className="w-3.5 h-3.5" />, <Wine className="w-3.5 h-3.5" />];
        return icons[index % icons.length];
    };

    const getBgImage = (index) => fallbackBgs[index % fallbackBgs.length];

    // Find active category
    const activeCategoryIndex = categories.findIndex(c => c.name === currentCategoryName) || 0;
    const activeCategory = categories.find(c => c.name === currentCategoryName) || categories[0];
    
    // Filter items
    const filteredItems = activeCategory?.items.filter(item => {
        // Tag checking omitted since builder currently doesn't add tags, 
        // but we'll leave the filter logic in case tags are added later.
        const tags = item.tags || [];
        if (filters.veg && !tags.includes("veg")) return false;
        if (filters.gf && !tags.includes("gf")) return false;
        
        const q = filters.search.toLowerCase();
        if (q && !item.name.toLowerCase().includes(q) && !(item.description || "").toLowerCase().includes(q)) return false;
        
        return true;
    }) || [];

    return (
        <div className="font-['Plus_Jakarta_Sans'] bg-[#0b090a] text-[#f5f3f4] min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1516] via-[#0d0a0b] to-[#070506]">
            
            <div className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[48px] overflow-hidden flex flex-col bg-[#161314]/75 backdrop-blur-md shadow-[0_0_80px_rgba(212,175,55,0.05)] border-0 sm:border-[6px] border-[#221b1c] relative">
                
                {/* Screen Reflection Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-50"></div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative flex flex-col pb-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    
                    <div className="relative h-[280px] w-full flex flex-col justify-end px-6 pb-6 overflow-hidden">
                        <div className="absolute inset-0">
                            <img 
                                ref={heroBgRef}
                                src={getBgImage(activeCategoryIndex === -1 ? 0 : activeCategoryIndex)} 
                                className="w-full h-full object-cover brightness-[0.45] scale-105 transition-all duration-700" 
                                alt="Category background" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a0b] via-[#0d0a0b]/40 to-transparent"></div>
                        </div>

                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="h-[1px] w-6 bg-[#d4af37]"></span>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-medium">Fine Experience</p>
                            </div>
                            <h1 className="font-['Playfair_Display'] text-4xl font-light text-white leading-tight">{restaurantName || "Our Menu"}</h1>
                            <p className="text-xs text-[#a39e9e] font-light max-w-[85%]">Curated artisanal ingredients prepared for an exquisite experience.</p>
                        </div>

                        <div className="absolute top-6 left-6 z-10 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></span>
                            <span className="text-[10px] font-medium tracking-wide text-white/80">Serving Now</span>
                        </div>
                    </div>

                    <div className="sticky top-0 z-30 bg-[#0d0a0b]/90 backdrop-blur-md border-y border-[#221b1c] py-4 space-y-4">
                        <div className="flex overflow-x-auto px-6 space-x-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {categories.map((cat, idx) => {
                                const isActive = currentCategoryName === cat.name;
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                            setCurrentCategoryName(cat.name);
                                            if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 240, behavior: 'smooth' });
                                        }}
                                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-[#d4af37] text-black font-semibold shadow-lg shadow-[#d4af37]/20' : 'bg-[#161314] text-white/70 hover:text-white border border-white/5'}`}
                                    >
                                        {getCategoryIcon(idx)}
                                        <span>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between px-6">
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setFilters({...filters, veg: !filters.veg})} 
                                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs ${filters.veg ? 'bg-[#1a1c18] border-emerald-500/50 text-emerald-400' : 'bg-transparent border-[#221b1c] text-[#a39e9e] hover:border-emerald-500/30'}`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Vegetarian</span>
                                </button>
                                <button 
                                    onClick={() => setFilters({...filters, gf: !filters.gf})} 
                                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all duration-300 text-xs ${filters.gf ? 'bg-[#1a1c18] border-amber-500/50 text-amber-400' : 'bg-transparent border-[#221b1c] text-[#a39e9e] hover:border-amber-500/30'}`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>Gluten-Free</span>
                                </button>
                            </div>
                            
                            <div className="relative flex items-center">
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    onBlur={handleSearchBlur}
                                    placeholder="Search dish..." 
                                    className={`transition-all duration-300 bg-[#161314] text-xs px-3 py-1.5 rounded-lg border border-[#221b1c] text-white placeholder-white/30 outline-none ${isSearchActive || filters.search ? 'w-[130px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
                                />
                                <button onClick={toggleSearch} className="p-1.5 rounded-lg text-white/60 hover:text-[#d4af37] transition-all duration-300 absolute right-0 bg-[#0d0a0b]/50">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 flex-1 space-y-4">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                <div className="p-3 rounded-full bg-white/[0.02] border border-white/5 text-[#d4af37]/60">
                                    <Compass className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-medium text-white/80">No matches found</p>
                                <p className="text-xs text-white/40 max-w-[200px]">Try adjusting your search query or removing dietary tags.</p>
                            </div>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => openItemDetails(item)}
                                    className="group relative flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-[#d4af37]/20 hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-[fadeInUp_0.4s_ease-out_both]"
                                    style={{ animationDelay: `${idx * 0.08}s` }}
                                >
                                    {item.img && (
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#161314] border border-white/5">
                                            <img 
                                                src={item.img} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                                alt={item.name} 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                            {(item.tags || []).map((tag, tIdx) => {
                                                if (tag === 'veg') return <span key={tIdx} className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Vegetarian"></span>;
                                                if (tag === 'gf') return <span key={tIdx} className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Gluten-Free"></span>;
                                                return null;
                                            })}
                                            <h3 className="font-medium text-[14px] text-white group-hover:text-[#d4af37] transition-all duration-300 truncate">{item.name}</h3>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 pr-2 font-light">{item.description}</p>
                                    </div>

                                    <div className="flex flex-col items-end justify-center space-y-1.5 flex-shrink-0">
                                        <span className="text-[14px] font-semibold text-[#d4af37] font-['Playfair_Display']">{currency}{item.price}</span>
                                        <div className="w-6 h-6 rounded-full bg-white/[0.04] group-hover:bg-[#d4af37]/10 flex items-center justify-center text-white/30 group-hover:text-[#d4af37] transition-all duration-300">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* Drawer */}
                <div className={`absolute inset-x-0 bottom-0 h-[85%] bg-[#161314]/95 backdrop-blur-xl rounded-t-[32px] border-t border-[#d4af37]/20 transform transition-transform duration-500 ease-out z-50 flex flex-col overflow-hidden ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="w-full flex justify-center py-4 cursor-pointer" onClick={closeDrawer}>
                        <div className="w-12 h-1 bg-[#2d2527] rounded-full"></div>
                    </div>

                    {selectedItem && (
                        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="relative h-[220px] w-full rounded-2xl overflow-hidden shadow-2xl">
                                <img src={selectedItem.img || `https://placehold.co/600/161314/ffffff?text=${selectedItem.name[0]}`} className="w-full h-full object-cover" alt={selectedItem.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <button onClick={closeDrawer} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-all duration-300">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex gap-1.5">
                                        {(selectedItem.tags || []).map((t, i) => {
                                            if (t === 'veg') return <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">Vegetarian</span>;
                                            if (t === 'gf') return <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-semibold text-amber-400 uppercase tracking-wide">Gluten-Free</span>;
                                            return null;
                                        })}
                                    </span>
                                    <div className="flex items-center space-x-1 text-xs text-[#d4af37]">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span className="font-semibold text-white">{selectedItem.rating || "4.9"}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <h2 className="font-['Playfair_Display'] text-2xl font-light text-white">{selectedItem.name}</h2>
                                    <span className="text-xl font-medium text-[#d4af37]">{currency}{selectedItem.price}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs uppercase tracking-widest text-white/50 font-semibold">The Narrative</h3>
                                <p className="text-sm text-white/80 leading-relaxed font-light">{selectedItem.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                    <div className="flex items-center space-x-1.5 text-xs text-[#d4af37]">
                                        <Wine className="w-3.5 h-3.5" />
                                        <span className="font-medium">Pairing</span>
                                    </div>
                                    <p className="text-[11px] text-[#a39e9e] font-light leading-snug">{selectedItem.pairing || "Sommelier Selection"}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                    <div class="flex items-center space-x-1.5 text-xs text-[#d4af37]">
                                        <ChefHat className="w-3.5 h-3.5" />
                                        <span className="font-medium">Preparation</span>
                                    </div>
                                    <p className="text-[11px] text-[#a39e9e] font-light leading-snug">{selectedItem.prep || "House style"}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#161314] border border-white/5">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span className="text-[10px] text-white/60">{selectedItem.calories || "Est. 350 kcal"}</span>
                                </div>
                                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#161314] border border-white/5">
                                    <Clock className="w-3 h-3 text-sky-400" />
                                    <span className="text-[10px] text-white/60">{selectedItem.prepTime || "10-15 mins"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drawer Overlay */}
                <div 
                    onClick={closeDrawer} 
                    className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-500 z-40 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                ></div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default ImmersiveTemplate;
