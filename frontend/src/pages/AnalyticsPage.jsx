import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Smartphone, Globe, ArrowUpRight, ArrowDownRight, Activity, MapPin, Copy, Link, Check } from 'lucide-react';
import axiosInstance from '../api/axios';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// World Map fallback if specific state map isn't available
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/analytics/dashboard?days=${days}`);
                setData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [days]);

    const handleCopyLatest = () => {
        if (data?.topPerformers?.length > 0) {
            const shortUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}/r/${data.topPerformers[0].short_id}`;
            navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center h-full min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-200">
                    {error}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { totals, scansOverTime, deviceStats, locations, topPerformers } = data;

    const MetricDelta = ({ delta }) => {
        if (delta === 0) return <span className="text-xs font-semibold text-slate-400 ml-2">Flat vs prior {days}d</span>;
        const isUp = delta > 0;
        return (
            <span className={`text-xs flex items-center gap-0.5 ml-2 font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(delta)}%
            </span>
        );
    };

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
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${days === d ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total scans</p>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Activity size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <h3 className="text-3xl font-black text-slate-900">{totals.scans}</h3>
                        <MetricDelta delta={totals.scansDelta} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unique scanners</p>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <h3 className="text-3xl font-black text-slate-900">{totals.uniqueScanners}</h3>
                        <MetricDelta delta={totals.uniqueDelta} />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active QRs</p>
                        <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Globe size={16} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">{totals.activeQRs} <span className="text-slate-400 font-medium text-lg">/ {totals.totalQRs}</span></h3>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Top Device</p>
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Smartphone size={16} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 capitalize truncate">
                        {deviceStats.types?.length > 0 ? deviceStats.types.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : '—'}
                    </h3>
                </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-500" /> 
                        Scans Over Time
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
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return `${date.getMonth()+1}/${date.getDate()}`;
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                                />
                                <Area type="monotone" dataKey="scans" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Breakdown (Donut) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                    <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Smartphone size={18} className="text-emerald-500" />
                        Device Breakdown
                    </h2>
                    <div className="flex-1 w-full flex flex-col justify-center relative">
                        {deviceStats.types.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={deviceStats.types}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {deviceStats.types.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-slate-500 font-medium mb-4">Share your QR code to start seeing device data.</p>
                                {topPerformers?.length > 0 && (
                                     <button 
                                        onClick={handleCopyLatest}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800"
                                    >
                                        {copied ? <Check size={16}/> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performing QRs */}
                <div className="bg-white p-0 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                         <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <ArrowUpRight size={18} className="text-rose-500" />
                            Top Performing QRs
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {topPerformers?.length > 0 ? topPerformers.map((qr) => (
                            <a href={`/qrcodes/${qr._id}`} key={qr._id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                     {qr.qrImageUrl ? (
                                        <img src={qr.qrImageUrl} alt="QR" className="w-10 h-10 object-contain p-1 border border-slate-200 rounded-lg bg-white" />
                                    ) : (
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                            <Globe className="text-slate-400 w-5 h-5"/>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{qr.metadata?.title || 'Untitled'}</p>
                                            <div title={qr.health_status === 'broken' ? 'Destination unreachable' : 'Healthy URL'} className={`w-2 h-2 rounded-full ${qr.health_status === 'broken' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px] flex items-center gap-1 font-medium">
                                            <Link size={10} />
                                            {qr.target_url ? new URL(qr.target_url).hostname : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <span className="block text-xl font-black text-slate-900 leading-none mb-1">{qr.stats.total_scans}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Scans</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                            </a>
                        )) : (
                           <div className="p-8 text-center text-slate-500 font-medium text-sm">No QRs created yet.</div>
                        )}
                    </div>
                </div>

                {/* Top Locations */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                     <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <MapPin size={18} className="text-orange-500" />
                        Scan Density Map
                    </h2>
                    
                    {locations?.length > 0 ? (
                        <div className="flex-1 flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-1/2 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden p-2">
                                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }} height={300} width={400} className="w-full h-full">
                                    <Geographies geography={geoUrl}>
                                        {({ geographies }) =>
                                            geographies.map(geo => (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill="#E2E8F0"
                                                    stroke="#CBD5E1"
                                                    strokeWidth={0.5}
                                                    className="outline-none"
                                                />
                                            ))
                                        }
                                    </Geographies>
                                    {locations.map((loc, idx) => (
                                        loc.coordinates && (
                                            <Marker key={idx} coordinates={loc.coordinates}>
                                                <circle r={loc.count > 100 ? 12 : loc.count > 50 ? 8 : 4} fill="#4F46E5" fillOpacity={0.6} />
                                            </Marker>
                                        )
                                    ))}
                                </ComposableMap>
                            </div>
                            <div className="lg:w-1/2 space-y-4 overflow-y-auto pr-2 max-h-[300px]">
                                {locations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{loc.city}</p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">{loc.countryCode}</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-indigo-600">
                                            {loc.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-slate-500 font-medium mb-4">Share your QR code to see geographic scan data.</p>
                             {topPerformers?.length > 0 && (
                                     <button 
                                        onClick={handleCopyLatest}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800"
                                    >
                                        {copied ? <Check size={16}/> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                            )}
                         </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AnalyticsPage;
