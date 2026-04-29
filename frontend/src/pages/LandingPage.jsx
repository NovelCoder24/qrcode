import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    QrCode, ArrowRight, RefreshCw, BarChart3, Palette, Check, 
    Twitter, Instagram, Linkedin, Star, ShieldCheck, X, Zap, 
    Smartphone, Camera, Utensils, Building, Package, FileText,
    HeadphonesIcon, Calculator, Lock, MessageCircle, MapPin, 
    IndianRupee, Activity
} from 'lucide-react';
import founderImg from '../assets/founder.jpg';

const LandingPage = () => {
    const [themeColor, setThemeColor] = useState('#4F46E5'); // Default indigo-600
    const [cornerStyle, setCornerStyle] = useState('square');
    const [scrolled, setScrolled] = useState(false);
    const [billingCycle, setBillingCycle] = useState('annual');
    const [printingCost, setPrintingCost] = useState(15000);
    const [updatesPerMonth, setUpdatesPerMonth] = useState(4);
    const [openFaq, setOpenFaq] = useState(null);


    const annualSavings = Math.max(0, (printingCost * updatesPerMonth * 12) - (billingCycle === 'annual' ? 8388 : 10788));
    const formatINR = (num) => num.toLocaleString('en-IN');

    const faqs = [
        { q: 'Can I try before I pay?', a: 'Absolutely! Every plan includes a 14-day free trial. No credit card required. Cancel anytime during the trial.' },
        { q: 'Is GST included in the pricing?', a: 'All prices shown are exclusive of GST. 18% GST will be added at checkout as per Indian tax regulations. You will receive a proper GST invoice.' },
        { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you only pay the prorated difference. Downgrades take effect at the next billing cycle.' },
        { q: 'What payment methods do you accept?', a: 'We accept UPI, all major credit/debit cards, net banking, and wallets via Razorpay. For annual Enterprise plans, we also support bank transfers and purchase orders.' },
        { q: 'Do you offer discounts for NGOs or startups?', a: 'Yes! We offer special pricing for registered NGOs, educational institutions, and DPIIT-recognized startups. Contact our sales team for details.' },
    ];



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
                        <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-extrabold leading-[1.1] mb-6 tracking-tight text-slate-900">
                            Your printed QR should <br />
                            <span className="gradient-text">never go dead.</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                            Stop wasting money on static prints. Track, analyze, and update your offline marketing instantly. Join 6,000+ Indian businesses driving measurable ROI.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/register" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-3xl font-bold text-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2">
                                Start Free <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>

                    {/* The Right Side Image/Card Component (From User Image) */}
                    <div id="designer" className="relative w-full max-w-lg mx-auto lg:ml-auto mt-12 lg:mt-0">
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-slate-100 relative z-10">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                    <RefreshCw className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
                                    <span>Dynamic Magic</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                </div>
                            </div>

                            {/* Digital Destination Block */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                <div className="p-4 sm:p-5 pt-6">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <Smartphone className="w-3.5 h-3.5" /> DIGITAL DESTINATION
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm flex items-center overflow-hidden">
                                        <span className="text-slate-400 mr-1">https://qrvibe.in/</span>
                                        <span className="text-indigo-600 font-bold relative">
                                            menu-v2-summer.pdf
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Connecting Line */}
                            <div className="h-12 flex justify-center items-center relative">
                                <div className="h-full w-px border-l-2 border-dashed border-indigo-200 relative flex justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-1/2 -translate-y-1/2"></div>
                                </div>
                            </div>

                            {/* Printed Flyer Block */}
                            <div className="bg-[#0f172a] rounded-xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-xl">
                                <div className="bg-white p-2.5 sm:p-3 rounded-xl shrink-0">
                                    <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        <MapPin className="w-3 h-3" /> PRINTED FLYER
                                    </div>
                                    <div className="text-white font-bold text-base sm:text-lg mb-1.5">
                                        Table Tent Card
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        Never needs reprinting
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof & Trust Badges (Add Indian Context) */}
            <div className="bg-slate-900 py-6 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-white/80 font-medium tracking-wide text-sm sm:text-base text-center mb-6">
                        Trusted by <span className="text-white font-bold">6,000+ Indian SMBs</span> across 15+ industries
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-center text-slate-400 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <span>Made in India</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-400" />
                            <span>Secure HTTPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IndianRupee className="w-5 h-5 text-blue-400" />
                            <span>UPI Payments</span>
                        </div>
                    </div>
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
                            <ul className="text-slate-700 text-lg leading-relaxed font-medium mt-auto space-y-3">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1 text-xl leading-none">•</span>
                                    <span>Print 1,000 product flyers with a static link.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1 text-xl leading-none">•</span>
                                    <span>Promotion changes or the link breaks.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1 text-xl leading-none">•</span>
                                    <span>The QR code is dead. Reprint everything.</span>
                                </li>
                                <li className="mt-4 pt-2 border-t border-red-200/50">
                                    <span className="font-extrabold text-red-700 bg-red-100 px-2.5 py-1 rounded shadow-sm inline-block">Result: ₹12,000 wasted.</span>
                                </li>
                            </ul>
                        </div>

                        {/* The QRVibe Way */}
                        <div className="p-10 bg-slate-900 rounded-[32px] text-white shadow-2xl transform md:-translate-y-4 hover:-translate-y-6 transition-transform duration-300 flex flex-col relative overflow-hidden text-left border border-slate-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
                            <div className="w-14 h-14 bg-indigo-500 text-white shadow-lg rounded-2xl flex items-center justify-center mb-6">
                                <Check className="w-7 h-7 stroke-[3]" />
                            </div>
                            <h3 className="text-white font-extrabold text-2xl mb-4 tracking-tight">The QRVibe Way</h3>
                            <ul className="text-slate-300 text-lg leading-relaxed font-medium mt-auto space-y-3">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-1 text-xl leading-none">•</span>
                                    <span>Update destination URL instantly from dashboard.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-1 text-xl leading-none">•</span>
                                    <span><span className="text-emerald-400 font-bold">Zero reprints</span> needed, ever.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-1 text-xl leading-none">•</span>
                                    <span>Track <span className="bg-indigo-600/50 text-white px-1.5 py-0.5 rounded font-bold">scans, location, and device</span> analytics.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section (Cognitive Ease - Rule of three, clear icons) */}
            <section id="features" className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Built for your industry.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">See how top sectors use QRVibe to connect physical prints with digital experiences.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group bg-white p-8 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Utensils className="w-7 h-7 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Restaurant Chains</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Update your digital menu across all tables/outlets instantly without reprinting flyers.</p>
                        </div>

                        <div className="group bg-white p-8 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Building className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Real Estate</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Property brochures that track visits. Know which hoarding locations drive buyer interest.</p>
                        </div>

                        <div className="group bg-white p-8 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-pink-50 border border-pink-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Package className="w-7 h-7 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Retail & FMCG</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Connect packaging to customer data. Track authenticity checks & warranty registrations.</p>
                        </div>

                        <div className="group bg-white p-8 rounded-[32px] border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Manufacturing</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">Smart invoices & catalogues. Digital product manuals, instant reorders, and payment links.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section text block */}
            <section className="py-24 px-6 bg-white overflow-hidden relative border-y border-slate-100">
                <div className="max-w-5xl mx-auto bg-slate-900 p-10 md:p-16 rounded-[40px] flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-2xl">
                    <div className="absolute left-0 top-0 w-1/2 h-full bg-indigo-600/20 blur-[100px] pointer-events-none"></div>
                    
                    {/* Desktop View: Show QR Code to scan */}
                    <div className="hidden md:block bg-white p-6 rounded-3xl shadow-2xl z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-100 flex-shrink-0">
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

                    {/* Mobile View: Tap to experience button */}
                    <div className="md:hidden bg-white p-6 rounded-3xl shadow-2xl z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-slate-100 flex-shrink-0 w-full flex flex-col items-center justify-center">
                         <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                             <Zap className="w-10 h-10 animate-pulse" />
                         </div>
                         <button onClick={() => alert("Magic simulated! Imagine being instantly redirected to a digital menu while the business owner tracks your scan in real-time.")} className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold px-6 py-4 rounded-xl w-full shadow-lg shadow-indigo-500/30 text-sm flex items-center justify-center gap-2">
                            Tap here to experience the magic <ArrowRight className="w-4 h-4" />
                         </button>
                    </div>

                    <div className="flex-1 text-center md:text-left z-10 min-w-0">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-widest mb-6 border border-indigo-500/30">
                            <Smartphone className="w-3 h-3" /> Try the magic
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Experience it yourself.</h2>
                        <p className="hidden md:block text-slate-400 text-lg mb-8 font-medium">Scan this code with your phone. See how quickly it redirects, and imagine the analytics it registers in the backend.</p>
                        <p className="md:hidden text-slate-400 text-lg mb-8 font-medium">Tap the button above to simulate a scan. See how quickly it redirects, and imagine the analytics it registers in the backend.</p>
                        <div className="flex justify-center md:justify-start">
                            <Link to="/register" className="font-bold text-white flex items-center gap-2 hover:text-indigo-300 transition-colors bg-white/10 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/20 whitespace-nowrap">
                                Create your own <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analytics Section - Indian Context */}
            <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Analytics built for India</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">Know exactly who is scanning, when, and from where.</p>
                    </div>
                    <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Fake Browser/Dashboard Header */}
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-4">
                            <div className="flex gap-2 pl-2">
                                <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-red-400 transition-colors"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-amber-400 transition-colors"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-emerald-400 transition-colors"></div>
                            </div>
                            <div className="flex-1 max-w-sm bg-white rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-400 font-mono flex items-center gap-2 mx-auto">
                                <Lock className="w-3 h-3 text-emerald-500" /> https://app.qrvibe.in/analytics
                            </div>
                        </div>
                        {/* Content */}
                        <div className="p-8 md:p-10 bg-slate-50/30">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Campaign Overview</h3>
                                    <p className="text-slate-500 text-sm">Real-time scan data for 'Summer Menu'</p>
                                </div>
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-100">
                                    Last 7 Days
                                </div>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500"/> Top Cities</h4>
                                    <ul className="space-y-3">
                                        <li className="flex justify-between items-center"><span className="text-slate-600">Mumbai</span><span className="font-bold text-slate-900">2,453</span></li>
                                        <li className="flex justify-between items-center"><span className="text-slate-600">Bangalore</span><span className="font-bold text-slate-900">1,897</span></li>
                                        <li className="flex justify-between items-center"><span className="text-slate-600">Delhi NCR</span><span className="font-bold text-slate-900">1,654</span></li>
                                        <li className="flex justify-between items-center"><span className="text-slate-600">Pune</span><span className="font-bold text-slate-900">892</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> Peak Times</h4>
                                    <ul className="space-y-4 mt-2">
                                        <li className="flex flex-col"><span className="text-slate-900 font-bold">12 PM - 2 PM</span><span className="text-sm text-slate-500">Lunch hours (Restaurant QRs)</span></li>
                                        <li className="flex flex-col"><span className="text-slate-900 font-bold">6 PM - 9 PM</span><span className="text-sm text-slate-500">Evening traffic (Retail)</span></li>
                                        <li className="flex flex-col"><span className="text-emerald-600 font-bold">+35%</span><span className="text-sm text-slate-500">Higher traffic on weekends</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Smartphone className="w-5 h-5 text-indigo-500"/> Device Split</h4>
                                    <div className="flex h-4 bg-slate-200 rounded-full overflow-hidden mb-6">
                                        <div className="bg-emerald-500 w-[78%]"></div>
                                        <div className="bg-slate-800 w-[22%]"></div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="font-bold">Android (78%)</span></div>
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-800"></span><span className="font-bold">iOS (22%)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Missing Critical Sections for B2B */}
            <section className="py-24 px-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-widest mb-4 border border-slate-200">
                                <RefreshCw className="w-3 h-3" /> Auto-syncs seamlessly
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Works with tools you already use</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">Integrate your offline data seamlessly into your existing CRM, payment gateways, and communication tools without writing a single line of code.</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-indigo-50 px-5 py-3 rounded-xl border border-indigo-200 flex items-center gap-2 font-bold text-indigo-600 shadow-sm hover:shadow-md transition-shadow">
                                    Razorpay
                                </div>
                                <div className="bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-600 shadow-sm hover:shadow-md transition-shadow">
                                    WhatsApp
                                </div>
                                <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-400 opacity-60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">Zoho CRM</span>
                                        <span className="text-[9px] uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">Soon</span>
                                    </div>
                                </div>
                                <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-400 opacity-60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">Tally</span>
                                        <span className="text-[9px] uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">Soon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <Lock className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-6">Your Data is Safe</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /><span className="text-slate-300 font-medium tracking-wide">Data hosted in India (Mumbai region)</span></li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /><span className="text-slate-300 font-medium tracking-wide">HTTPS encryption on all connections</span></li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /><span className="text-slate-300 font-medium tracking-wide">Payments secured by Razorpay</span></li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /><span className="text-slate-300 font-medium tracking-wide">DPDP Act 2023 compliant (Business plan)</span></li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /><span className="text-slate-300 font-medium tracking-wide">Automatic daily backups</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="bg-indigo-600 rounded-3xl p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden order-2 md:order-1 border border-indigo-500">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
                            <h3 className="text-3xl font-bold mb-4 tracking-tight">Calculate Your ROI</h3>
                            <p className="text-indigo-100 mb-8 font-medium">Stop guessing. See exactly how much your business will save by switching to digital QRs.</p>
                            
                            <div className="space-y-6 bg-white/10 p-6 sm:p-8 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
                                <div>
                                    <label className="text-sm text-indigo-100 font-bold mb-2 block uppercase tracking-wider">Current monthly printing cost</label>
                                    <div className="flex bg-white rounded-xl overflow-hidden text-slate-900 font-bold border-2 border-transparent focus-within:border-indigo-300 transition-colors">
                                        <div className="bg-slate-100 px-4 py-3 border-r border-slate-200 text-slate-500">₹</div>
                                        <input 
                                            type="number" 
                                            className="w-full px-4 py-3 outline-none" 
                                            placeholder="15000" 
                                            value={printingCost || ''}
                                            onChange={(e) => setPrintingCost(Number(e.target.value) || 0)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm text-indigo-100 font-bold uppercase tracking-wider">Updates per month</label>
                                        <span className="bg-indigo-500 px-3 py-1 rounded-lg text-sm font-bold">{updatesPerMonth}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        className="w-full h-2 bg-indigo-400/50 rounded-lg appearance-none cursor-pointer accent-white" 
                                        value={updatesPerMonth}
                                        onChange={(e) => setUpdatesPerMonth(Number(e.target.value))}
                                        min="1" 
                                        max="20" 
                                        step="1"
                                    />
                                    <div className="flex justify-between text-xs text-indigo-200 mt-1 font-medium">
                                        <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-indigo-400/30 mt-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-indigo-200">Current annual printing spend</span>
                                        <span className="font-bold text-white">₹{formatINR(printingCost * updatesPerMonth * 12)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-indigo-200">QRVibe annual cost</span>
                                        <span className="font-bold text-white">₹{formatINR(billingCycle === 'annual' ? 8388 : 10788)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-indigo-400/30">
                                        <span className="text-indigo-100 font-bold uppercase tracking-wider text-sm">Annual Savings:</span>
                                        <span className={`text-3xl font-black drop-shadow-sm ${annualSavings > 0 ? 'text-emerald-300' : 'text-red-300'}`}>₹{formatINR(annualSavings)}</span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Link to="/register" className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold px-6 py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 tracking-wide text-lg">
                                        Start saving ₹{formatINR(annualSavings)} today <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 md:order-2">
                            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
                                <HeadphonesIcon className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Local Support in Hindi & English</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">Get help when you need it from our dedicated Indian support team.</p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3"><Check className="w-6 h-6 p-1 bg-indigo-100 text-indigo-600 rounded-full" /><span className="text-slate-700 font-bold tracking-wide">9 AM - 9 PM IST Phone Support</span></li>
                                <li className="flex items-center gap-3"><Check className="w-6 h-6 p-1 bg-indigo-100 text-indigo-600 rounded-full" /><span className="text-slate-700 font-bold tracking-wide">Direct WhatsApp Support</span></li>
                                <li className="flex items-center gap-3"><Check className="w-6 h-6 p-1 bg-indigo-100 text-indigo-600 rounded-full" /><span className="text-slate-700 font-bold tracking-wide">1-on-1 Onboarding Assistance</span></li>
                            </ul>
                            <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-lg shadow-slate-900/20 md:hover:-translate-y-1">
                                <MessageCircle className="w-5 h-5" /> Chat with Sales
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing (B2B Focused - 3 Tiers) */}
            <section id="pricing" className="py-24 px-6 bg-slate-50 border-b border-slate-200 relative overflow-hidden text-center">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">Simple pricing, huge ROI.</h2>
                        <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">All prices exclusive of 18% GST. Annual plans save you 20%.</p>
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

                    <div className="grid md:grid-cols-3 gap-8 items-stretch lg:px-4 max-w-5xl mx-auto">
                        {/* Starter / Free */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-slate-300 transition-all text-left flex flex-col">
                            <h4 className="font-bold text-xl mb-2 text-slate-900">Starter</h4>
                            <div className="text-5xl font-extrabold mb-2 text-slate-900">₹0</div>
                            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">Try dynamic QR codes free, forever.</p>
                            <ul className="space-y-4 mb-10 text-slate-600 text-sm font-medium flex-1">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>3 Dynamic QR Codes</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>100 scans/month</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>Basic analytics</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> <span>Standard PNG download</span></li>
                            </ul>
                            <Link to="/register" className="block text-center w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all mt-auto">Start Free</Link>
                            <p className="text-center text-xs text-slate-500 mt-3 font-medium">No credit card required</p>
                        </div>

                        {/* Business Pro (Highlighted) */}
                        <div className="bg-indigo-600 text-white p-12 rounded-[40px] shadow-2xl shadow-indigo-200 md:scale-105 relative border border-indigo-500 text-left z-10 transform transition-transform md:hover:-translate-y-1 flex flex-col">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">Most Popular</div>
                            <h4 className="font-bold text-xl mb-2 text-indigo-100">Business Pro</h4>
                            <div className="text-5xl font-black mb-2 flex flex-wrap items-end">
                                {billingCycle === 'annual' ? '₹699' : '₹899'} 
                                <span className="text-lg font-bold text-indigo-300 mb-1 ml-1">/mo</span>
                            </div>
                            <p className="text-sm text-indigo-200 mb-8 pb-8 border-b border-indigo-500/50">
                                {billingCycle === 'annual' ? 'Billed ₹8,388/year + GST' : 'Billed monthly + GST'}
                            </p>
                            <ul className="space-y-4 mb-10 font-bold text-sm text-indigo-50 flex-1">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Unlimited QR Codes</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Advanced analytics & tracking</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Brand design studio & logos</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>SVG vector exports</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> <span>Priority support (Hindi & English)</span></li>
                            </ul>
                            <Link to="/register" className="block text-center w-full py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all text-lg tracking-wide mt-auto">Start 14-Day Free Trial</Link>
                            <p className="text-center text-sm text-indigo-200 mt-3 font-black">No credit card required</p>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 hover:border-slate-300 transition-all text-left flex flex-col">
                            <h4 className="font-bold text-xl mb-2 text-slate-900">Enterprise</h4>
                            <div className="text-5xl font-extrabold mb-2 text-slate-900">Custom</div>
                            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">For large teams & multi-location businesses.</p>
                            <ul className="space-y-4 mb-10 text-slate-600 text-sm font-medium flex-1">
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Everything in Business Pro</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Unlimited team seats</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Advanced API Integration</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Dedicated account manager</span></li>
                                <li className="flex items-start gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" /> <span>Priority Setup & Training</span></li>
                            </ul>
                            <button className="w-full py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-900 rounded-2xl font-bold transition-all bg-white mt-auto">Contact Sales</button>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="mt-20 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">Compare Plans</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="py-4 pr-4 font-bold text-slate-900">Feature</th>
                                        <th className="py-4 px-4 font-bold text-slate-900 text-center">Starter</th>
                                        <th className="py-4 px-4 font-bold text-indigo-600 text-center">Business Pro</th>
                                        <th className="py-4 pl-4 font-bold text-slate-900 text-center">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {[
                                        ['Dynamic QR Codes', '3', 'Unlimited', 'Unlimited'],
                                        ['Scans/month', '100', 'Unlimited', 'Unlimited'],
                                        ['Analytics', 'Basic', 'Advanced Tracking', 'Advanced Tracking'],
                                        ['Custom Branding', '—', '✓', '✓'],
                                        ['SVG Exports', '—', '✓', '✓'],
                                        ['Team Members', '1', '3', 'Unlimited'],
                                        ['API Access', '—', '—', '✓'],
                                        ['Priority Setup', '—', '—', '✓'],
                                        ['Dedicated Manager', '—', '—', '✓'],
                                        ['Support', 'Email', 'Priority (Hindi/EN)', 'Dedicated Support'],
                                    ].map(([feature, starter, pro, enterprise], i) => (
                                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3.5 pr-4 font-medium text-slate-800">{feature}</td>
                                            <td className="py-3.5 px-4 text-center">{starter === '✓' ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : starter === '—' ? <X className="w-4 h-4 text-slate-300 mx-auto" /> : starter}</td>
                                            <td className="py-3.5 px-4 text-center font-semibold text-indigo-600 bg-indigo-50/50">{pro === '✓' ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : pro === '—' ? <X className="w-4 h-4 text-slate-300 mx-auto" /> : pro}</td>
                                            <td className="py-3.5 pl-4 text-center">{enterprise === '✓' ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : enterprise === '—' ? <X className="w-4 h-4 text-slate-300 mx-auto" /> : enterprise}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 bg-white border-b border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 text-center tracking-tight">Frequently Asked Questions</h2>
                    <p className="text-slate-500 text-center mb-12 text-lg">Everything you need to know about pricing and billing.</p>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full text-left p-5 sm:p-6 flex justify-between items-center gap-4 bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-900">{faq.q}</span>
                                    <span className={`text-slate-400 transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder's Note (High Trust & Personal Connection) */}
            <section className="py-24 px-6 bg-slate-900 border-y border-slate-800 relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -z-0"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-0"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 md:p-16 rounded-[48px] shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                            <div className="shrink-0 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-700 rounded-full overflow-hidden border-4 border-slate-800 relative flex items-center justify-center">
                                    <img src={founderImg} alt="Novel - Founder" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full border-4 border-slate-800 shadow-lg">
                                    <Check className="w-4 h-4 text-white font-bold" />
                                </div>
                            </div>

                            <div>
                                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-6 border border-indigo-500/20">
                                    Message from the Founder
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 leading-tight italic">
                                    &ldquo;I built QRVibe because I saw Indian businesses losing money on static QRs that break. My goal is simple: ensure your physical marketing never goes dead.&rdquo;
                                </h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
                                    As a founder building for the Indian market, I know how frustrating it is to print thousands of flyers only to realize the link is broken or needs an update. QRVibe is my commitment to solving that. If you ever have a problem, you can reach me directly.
                                </p>
                                <div>
                                    <p className="text-white font-black text-xl mb-1">Novel</p>
                                    <p className="text-indigo-400 font-bold text-sm tracking-wide">Founder, QRVibe</p>
                                </div>
                            </div>
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
