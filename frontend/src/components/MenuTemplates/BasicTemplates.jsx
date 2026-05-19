import React from 'react';
import { Utensils } from 'lucide-react';

export const ModernTemplate = ({ restaurantName, currency, categories }) => (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 py-6 px-4 bg-white/80 backdrop-blur-md text-center border-b border-slate-100 shadow-sm w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-800 uppercase break-words px-2">{restaurantName}</h1>
        </header>

        {/* Main Content Container */}
        <main className="w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-8 sm:py-12">
            {categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-400 font-medium">Menu items coming soon.</p>
                </div>
            ) : (
                categories.map((cat, idx) => (
                    <div key={idx} className="mb-10 sm:mb-12 w-full">
                        {/* Category Title */}
                        <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 mb-5 sm:mb-6 pb-2 border-b border-slate-200 flex items-center gap-2 break-words">
                            <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
                            <span className="break-words min-w-0">{cat.name}</span>
                        </h2>

                        {/* Responsive Items Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
                            {cat.items.map((item, iIdx) => (
                                <div 
                                    key={iIdx} 
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100/80 transition-all duration-300 flex flex-col justify-between w-full h-full overflow-hidden"
                                >
                                    {item.img && (
                                        <div className="w-full h-32 sm:h-40 relative">
                                            <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                    )}
                                    <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-3 sm:gap-4 mb-2 w-full">
                                            <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-tight flex-1 min-w-0 break-words pr-2">{item.name}</h3>
                                            <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl text-xs sm:text-sm whitespace-nowrap flex-shrink-0 mt-0.5">
                                                {currency}{item.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-light leading-relaxed mt-2 w-full break-words">
                                            {item.description || 'No description available.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </main>
        
        {/* Footer */}
        <footer className="text-center py-8 opacity-40 text-xs font-sans tracking-widest text-slate-500 uppercase w-full">
            Powered by QRVibe
        </footer>
    </div>
);

export const PlayfulTemplate = ({ restaurantName, currency, categories }) => (
    <div className="bg-rose-50/60 min-h-screen text-slate-800 font-sans antialiased overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 py-6 sm:py-8 px-4 bg-white text-center rounded-b-[2rem] sm:rounded-b-[3rem] shadow-sm mb-6 sm:mb-10 border-b border-rose-100/50 w-full mx-auto max-w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-rose-500 tracking-tight break-words px-2">{restaurantName}</h1>
        </header>

        {/* Main Content Container */}
        <main className="w-full max-w-md sm:max-w-2xl md:max-w-3xl mx-auto px-4 py-4">
            {categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-400 font-medium">Menu items coming soon.</p>
                </div>
            ) : (
                categories.map((cat, idx) => (
                    <div key={idx} className="mb-8 sm:mb-12 text-center sm:text-left w-full">
                        {/* Category Title Pill */}
                        <div className="mb-5 sm:mb-8 flex justify-center sm:justify-start">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-rose-600 bg-rose-100/70 inline-block px-6 py-2.5 rounded-full shadow-sm break-words max-w-full">
                                {cat.name}
                            </h2>
                        </div>

                        {/* Responsive Items Container */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
                            {cat.items.map((item, iIdx) => (
                                <div 
                                    key={iIdx} 
                                    className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm hover:shadow-md border-2 border-rose-100/60 transition-all duration-300 relative overflow-hidden text-left w-full h-full flex flex-col"
                                >
                                    {item.img && (
                                        <div className="w-full h-40 sm:h-48 relative border-b-2 border-rose-50/50">
                                            <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                    )}
                                    <div className="p-5 sm:p-6 md:p-8 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start gap-3 sm:gap-4 mb-3 w-full">
                                            <h3 className="font-extrabold text-slate-800 text-lg sm:text-xl leading-tight flex-1 min-w-0 break-words pr-2">{item.name}</h3>
                                            <span className="font-black text-lg sm:text-xl text-rose-500 whitespace-nowrap flex-shrink-0">
                                                {currency}{item.price}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed w-full break-words mt-auto">
                                            {item.description || 'Tasty preparation prepared fresh.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </main>
        
        {/* Footer */}
        <footer className="text-center py-8 opacity-40 text-xs font-bold tracking-widest text-rose-500 uppercase w-full">
            Powered by QRVibe
        </footer>
    </div>
);
