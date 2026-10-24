import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChefHat, Cake, Wine, Sparkles, X, Search, Compass } from 'lucide-react';

const ImmersiveTemplate = ({ restaurantName, currency, categories = [] }) => {
    // Determine initial category
    const initialCat = categories && categories.length > 0 ? categories[0].name : '';
    const [currentCategoryName, setCurrentCategoryName] = useState(initialCat);
    const [filters, setFilters] = useState({ veg: false, gf: false, search: '' });
    const [isSearchActive, setIsSearchActive] = useState(false);
    const scrollContainerRef = useRef(null);
    const heroBgRef = useRef(null);
    const searchInputRef = useRef(null);

    // Keep active category in sync if categories change dynamically
    useEffect(() => {
        if (categories && categories.length > 0) {
            const exists = categories.some(c => c.name === currentCategoryName);
            if (!exists) {
                setCurrentCategoryName(categories[0].name);
            }
        }
    }, [categories, currentCategoryName]);

    // High quality fallback atmospheric backgrounds
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

    const getCategoryIcon = (index) => {
        const icons = [
            <Sparkles key="sparkles" className="w-3.5 h-3.5" />,
            <ChefHat key="chef" className="w-3.5 h-3.5" />,
            <Cake key="cake" className="w-3.5 h-3.5" />,
            <Wine key="wine" className="w-3.5 h-3.5" />
        ];
        return icons[index % icons.length];
    };

    const getBgImage = (index) => fallbackBgs[Math.abs(index) % fallbackBgs.length];

    // Find active category index safely
    const activeCategoryIndex = Math.max(0, categories.findIndex(c => c.name === currentCategoryName));
    const activeCategory = categories[activeCategoryIndex] || categories[0];

    // Filter items with multi-category search support
    const filteredItems = useMemo(() => {
        const query = (filters.search || '').trim().toLowerCase();

        // If searching, search across all categories for instant discovery
        let sourceItems = [];
        if (query) {
            categories.forEach(cat => {
                (cat.items || []).forEach(item => {
                    sourceItems.push(item);
                });
            });
        } else {
            sourceItems = activeCategory?.items || [];
        }

        return sourceItems.filter(item => {
            const tags = item.tags || [];
            if (filters.veg && !tags.includes('veg')) return false;
            if (filters.gf && !tags.includes('gf')) return false;

            if (query) {
                const matchName = (item.name || '').toLowerCase().includes(query);
                const matchDesc = (item.description || '').toLowerCase().includes(query);
                if (!matchName && !matchDesc) return false;
            }

            return true;
        });
    }, [categories, activeCategory, filters]);

    return (
        <div className="font-['Plus_Jakarta_Sans',sans-serif] bg-[#0b090a] text-[#f5f3f4] min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1516] via-[#0d0a0b] to-[#070506]">
            
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />

            <div className="w-full max-w-[440px] h-[100dvh] sm:h-[880px] sm:rounded-[48px] overflow-hidden flex flex-col bg-[#161314]/80 backdrop-blur-md shadow-[0_0_80px_rgba(212,175,55,0.06)] border-0 sm:border-[6px] border-[#221b1c] relative">
                
                {/* Screen Reflection Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-50"></div>

                {/* Main Scrollable View */}
                <div 
                    ref={scrollContainerRef} 
                    className="flex-1 overflow-y-auto relative flex flex-col pb-28 sm:pb-32" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    
                    {/* Header / Hero Cover */}
                    <div className="relative h-[220px] sm:h-[250px] w-full flex flex-col justify-end px-6 pb-6 overflow-hidden shrink-0">
                        <div className="absolute inset-0">
                            <img 
                                ref={heroBgRef}
                                src={getBgImage(activeCategoryIndex)} 
                                className="w-full h-full object-cover brightness-[0.4] scale-105 transition-all duration-700" 
                                alt="Category background" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a0b] via-[#0d0a0b]/60 to-transparent"></div>
                        </div>

                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="h-[1px] w-6 bg-[#d4af37]"></span>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">Fine Experience</p>
                            </div>
                            <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-light text-white leading-tight tracking-wide">
                                {restaurantName || "Our Menu"}
                            </h1>
                            <p className="text-xs text-[#a39e9e] font-light max-w-[90%] line-clamp-2">
                                Curated artisanal ingredients prepared for an exquisite dining experience.
                            </p>
                        </div>

                        <div className="absolute top-5 left-6 z-10 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></span>
                            <span className="text-[10px] font-medium tracking-wide text-white/90">Serving Now</span>
                        </div>
                    </div>

                    {/* Sticky Category Tabs & Filter Toolbar */}
                    <div className="sticky top-0 z-30 bg-[#0d0a0b]/95 backdrop-blur-md border-y border-[#221b1c] py-3 space-y-2.5 shadow-md">
                        
                        {/* Horizontal Category Switcher */}
                        {categories && categories.length > 0 && (
                            <div className="flex overflow-x-auto px-5 space-x-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {categories.map((cat, idx) => {
                                    const isActive = currentCategoryName === cat.name;
                                    return (
                                        <button 
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setCurrentCategoryName(cat.name);
                                                setFilters(prev => ({ ...prev, search: '' }));
                                                setIsSearchActive(false);
                                                if (scrollContainerRef.current) {
                                                    scrollContainerRef.current.scrollTo({ top: 180, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                                isActive 
                                                    ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/25 scale-[1.02]' 
                                                    : 'bg-[#161314] text-white/70 hover:text-white border border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            {getCategoryIcon(idx)}
                                            <span>{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Search & Dietary Filters Row */}
                        <div className="flex items-center justify-between px-5 gap-2">
                            {isSearchActive ? (
                                <div className="relative flex-1 flex items-center animate-in fade-in duration-200">
                                    <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 pointer-events-none" />
                                    <input 
                                        ref={searchInputRef}
                                        type="text" 
                                        value={filters.search}
                                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                                        placeholder="Search dishes..." 
                                        className="w-full bg-[#161314] text-xs pl-8 pr-8 py-1.5 rounded-full border border-[#d4af37]/50 text-white placeholder-white/40 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setFilters(f => ({ ...f, search: '' }));
                                            setIsSearchActive(false);
                                        }} 
                                        className="p-1 text-white/50 hover:text-white absolute right-2 cursor-pointer"
                                        aria-label="Close search"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex space-x-2">
                                        <button 
                                            type="button"
                                            onClick={() => setFilters(f => ({ ...f, veg: !f.veg }))} 
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium cursor-pointer ${
                                                filters.veg 
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
                                                    : 'bg-transparent border-[#221b1c] text-[#a39e9e] hover:border-white/20'
                                            }`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span>Vegetarian</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setFilters(f => ({ ...f, gf: !f.gf }))} 
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium cursor-pointer ${
                                                filters.gf 
                                                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300' 
                                                    : 'bg-transparent border-[#221b1c] text-[#a39e9e] hover:border-white/20'
                                            }`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                            <span>Gluten-Free</span>
                                        </button>
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={toggleSearch} 
                                        className="p-1.5 sm:p-2 rounded-full text-white/70 hover:text-[#d4af37] hover:bg-white/5 transition-all duration-200 bg-[#161314] border border-white/5 cursor-pointer shrink-0"
                                        aria-label="Search menu"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Dish Items List */}
                    <div className="px-5 py-4 flex-1 space-y-3">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                                <div className="p-3.5 rounded-full bg-white/[0.03] border border-white/5 text-[#d4af37]/60">
                                    <Compass className="w-7 h-7" />
                                </div>
                                <p className="text-sm font-medium text-white/80">No dishes found</p>
                                <p className="text-xs text-white/40 max-w-[220px]">
                                    Try adjusting your search query or removing dietary filters.
                                </p>
                            </div>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#161314]/90 border border-white/[0.06] hover:border-[#d4af37]/30 transition-all duration-300 shadow-sm animate-[fadeInUp_0.35s_ease-out_both]"
                                    style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s` }}
                                >
                                    {/* Dish Thumbnail */}
                                    {item.img && (
                                        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-[#0d0a0b] border border-white/5 shadow-inner">
                                            <img 
                                                src={item.img} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                alt={item.name} 
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                        </div>
                                    )}

                                    {/* Dish Info: Name & Price on Top, Full-width Description Below */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                        <div className="flex items-baseline justify-between gap-2 mb-1">
                                            <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                {(item.tags || []).map((tag, tIdx) => {
                                                    if (tag === 'veg') return <span key={tIdx} className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Vegetarian"></span>;
                                                    if (tag === 'gf') return <span key={tIdx} className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Gluten-Free"></span>;
                                                    return null;
                                                })}
                                                <h3 className="font-semibold text-[14px] sm:text-[15px] text-white tracking-tight truncate group-hover:text-[#d4af37] transition-colors">
                                                    {item.name}
                                                </h3>
                                            </div>
                                            <span className="text-[14px] sm:text-[15px] font-bold text-[#d4af37] font-['Playfair_Display',serif] tabular-nums shrink-0">
                                                {currency}{item.price}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-[11px] sm:text-[12px] text-[#a39e9e] leading-relaxed line-clamp-2 font-light">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ImmersiveTemplate;

