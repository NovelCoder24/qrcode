import React, { useEffect, useState, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Smartphone, Globe, ArrowUpRight, ArrowDownRight, Activity, MapPin, Copy, Link, Check, ArrowLeft, Search, ChevronLeft, ChevronRight, QrCode } from 'lucide-react';
import axiosInstance from '../api/axios';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Shared MetricDelta component
const MetricDelta = ({ current, previous, delta, days }) => {
    if (delta === 0 && current === previous) return <span className="text-xs font-semibold text-slate-400 ml-2">Flat vs prior {days}d</span>;
    const isUp = current > previous;
    const diff = current - previous;
    const displayValue = previous < 10 ? `${diff > 0 ? '+' : ''}${diff}` : `${isUp ? '+' : ''}${Math.abs(delta)}%`;
    return (
        <span className={`text-xs flex items-center gap-0.5 ml-2 font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {displayValue}
        </span>
    );
};

// Shared KPI Cards
const StatCards = ({ totals, days }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total scans</p>
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Activity size={16} /></div>
            </div>
            <div className="flex items-baseline mb-2">
                <h3 className="text-3xl font-black text-slate-900">{totals.scans}</h3>
                <MetricDelta current={totals.scans} previous={totals.previousScans} delta={totals.scansDelta} days={days} />
            </div>
            {totals.botFiltered > 0 && (
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <span role="img" aria-label="shield">🛡️</span> {totals.botFiltered} Bot scans filtered
                </div>
            )}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unique scanners</p>
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Users size={16} /></div>
            </div>
            <div className="flex items-baseline">
                <h3 className="text-3xl font-black text-slate-900">{totals.uniqueScanners}</h3>
                <MetricDelta current={totals.uniqueScanners} previous={totals.previousUniqueScanners || 0} delta={totals.uniqueDelta} days={days} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{totals.activeQRs !== undefined ? 'Active QRs' : 'Total Scans (All Time)'}</p>
                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><Globe size={16} /></div>
            </div>
            {totals.activeQRs !== undefined ? (
                <h3 className="text-3xl font-black text-slate-900">{totals.activeQRs} <span className="text-slate-400 font-medium text-lg">/ {totals.totalQRs}</span></h3>
            ) : (
                <h3 className="text-3xl font-black text-slate-900">{totals.allTimeScans ?? '—'}</h3>
            )}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Peak Scan Time</p>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Activity size={16} /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totals.peakTime || '—'}</h3>
        </div>
    </div>
);

// Shared Charts section
const ChartsSection = ({ scansOverTime, deviceStats, locations, copied, onCopyLatest, hasQRs }) => (
    <>
        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" /> Scans Over Time
                </h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scansOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} />
                            <RechartsTooltip labelFormatter={(str) => new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} />
                            <Area type="monotone" dataKey="scans" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Smartphone size={18} className="text-emerald-500" /> OS Breakdown
                </h2>
                <div className="flex-1 w-full flex flex-col justify-center relative">
                    {deviceStats.types.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={deviceStats.types} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                                    {deviceStats.types.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-slate-500 font-medium mb-4">Share your QR code to start seeing OS data.</p>
                            {hasQRs && (
                                <button onClick={onCopyLatest} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800">
                                    {copied ? <Check size={16}/> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {/* Top Cities */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" /> Top Cities
            </h2>
            {locations?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {locations.map((loc, idx) => {
                        const maxCount = Math.max(...locations.map(l => l.count));
                        return (
                            <div key={idx}>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-400 text-xs w-4">#{idx + 1}</span>
                                        <span className="font-bold text-slate-800">{loc.city || 'Unknown City'}</span>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{loc.countryCode || 'N/A'}</span>
                                    </div>
                                    <span className="font-bold text-indigo-600">{loc.count} scans</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(loc.count / maxCount) * 100}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-sm text-slate-500 font-medium">Share your QR code to see geographic scan data.</p>
                </div>
            )}
        </div>
    </>
);

// QR Table with pagination + search
const QRTable = ({ onSelectQR }) => {
    const [qrs, setQrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const limit = 10;

    const fetchTable = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/analytics/table?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sort=-scans`);
            setQrs(res.data.qrs);
            setTotalPages(res.data.totalPages);
            setTotalCount(res.data.totalCount);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchTable(); }, [fetchTable]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const typeColors = {
        URL: 'bg-indigo-50 text-indigo-700',
        PDF: 'bg-rose-50 text-rose-700',
        VCARD: 'bg-emerald-50 text-emerald-700',
        WHATSAPP: 'bg-green-50 text-green-700',
        SOCIAL: 'bg-blue-50 text-blue-700',
        MEDIA: 'bg-purple-50 text-purple-700',
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <QrCode size={18} className="text-indigo-500" /> All QR Codes
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">{totalCount} total · Click to drill down</p>
                </div>
                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </form>
            </div>
            {loading ? (
                <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : qrs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium text-sm">
                    {search ? `No QR codes matching "${search}"` : 'No QR codes created yet.'}
                </div>
            ) : (
                <>
                    <div className="divide-y divide-slate-100">
                        {qrs.map(qr => (
                            <button key={qr._id} onClick={() => onSelectQR(qr._id)} className="w-full p-4 px-6 flex items-center justify-between hover:bg-indigo-50/40 transition-colors group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                        <QrCode className="text-slate-400 w-5 h-5"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[250px]">{qr.metadata?.title || 'Untitled'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${typeColors[qr.qr_type] || typeColors.URL}`}>{qr.qr_type}</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{new Date(qr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <span className="block text-xl font-black text-slate-900 leading-none mb-1">{qr.stats?.total_scans || 0}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Scans</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">Page {page} of {totalPages} ({totalCount} codes)</p>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ============ MAIN COMPONENT ============
const AnalyticsPage = () => {
    const [globalData, setGlobalData] = useState(null);
    const [drillData, setDrillData] = useState(null);
    const [selectedQrId, setSelectedQrId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [drillLoading, setDrillLoading] = useState(false);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);
    const [copied, setCopied] = useState(false);

    // Fetch global dashboard data
    useEffect(() => {
        const fetchGlobal = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/analytics/dashboard?days=${days}`);
                setGlobalData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        if (!selectedQrId) fetchGlobal();
    }, [days, selectedQrId]);

    // Fetch drill-down data when a QR is selected
    useEffect(() => {
        if (!selectedQrId) { setDrillData(null); return; }
        const fetchDrill = async () => {
            setDrillLoading(true);
            try {
                const response = await axiosInstance.get(`/analytics/qrcodes/${selectedQrId}?days=${days}`);
                setDrillData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load QR analytics');
                setSelectedQrId(null);
            } finally {
                setDrillLoading(false);
            }
        };
        fetchDrill();
    }, [selectedQrId, days]);

    const handleCopyLatest = () => {
        const performers = globalData?.topPerformers;
        if (performers?.length > 0) {
            const shortUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/r/${performers[0].short_id}`;
            navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleBack = () => { setSelectedQrId(null); setDrillData(null); setError(''); };

    // Loading state
    if (loading && !globalData) {
        return (<div className="flex justify-center items-center h-full min-h-[500px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>);
    }
    if (error && !globalData && !drillData) {
        return (<div className="p-8"><div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-200">{error}</div></div>);
    }

    // ========== DRILL-DOWN VIEW ==========
    if (selectedQrId) {
        if (drillLoading || !drillData) {
            return (<div className="flex justify-center items-center h-full min-h-[500px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>);
        }

        const { qr, totals, scansOverTime, deviceStats, locations } = drillData;
        // Build drill-down totals with allTimeScans for the 3rd KPI card
        const drillTotals = { ...totals, allTimeScans: qr.stats?.total_scans || 0 };

        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">QR Code Analytics</p>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                {qr.metadata?.title || 'Untitled'}
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold uppercase">{qr.qr_type}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {[7, 30, 90].map(d => (
                            <button key={d} onClick={() => setDays(d)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${days === d ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>{d}D</button>
                        ))}
                    </div>
                </div>

                <StatCards totals={drillTotals} days={days} />
                <ChartsSection scansOverTime={scansOverTime} deviceStats={deviceStats} locations={locations} copied={copied} onCopyLatest={handleCopyLatest} hasQRs={true} />
            </div>
        );
    }

    // ========== GLOBAL VIEW ==========
    const { totals, scansOverTime, deviceStats, locations, topPerformers } = globalData;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header & Date Range */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scan Analytics</h1>
                    <p className="text-slate-500 mt-1 font-medium">Detailed breakdown of your QR code performance.</p>
                </div>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    {[7, 30, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${days === d ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>{d}D</button>
                    ))}
                </div>
            </div>

            <StatCards totals={totals} days={days} />
            <ChartsSection scansOverTime={scansOverTime} deviceStats={deviceStats} locations={locations} copied={copied} onCopyLatest={handleCopyLatest} hasQRs={topPerformers?.length > 0} />

            {/* QR Codes Table (Paginated) */}
            <QRTable onSelectQR={(id) => setSelectedQrId(id)} />
        </div>
    );
};

export default AnalyticsPage;
