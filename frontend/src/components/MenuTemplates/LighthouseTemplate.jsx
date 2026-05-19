import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChefHat, Cake, GlassWater, LayoutGrid, Inbox } from 'lucide-react';

const LighthouseTemplate = ({ restaurantName, currency, categories }) => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [filters, setFilters] = useState({ veg: false, gf: false });
    const scrollContainerRef = useRef(null);
    const topHeaderRef = useRef(null);



    const getIcon = (idx) => {
        const icons = [<Sparkles className="w-3.5 h-3.5" />, <ChefHat className="w-3.5 h-3.5" />, <Cake className="w-3.5 h-3.5" />, <GlassWater className="w-3.5 h-3.5" />];
        return icons[idx % icons.length];
    };

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current && topHeaderRef.current) {
                const scrollPos = scrollContainerRef.current.scrollTop;
                if (scrollPos < 200) {
                    topHeaderRef.current.style.opacity = Math.max(0, 1 - (scrollPos / 200)).toFixed(2);
                } else {
                    topHeaderRef.current.style.opacity = "0";
                }
            }
        };

        const currentRef = scrollContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (currentRef) currentRef.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleCategorySelect = (key) => {
        if (scrollContainerRef.current) {
            const targetTop = key === "all" ? 0 : 120;
            scrollContainerRef.current.scrollTo({ top: targetTop, behavior: 'auto' });
        }
        setActiveCategory(key);
    };

    let hasMatchesOverall = false;

    return (
        <div className="font-['Plus_Jakarta_Sans'] bg-[#EFECE6] text-[#2C2B29] min-h-screen flex items-center justify-center p-0 sm:p-6 md:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FAF6EF] via-[#EFECE6] to-[#E3DCD2] relative overflow-x-hidden antialiased">
            
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                
                @keyframes pulse-gold {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.08); }
                }
                .pulse-dot-gold { animation: pulse-gold 2.5s infinite; }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .glass-panel-light {
                    background: rgba(250, 248, 245, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
            `}} />

            {/* Ambient Botanical Accents */}
            <div className="absolute -top-16 -left-16 w-64 h-64 opacity-20 pointer-events-none select-none z-0 hidden lg:block">
                <svg viewBox="0 0 100 100" fill="none" stroke="#4E6570" strokeWidth="1.5">
                    <path d="M10,90 Q30,60 50,50 T90,10 M50,50 Q40,30 30,20 M50,50 Q65,40 80,35 M30,68 Q20,50 15,40" strokeLinecap="round"/>
                </svg>
            </div>
            <div className="absolute -bottom-16 -right-16 w-72 h-72 opacity-25 pointer-events-none select-none z-0 hidden lg:block">
                <svg viewBox="0 0 100 100" fill="none" stroke="#C5A880" strokeWidth="1.5">
                    <path d="M90,90 Q70,60 50,50 T10,10 M50,50 Q40,30 20,25 M50,50 Q60,70 75,80" strokeLinecap="round"/>
                </svg>
            </div>

            <div className="w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[48px] overflow-hidden flex flex-col glass-panel-light shadow-[0_24px_70px_rgba(139,119,91,0.2)] border-0 sm:border-[8px] border-[#E5DEC3] relative z-10">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-50"></div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative flex flex-col pb-16 bg-[#FAF8F5]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    
                    <div ref={topHeaderRef} className="relative pt-12 pb-6 px-6 text-center border-b border-[#EDE8DF] transition-opacity duration-75">
                        
                        <h1 className="font-['Cinzel'] text-3xl font-light text-[#2C2B29] tracking-[0.12em] leading-none mb-1 uppercase">{restaurantName || "Lighthouse"}</h1>
                        <p className="font-['Playfair_Display'] italic text-lg text-[#4E6570] font-light tracking-wide">Menu</p>
                        
                        <div className="mt-4 flex items-center justify-center space-x-2.5 bg-[#F6F2EB] py-1 px-3.5 rounded-full inline-flex border border-[#EAE3D8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 pulse-dot-gold"></span>
                            <span className="text-[10px] font-medium tracking-wide text-[#5C5A55]">Serving Brunch & Mains</span>
                        </div>
                    </div>

                    <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EDE8DF] py-3.5 space-y-3.5 shadow-sm">
                        <div className="flex overflow-x-auto px-6 space-x-2.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <button 
                                onClick={() => handleCategorySelect("all")}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${activeCategory === "all" ? "bg-[#C5A880] text-white font-semibold shadow-md shadow-[#C5A880]/20" : "bg-[#F3EFE9] text-[#5E5B54] hover:text-[#2C2B29] border border-[#EDE8DF]"}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>All Menu</span>
                            </button>
                            
                            {categories.map((cat, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleCategorySelect(idx.toString())}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${activeCategory === idx.toString() ? "bg-[#C5A880] text-white font-semibold shadow-md shadow-[#C5A880]/20" : "bg-[#F3EFE9] text-[#5E5B54] hover:text-[#2C2B29] border border-[#EDE8DF]"}`}
                                >
                                    {getIcon(idx)}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-6 flex-1 space-y-10">
                        {categories.map((cat, idx) => {
                            if (activeCategory !== "all" && activeCategory !== idx.toString()) return null;

                            const filteredItems = cat.items.filter(item => {
                                const tags = item.tags || [];
                                if (filters.veg && !tags.includes("veg")) return false;
                                if (filters.gf && !tags.includes("gf")) return false;
                                return true;
                            });

                            if (filteredItems.length === 0) return null;
                            hasMatchesOverall = true;

                            return (
                                <div key={idx} id={`section-header-${idx.toString()}`} className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-center space-x-3 py-2">
                                        <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#EDE8DF]"></span>
                                        <span className="text-[12px] uppercase tracking-[0.25em] text-[#C5A880] font-['Cinzel'] font-semibold">✧ {cat.name} ✧</span>
                                        <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#EDE8DF]"></span>
                                    </div>
                                    <div className="space-y-4">
                                        {filteredItems.map((item, iIdx) => (
                                            <div 
                                                key={iIdx} 
                                                className="group bg-[#FAF8F5] border border-[#EDE8DF] p-4 rounded-2xl flex flex-col sm:flex-row gap-4 hover:border-[#C5A880]/40 hover:bg-[#FDFCFB] transition-all duration-300 shadow-[0_4px_16px_rgba(139,119,91,0.03)]"
                                                style={{ animation: `fadeInUp 0.4s ease-out ${iIdx * 0.05}s both` }}
                                            >
                                                {item.img && (
                                                    <div className="relative w-full sm:w-24 h-44 sm:h-24 rounded-xl overflow-hidden bg-[#F3EFE9] flex-shrink-0 border border-[#EDE8DF]">
                                                        <img 
                                                            src={item.img} 
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                                            alt={item.name} 
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                                            <div className="flex items-center space-x-2 truncate">
                                                                {(item.tags || []).map((t, tIdx) => {
                                                                    if (t === 'veg') return <span key={tIdx} className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white shadow-sm inline-block" title="Vegetarian"></span>;
                                                                    if (t === 'gf') return <span key={tIdx} className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-sm inline-block" title="Gluten-Free"></span>;
                                                                    return null;
                                                                })}
                                                                <h3 className="text-base font-bold text-[#2C2B29] group-hover:text-[#B29162] transition-all duration-300 truncate">{item.name}</h3>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-[#615E58] leading-relaxed font-normal">{item.description}</p>
                                                    </div>

                                                    <div className="flex items-center justify-end pt-2 border-t border-[#EDE8DF]/60 mt-auto">
                                                        <span className="text-lg font-extrabold text-[#E6C697] bg-[#1E1B18] px-5 py-1.5 rounded-xl border border-[#3A3530] shadow-md tracking-wider font-['Cinzel'] flex-shrink-0">
                                                            {currency}{item.price}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {!hasMatchesOverall && categories.length > 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <div className="p-4 rounded-full bg-[#F3EFE9] border border-[#EDE8DF] text-[#C5A880]/70">
                                    <Inbox className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-semibold text-[#2C2B29]">No Menu Items Match</p>
                                <p className="text-xs text-[#8E8A81] max-w-[220px]">Adjust your dietary toggle and try again.</p>
                            </div>
                        )}
                        {categories.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <p className="text-sm font-semibold text-[#2C2B29]">Menu Items Coming Soon.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LighthouseTemplate;
