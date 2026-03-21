import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    QrCode, ArrowRight, RefreshCw, BarChart3, Palette, Check, 
    Twitter, Instagram, Linkedin, Star, ShieldCheck, X, Zap, 
    Smartphone, Camera
} from 'lucide-react';

const LandingPage = () => {
    const [themeColor, setThemeColor] = useState('#4F46E5'); // Default indigo-600
    const [cornerStyle, setCornerStyle] = useState('square');
    const [scrolled, setScrolled] = useState(false);
    const [billingCycle, setBillingCycle] = useState('annual');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getPathData = () => {
        if (cornerStyle === 'round') {
            return "M12 10a2 2 0 0 0 -2 2v26a2 2 0 0 0 2 2h26a2 2 0 0 0 2 -2v-26a2 2 0 0 0 -2 -2h-26z m5 5v20h20v-20h-20z M60 10a2 2 0 0 0 -2 2v26a2 2 0 0 0 2 2h26a2 2 0 0 0 2 -2v-26a2 2 0 0 0 -2 -2h-26z m5 5v20h20v-20h-20z M10 60a2 2 0 0 0 -2 2v26a2 2 0 0 0 2 2h26a2 2 0 0 0 2 -2v-26a2 2 0 0 0 -2 -2h-26z m5 5v20h20v-20h-20z M45 10h10v10h-10z M45 25h10v10h-10z M45 45h10v10h-10z M10 45h10v10h-10z M25 45h10v10h-10z M60 45h10v10h-10z M75 45h10v10h-10z M60 60h10v10h-10z M60 75h10v10h-10z M75 60h10v10h-10z M75 75h10v25h-10z M45 60h10v10h-10z M45 75h10v10h-10z M45 90h10v10h-10z";
        }
        return "M10 10h30v30h-30z m5 5v20h20v-20z M60 10h30v30h-30z m5 5v20h20v-20z M10 60h30v30h-30z m5 5v20h20v-20z M45 10h10v10h-10z M45 25h10v10h-10z M45 45h10v10h-10z M10 45h10v10h-10z M25 45h10v10h-10z M60 45h10v10h-10z M75 45h10v10h-10z M60 60h10v10h-10z M60 75h10v10h-10z M75 60h10v10h-10z M75 75h10v25h-10z M45 60h10v10h-10z M45 75h10v10h-10z M45 90h10v10h-10z";
    };

    return (
        <div className="bg-slate-50 text-slate-900 overflow-x-hidden w-full font-sans">
            {/* Navbar (Sticky, adds glass effect on scroll) */}
            <nav className={`fixed w-full z-50 top-0 transition-all duration-300 px-6 py-4 ${scrolled ? 'glass shadow-sm' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                            <QrCode className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">QR<span className="text-indigo-600">Vibe</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
                        <a href="#aha-moment" className="hover:text-indigo-600 transition-colors">Why QRVibe?</a>
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-semibold px-4 py-2 hover:text-indigo-600 transition-colors">Log In</Link>
                        <Link to="/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section (Aesthetic & Interactive) */}
            <section className="pt-36 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-full lg:w-[55%] h-full bg-indigo-50/60 rounded-bl-[120px]"></div>
                
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Copy block - Utilizing Von Restorff Effect for high contrast */}
                    <div className="relative z-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-white border border-slate-200 rounded-full shadow-sm">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">v2.0 is now live</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
                            Boring QR Codes are <br />
                            <span className="gradient-text uppercase">Extinct.</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                            Create stunning, high-converting dynamic QR codes. Change the destination link anytime without reprinting. Track exactly who scans.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/register" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                                Start Free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a href="#designer" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all text-center">
                                Try Designer
                            </a>
                        </div>
                    </div>

                    {/* Interactive Designer Demo (Endowment Effect - letting them play first) */}
                    <div id="designer" className="relative w-full max-w-lg mx-auto lg:ml-auto group">
                        <div className="glass p-6 sm:p-8 rounded-[32px] shadow-2xl relative z-10 border border-indigo-100 transform transition-transform duration-500 hover:scale-[1.02]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500"/> Quick Designer</h3>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 cursor-pointer"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 cursor-pointer"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-500 cursor-pointer"></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-6 rounded-3xl shadow-inner transition-all duration-500 floating">
                                        <svg width="150" height="150" viewBox="0 0 100 100">
                                            <path d={getPathData()} fill={themeColor} className="transition-all duration-300" />
                                            <circle cx="50" cy="50" r="10" fill="white" stroke={themeColor} strokeWidth="2" className="transition-all duration-300" />
                                            <path d="M48 48h4v4h-4z" fill={themeColor} className="transition-all duration-300" />
                                        </svg>
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-100 px-2 py-1 rounded">LIVE_PREVIEW</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Color Theme</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['#4F46E5', '#ef4444', '#10b981', '#f59e0b', '#0f172a'].map((color) => (
                                                <button 
                                                    key={color} 
                                                    onClick={() => setThemeColor(color)} 
                                                    style={{ backgroundColor: color }}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all ${themeColor === color ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-110 shadow-sm'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Corner Style</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setCornerStyle('square')} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${cornerStyle === 'square' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Sharp</button>
                                            <button onClick={() => setCornerStyle('round')} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${cornerStyle === 'round' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Round</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl -z-10 animate-pulse"></div>
                        <div className="absolute top-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>
                    </div>
                </div>
            </section>

            {/* Social Proof Bar (Bandwagon Effect) */}
            <div className="bg-slate-900 py-6 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
                    <div className="flex -space-x-3">
                        <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=1" alt="user" />
                        <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=2" alt="user" />
                        <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=3" alt="user" />
                        <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=4" alt="user" />
                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">+5k</div>
                    </div>
                    <p className="text-white/80 font-medium tracking-wide text-sm sm:text-base">
                        Join <span className="text-white font-bold">5,000+</span> creators & businesses tracking millions of QR campaigns globally.
                    </p>
                </div>
            </div>

            {/* Aha Moment (Loss Aversion & Problem/Solution) */}
            <section id="aha-moment" className="py-24 px-6 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Stop wasting money on reprints.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">Static QR codes are dead. It's time to upgrade to dynamic links.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                        {/* The Old Way */}
                        <div className="p-10 bg-red-50 border border-red-100 rounded-[32px] flex flex-col text-left">
                            <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <X className="w-7 h-7 stroke-[3]" />
                            </div>
                            <h3 className="text-red-500 font-extrabold text-2xl mb-4 tracking-tight">The Old Way</h3>
                            <p className="text-slate-700 text-lg leading-relaxed font-medium mt-auto">
                                You print 1,000 product flyers. A week later, your promotion changes or the link breaks. The QR code is dead. You reprint everything — <span className="font-extrabold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shadow-sm">₹12,000 gone.</span>
                            </p>
                        </div>

                        {/* The QRVibe Way */}
                        <div className="p-10 bg-slate-900 rounded-[32px] text-white shadow-2xl transform md:-translate-y-4 hover:-translate-y-6 transition-transform duration-300 flex flex-col relative overflow-hidden text-left border border-slate-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
                            <div className="w-14 h-14 bg-indigo-500 text-white shadow-lg rounded-2xl flex items-center justify-center mb-6">
                                <Check className="w-7 h-7 stroke-[3]" />
                            </div>
                            <h3 className="text-white font-extrabold text-2xl mb-4 tracking-tight">The QRVibe Way</h3>
                            <p className="text-slate-300 text-lg leading-relaxed font-medium mt-auto">
                                Update the destination URL instantly from your dashboard. <span className="text-emerald-400 font-bold">Zero reprints. </span> 
                                Plus, see exactly <span className="bg-indigo-600/50 text-white px-1.5 py-0.5 rounded font-bold">how many people scanned</span>, from where, and on what device.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section (Cognitive Ease - Rule of three, clear icons) */}
            <section id="features" className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Features you'll actually use.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <RefreshCw className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900">Edit Anytime</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Swap links on the fly without ever reprinting menus, flyers, or marketing materials.</p>
                        </div>

                        <div className="bg-white p-10 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <BarChart3 className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900">Deep Analytics</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Get rich demographic data, device types, and exact location tracking instantly.</p>
                        </div>

                        <div className="bg-white p-10 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <Palette className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-slate-900">Brand Studio</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Add logos, pick custom colors, and choose unique patterns to build ultimate trust.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section text block */}
            <section className="py-24 px-6 bg-white overflow-hidden relative border-y border-slate-100">
                <div className="max-w-5xl mx-auto bg-slate-900 p-10 md:p-16 rounded-[40px] flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl">
                    <div className="absolute left-0 top-0 w-1/2 h-full bg-indigo-600/20 blur-[100px] pointer-events-none"></div>
                    
                    <div className="bg-white p-6 rounded-3xl shadow-2xl z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-100 flex-shrink-0">
                        <div className="w-48 h-48 bg-slate-50 rounded-2xl flex items-center justify-center relative border border-slate-200 p-4 mx-auto">
                            <svg width="100%" height="100%" viewBox="0 0 100 100">
                                <path d={getPathData()} fill="#0f172a" />
                                <circle cx="50" cy="50" r="10" fill="white" stroke="#0f172a" strokeWidth="2" />
                            </svg>
                        </div>
                        <p className="text-center mt-5 text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-center items-center gap-2">
                            <Camera className="w-4 h-4" /> Point your camera
                        </p>
                    </div>

                    <div className="flex-1 text-center md:text-left z-10 min-w-0">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-widest mb-6 border border-indigo-500/30">
                            <Smartphone className="w-3 h-3" /> Try the magic
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Experience it yourself.</h2>
                        <p className="text-slate-400 text-lg mb-8 font-medium">Scan this code with your phone. See how quickly it redirects, and imagine the analytics it registers in the backend.</p>
                        <div className="flex justify-center md:justify-start">
                            <Link to="/register" className="font-bold text-white flex items-center gap-2 hover:text-indigo-300 transition-colors bg-white/10 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/20 whitespace-nowrap">
                                Create your own <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing (Anchoring & Decoy Effect) */}
            <section id="pricing" className="py-24 px-6 bg-slate-50 border-b border-slate-200 relative overflow-hidden text-center">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Simple pricing, huge ROI.</h2>
                        <div className="inline-flex flex-wrap justify-center items-center gap-1 bg-slate-200/60 p-1.5 rounded-full border border-slate-200 transition-all text-center mx-auto">
                            <button 
                                onClick={() => setBillingCycle('annual')}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Annually <span className="text-emerald-500 ml-1">(-20%)</span>
                            </button>
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-center lg:px-8 max-w-5xl mx-auto">
                        {/* Starter / Free (Decoy context) */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-slate-300 transition-all text-left">
                            <h4 className="font-bold text-xl mb-2 text-slate-900">Starter</h4>
                            <div className="text-5xl font-extrabold mb-6 text-slate-900">₹0 <span className="text-sm font-medium text-slate-500">/mo</span></div>
                            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">Perfect for trying out dynamic codes.</p>
                            <ul className="space-y-4 mb-10 text-slate-600 text-sm font-medium">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>3 Dynamic QR Codes</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>Basic scan volume</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>Standard PNG output</span></li>
                            </ul>
                            <Link to="/register" className="block text-center w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all">Start Free</Link>
                        </div>

                        {/* Pro (Highlighted Target) */}
                        <div className="bg-indigo-600 text-white p-12 rounded-[40px] shadow-2xl shadow-indigo-200 md:scale-105 relative border border-indigo-500 text-left z-10 transform transition-transform md:hover:-translate-y-1">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">Most Popular</div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-3xl text-indigo-50">Pro Vibe</h4>
                            </div>
                            <div className="text-6xl font-black mb-2 flex flex-wrap items-end">
                                {billingCycle === 'annual' ? '₹699' : '₹899'} 
                                <span className="text-lg font-bold text-indigo-300 mb-2 ml-1">/mo</span>
                            </div>
                            <p className="text-sm text-indigo-200 mb-8 pb-8 border-b border-indigo-500/50">
                                {billingCycle === 'annual' ? 'Billed annually at ₹8,388' : 'Billed monthly'}
                            </p>
                            <ul className="space-y-4 mb-10 font-bold text-sm text-indigo-50">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Unlimited QR Codes</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Full analytics & heatmaps</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Brand design studio & Logos</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>SVG Vector exports</span></li>
                            </ul>
                            <Link to="/register" className="block text-center w-full py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all text-lg tracking-wide">Start 14-Day Free Trial</Link>
                        </div>

                        {/* Business */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-slate-300 transition-all text-left">
                            <h4 className="font-bold text-xl mb-2 text-slate-900">Agency</h4>
                            <div className="text-5xl font-extrabold mb-6 text-slate-900">₹1999 <span className="text-sm font-medium text-slate-500">/mo</span></div>
                            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">For managing multiple clients.</p>
                            <ul className="space-y-4 mb-10 text-slate-600 text-sm font-medium">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Everything in Pro</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Multiple team seats</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Bulk generation API</span></li>
                            </ul>
                            <button className="w-full py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-900 rounded-2xl font-bold transition-all bg-white">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials (Authority / Trust) */}
            <section className="py-24 px-6 bg-white overflow-hidden text-center flex flex-col items-center">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="text-amber-400 flex justify-center gap-1.5 mb-8">
                        <Star className="w-7 h-7 fill-current drop-shadow-sm" />
                        <Star className="w-7 h-7 fill-current drop-shadow-sm" />
                        <Star className="w-7 h-7 fill-current drop-shadow-sm" />
                        <Star className="w-7 h-7 fill-current drop-shadow-sm" />
                        <Star className="w-7 h-7 fill-current drop-shadow-sm" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-12 text-slate-900 leading-[1.2] tracking-tight text-balance">
                        "We saved ₹40,000 in reprint costs in just 3 months. The analytics showed us exactly which locations were driving traffic. Absolute game-changer."
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <img src="https://i.pravatar.cc/100?u=novel" alt="Founder" className="w-16 h-16 rounded-full border-4 border-slate-100 shadow-md" />
                        <div className="text-center sm:text-left">
                            <p className="font-bold text-slate-900 text-lg">Priya Sharma</p>
                            <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider">Marketing Director, BrandElevate</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA (Urgency & Low Friction) */}
            <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden flex justify-center items-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 rounded-2xl pointer-events-none"></div>
                
                <div className="max-w-3xl mx-auto text-center relative z-10 w-full flex flex-col items-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-tight">
                        Ready to level up your<br className="hidden sm:block"/>physical marketing?
                    </h2>
                    <Link to="/register" className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xl md:hover:scale-105 transition-all shadow-2xl shadow-indigo-500/20 hover:-translate-y-1 mb-8 inline-flex items-center justify-center gap-2 max-w-full">
                        Get Started for Free <ArrowRight className="w-6 h-6 shrink-0" />
                    </Link>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm font-bold text-slate-400 text-center w-full">
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><ShieldCheck className="w-4 h-4 text-emerald-400" /> No credit card required</span>
                        <span className="hidden sm:inline opacity-30 shrink-0">•</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Zap className="w-4 h-4 text-amber-400" /> Cancel anytime</span>
                    </div>
                </div>
            </section>

            {/* Premium Footer */}
            <footer className="bg-white pt-24 pb-12 px-6 border-t border-slate-100 text-left">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 text-center md:text-left">
                    <div className="md:col-span-4 lg:col-span-5 pr-0 md:pr-12 flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-indigo-600 p-2 rounded-xl shadow-sm">
                                <QrCode className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">QR<span className="text-indigo-600">Vibe</span></span>
                        </div>
                        <p className="text-slate-500 leading-relaxed mb-8 font-medium max-w-sm">Empowering leading brands to bridge the physical and digital worlds through beautiful, intelligent, and highly measurable QR experiences.</p>
                        <div className="flex gap-3 justify-center md:justify-start w-full">
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"><Twitter className="w-4 h-4" /></a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"><Instagram className="w-4 h-4" /></a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] transition-all"><Linkedin className="w-4 h-4" /></a>
                        </div>
                    </div>

                    <div className="md:col-span-2 md:col-start-7 text-center md:text-left">
                        <h5 className="font-extrabold mb-6 text-slate-900 tracking-wide text-sm uppercase">Product</h5>
                        <ul className="space-y-4 text-slate-500 font-medium">
                            <li><Link to="/register" className="hover:text-indigo-600 transition-colors">QR Generator</Link></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Analytics Flow</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing Plans</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Designer API</a></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 text-center md:text-left mt-8 md:mt-0">
                        <h5 className="font-extrabold mb-6 text-slate-900 tracking-wide text-sm uppercase">Resources</h5>
                        <ul className="space-y-4 text-slate-500 font-medium">
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Case Studies</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 text-center md:text-left mt-8 md:mt-0">
                        <h5 className="font-extrabold mb-6 text-slate-900 tracking-wide text-sm uppercase">Legal</h5>
                        <ul className="space-y-4 text-slate-500 font-medium">
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Use</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-slate-400 text-sm font-bold tracking-wide">
                        &copy; 2026 QRVibe. Designed for conversion.
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold justify-center md:justify-end">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
