import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, ScanLine, Zap, MousePointer2, PlusCircle, ChevronDown, QrCode, Download,
    MoreHorizontal, Loader2, Trash2, Edit2, Calendar, Folder, ExternalLink, PencilLine, Image as ImageIcon,
    Square, CheckSquare, Palette, ArrowRightLeft, Copy, PauseCircle, X, Check, Share,
    Globe, FileText, Contact, Share2, MessageCircle, Film,
    PartyPopper, Link as LinkIcon, LogOut, CreditCard, Settings, User, BarChart3, Layers, Menu, ChevronRight
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useSelector } from 'react-redux';
import StyledQRCode from './StyledQRCode';
import api from '../api/axios';

// Helper: format a date string to relative time
const timeAgo = (dateString) => {
    if (!dateString) return '—';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
};

const LoadingSkeleton = () => (
    <div className="max-w-md mx-auto px-4 pt-6 animate-pulse">
        {/* Welcome Skeleton */}
        <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl mb-2"></div>
                    <div className="h-5 w-8 bg-slate-200 rounded mb-1"></div>
                    <div className="h-2 w-12 bg-slate-100 rounded"></div>
                </div>
            ))}
        </div>

        {/* Action Bar Skeleton */}
        <div className="space-y-4 mb-6">
            <div className="h-14 bg-indigo-100 rounded-2xl"></div>
            <div className="h-12 bg-white border border-slate-200 rounded-2xl"></div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4">
                    {/* Shining QR Box */}
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                        <QrCode size={32} className="text-slate-200" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-4 w-4 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-3 w-40 bg-slate-100 rounded"></div>
                        <div className="flex justify-between items-end">
                            <div className="flex gap-4">
                                <div className="h-6 w-10 bg-slate-100 rounded"></div>
                                <div className="h-6 w-10 bg-slate-100 rounded"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                                <div className="h-8 w-8 bg-slate-100 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Custom Style for the shimmer effect */}
        <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
);

const DesktopLoadingSkeleton = () => (
    <div className="hidden md:block p-6 md:p-10 bg-slate-50 min-h-full animate-pulse">
        {/* Top Header Skeleton */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
                <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
                <div className="h-4 w-48 bg-slate-200 rounded-md"></div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="hidden lg:block w-64 h-11 bg-white border border-slate-200 rounded-xl"></div>
                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
            </div>
        </header>

        {/* Desktop Mobile Search Bar Skeleton */}
        <div className="lg:hidden mb-6 w-full h-11 bg-white border border-slate-200 rounded-xl"></div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4"></div>
                    <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                </div>
            ))}
        </div>

        {/* Codes Table Skeleton */}
        <div className="w-full mb-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-5 h-5 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
            
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-6 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                            <QrCode size={24} className="text-slate-200" />
                        </div>
                        <div className="flex-1">
                            <div className="h-5 w-48 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 w-64 bg-slate-100 rounded"></div>
                        </div>
                        <div className="hidden lg:flex gap-8 px-8">
                            <div>
                                <div className="h-3 w-12 bg-slate-200 rounded mb-2"></div>
                                <div className="h-4 w-16 bg-slate-100 rounded"></div>
                            </div>
                            <div>
                                <div className="h-3 w-12 bg-slate-200 rounded mb-2"></div>
                                <div className="h-4 w-24 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl"></div>
                            <div className="w-9 h-9 bg-slate-100 rounded-xl"></div>
                            <div className="w-9 h-9 bg-slate-100 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <style>{`
            @keyframes shimmer {
                100% { transform: translateX(100%); }
            }
        `}</style>
    </div>
);

const Dashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isFirstQR = searchParams.get('firstQR') === 'true';
    const [showFirstQRBanner, setShowFirstQRBanner] = useState(isFirstQR);
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingItem, setEditingItem] = useState(null); // { id, field: 'title' | 'url', value }
    const [changeTypeModal, setChangeTypeModal] = useState(null); // { id, type }
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [previewModal, setPreviewModal] = useState(null); // stores the entire qr object for preview
    const [downloadModal, setDownloadModal] = useState(null); // stores the qr object
    const [downloadFormat, setDownloadFormat] = useState('PNG'); // PNG, JPEG, SVG
    const [downloadSize, setDownloadSize] = useState('Default'); // Default, Large, Small
    const [isSaving, setIsSaving] = useState(false);
    const [selectedQRs, setSelectedQRs] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            setActiveMenuId(null);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchQRCodes();
    }, []);

    // Filter QR codes based on search query
    const filteredQRCodes = qrCodes.filter(qr => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const title = (qr.metadata?.title || '').toLowerCase();
        const url = (qr.target_url || '').toLowerCase();
        const shortId = (qr.short_id || '').toLowerCase();
        return title.includes(query) || url.includes(query) || shortId.includes(query);
    });

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const fetchQRCodes = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/qrcodes/myqrs');
            setQrCodes(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load QR codes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this QR code?')) return;
        try {
            await api.delete(`/qrcodes/${id}`);
            setQrCodes(prev => prev.filter(qr => qr._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem || !editingItem.value.trim()) return;
        setIsSaving(true);
        try {
            const payload = {};
            if (editingItem.field === 'title') {
                payload.metadata = { title: editingItem.value };
            } else if (editingItem.field === 'url') {
                payload.target_url = editingItem.value;
            }

            const { data } = await api.put(`/qrcodes/${editingItem.id}`, payload);

            // Update local state
            setQrCodes(prev => prev.map(qr => {
                if (qr._id === editingItem.id) {
                    return {
                        ...qr,
                        target_url: editingItem.field === 'url' ? editingItem.value : qr.target_url,
                        metadata: {
                            ...qr.metadata,
                            title: editingItem.field === 'title' ? editingItem.value : qr.metadata?.title
                        }
                    };
                }
                return qr;
            }));

            setEditingItem(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTypeChange = async () => {
        if (!changeTypeModal || !changeTypeModal.type) return;
        setIsSaving(true);
        try {
            const { data } = await api.put(`/qrcodes/${changeTypeModal.id}`, { qr_type: changeTypeModal.type });

            // Update local state
            setQrCodes(prev => prev.map(qr => {
                if (qr._id === changeTypeModal.id) {
                    return { ...qr, qr_type: changeTypeModal.type };
                }
                return qr;
            }));

            setChangeTypeModal(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update type');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedQRs.size === qrCodes.length) {
            setSelectedQRs(new Set());
        } else {
            setSelectedQRs(new Set(qrCodes.map(qr => qr._id)));
        }
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedQRs);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedQRs(newSet);
    };

    // --- DOWNLOAD LOGIC --- //
    const qrDownloadRef = useRef(null);

    // Map size labels to pixel values
    const getSizePixels = () => {
        switch (downloadSize) {
            case 'Large': return 2000;
            case 'Small': return 500;
            default: return 1000;
        }
    };

    const handleTriggerDownload = async () => {
        if (!downloadModal) return;

        try {
            const qr = downloadModal;
            const design = qr.customization || {};
            const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const shortUrl = `${baseUrl}/r/${qr.short_id}`;
            const size = getSizePixels();
            const title = qr.metadata?.title || 'QRCode';

            // Map download format
            const formatMap = { PNG: 'png', JPEG: 'jpeg', SVG: 'svg' };
            const extension = formatMap[downloadFormat] || 'png';

            // Create a temporary QRCodeStyling instance for download at the desired size
            const QRCodeStyling = (await import('qr-code-styling')).default;
            const downloadInstance = new QRCodeStyling({
                width: size,
                height: size,
                type: extension === 'svg' ? 'svg' : 'canvas',
                data: shortUrl,
                image: design.logoUrl || undefined,
                dotsOptions: {
                    color: design.fgColor || '#000000',
                    type: design.qrStyle === 'dots' ? 'dots' : 'square',
                },
                backgroundOptions: {
                    color: design.bgColor || '#ffffff',
                },
                cornersSquareOptions: {
                    type: design.eyeShape === 'circle' ? 'dot' : 'square',
                },
                cornersDotOptions: {
                    type: design.eyeShape === 'circle' ? 'dot' : 'square',
                },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 4,
                    imageSize: 0.35,
                    hideBackgroundDots: true,
                },
                qrOptions: {
                    errorCorrectionLevel: 'H',
                },
            });

            await downloadInstance.download({
                name: title,
                extension: extension,
            });

            setDownloadModal(null);
            setPreviewModal(null);
        } catch (err) {
            console.error('Download Error:', err);
            alert('An unexpected error occurred while starting the download.');
        }
    };

    // Compute live stats from real data
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.stats?.total_scans || 0), 0);
    const activeCodes = qrCodes.filter(qr => qr.isActive).length;
    const totalCodes = qrCodes.length;

    // Icon colors by QR type
    const typeColors = {
        URL: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
        PDF: { bg: 'bg-rose-100', text: 'text-rose-600' },
        VCARD: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        WHATSAPP: { bg: 'bg-green-100', text: 'text-green-600' },
        SOCIAL: { bg: 'bg-blue-100', text: 'text-blue-600' },
        MEDIA: { bg: 'bg-purple-100', text: 'text-purple-600' },
    };

    const getTypeColor = (type) => typeColors[type] || typeColors.URL;

    const availableTypes = [
        { id: 'URL', label: 'Website', icon: <Globe size={24} /> },
        { id: 'PDF', label: 'PDF', icon: <FileText size={24} /> },
        { id: 'VCARD', label: 'vCard', icon: <Contact size={24} /> },
        { id: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle size={24} /> },
        { id: 'SOCIAL', label: 'Social Media', icon: <Share2 size={24} /> },
        { id: 'MEDIA', label: 'Media', icon: <Film size={24} /> },
    ];

    return (
        <>
        {/* Mobile View */}
        <div className="md:hidden min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

            {loading ? <LoadingSkeleton /> : (
            <main className="max-w-md mx-auto px-4 pt-6">
                {/* Welcome Section */}
                <section className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}!</h1>
                            <p className="text-slate-500 text-sm font-medium">You have {totalCodes} QR codes across {totalScans.toLocaleString()} total scans.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm shrink-0">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl mb-2 flex items-center justify-center">
                            <BarChart3 size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{totalScans.toLocaleString()}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Scans</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-xl mb-2 flex items-center justify-center">
                            <Zap size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{activeCodes}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Active</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl mb-2 flex items-center justify-center">
                            <Layers size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{totalCodes}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Codes</span>
                    </div>
                </section>

                {/* Action Bar */}
                <section className="mb-6 space-y-4">
                    <button onClick={() => navigate('/create')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <PlusCircle size={20} strokeWidth={3} />
                        Create New Code
                    </button>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search your codes..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </section>

                {/* QR List Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">Your Recent Codes</h2>
                        <button className="text-indigo-600 text-sm font-bold flex items-center" onClick={() => navigate('/analytics')}>
                            View All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {filteredQRCodes.map((qr) => {
                            const typeLower = qr.qr_type?.toLowerCase() || 'url';
                            const typeIconMap = {
                                url: <Globe size={24} />,
                                pdf: <FileText size={24} />,
                                vcard: <Contact size={24} />,
                                whatsapp: <MessageCircle size={24} />,
                                social: <Share2 size={24} />,
                                media: <Film size={24} />
                            };
                            const TypeIcon = typeIconMap[typeLower] || <Globe size={24} />;

                            const formatTypeColors = {
                                url: 'text-indigo-500',
                                pdf: 'text-rose-500',
                                vcard: 'text-emerald-500',
                                whatsapp: 'text-green-500',
                                social: 'text-blue-500',
                                media: 'text-purple-500'
                            };
                            const iconColorClass = formatTypeColors[typeLower] || 'text-indigo-500';

                            return (
                                <div 
                                    key={qr._id} 
                                    onClick={(e) => {
                                        // On mobile, prevent navigation if clicking directly on action buttons
                                        if (e.target.closest('button')) return;
                                        navigate(`/qrcodes/${qr._id}`);
                                    }} 
                                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex cursor-pointer relative"
                                >
                                    <div className="flex gap-4 w-full">
                                        {/* Visual Preview Area */}
                                        <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative shrink-0">
                                            <QrCode size={32} className="text-slate-200" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {React.cloneElement(TypeIcon, { size: 24, className: iconColorClass })}
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 truncate pr-2">{qr.metadata?.title || 'Untitled QR Code'}</h3>
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/qrcodes/${qr._id}`); }} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">
                                                    {qr.qr_type || 'URL'}
                                                </span>
                                                <span>•</span>
                                                <span className="truncate max-w-[120px]">{qr.target_url?.replace('https://', '')}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Scans</span>
                                                        <span className="text-sm font-extrabold text-indigo-600">{qr.stats?.total_scans || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Created</span>
                                                        <span className="text-sm font-medium text-slate-600">{new Date(qr.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); setDownloadModal(qr); }} className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors border border-slate-100">
                                                        <Download size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(qr.target_url, '_blank'); }} className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors border border-indigo-100">
                                                        <ExternalLink size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredQRCodes.length === 0 && (
                            <div className="text-center py-8 text-slate-500">No QR codes found.</div>
                        )}
                    </div>

                    <div className="mt-8 text-center text-slate-400 text-xs font-medium pb-8">
                        Showing {filteredQRCodes.length} of {qrCodes.length} results
                    </div>
                </section>
            </main>
            )}
            
        </div>

        {/* Desktop View */}
        {loading ? <DesktopLoadingSkeleton /> : (
        <div className="hidden md:block p-6 md:p-10 bg-slate-50 min-h-full">
            {/* Top Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1">Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}!</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        {totalCodes > 0
                            ? `You have ${totalCodes} QR code${totalCodes !== 1 ? 's' : ''} with ${totalScans.toLocaleString()} total scans.`
                            : 'Create your first QR code to get started!'}
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search codes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 w-64 font-medium"
                        />
                    </div>
                    <div className="relative ml-auto md:ml-0" ref={userMenuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                            className="w-10 h-10 rounded-xl border border-slate-200 bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden hover:bg-indigo-200 transition-colors"
                        >
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </button>
                        {showUserMenu && (
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => { setShowUserMenu(false); navigate('/billing'); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                    >
                                        <CreditCard className="w-4 h-4 text-slate-400" />
                                        Billing
                                    </button>
                                </div>
                                <div className="border-t border-slate-100 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Search Bar */}
            <div className="lg:hidden mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <ScanLine className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Scans</p>
                    <h4 className="text-2xl font-black">{totalScans.toLocaleString()}</h4>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Codes</p>
                    <h4 className="text-2xl font-black">{activeCodes}</h4>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <MousePointer2 className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Codes</p>
                    <h4 className="text-2xl font-black">{totalCodes}</h4>
                </div>
                <div
                    onClick={() => navigate('/create')}
                    className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-100 text-white flex flex-col justify-center items-center cursor-pointer hover:bg-indigo-700 transition-all"
                >
                    <PlusCircle className="w-8 h-8 mb-2" />
                    <span className="font-bold text-sm">Create New Code</span>
                </div>
            </div>

            {/* Codes Table / Recent Activity */}
            <div className="w-full mb-8">
                {/* Search & Select All Bar (per design) */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                        {selectedQRs.size === qrCodes.length && qrCodes.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-indigo-500" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">Select All</span>
                    </button>
                    {/* The search bar was shown here in the design but we already have one in the header. We can skip adding another one to avoid redundancy. */}
                </div>

                {error ? (
                    <div className="p-8 text-center text-red-500 font-medium bg-white rounded-3xl border border-slate-100 shadow-sm">{error}</div>
                ) : qrCodes.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-700 mb-1">No QR codes yet</h4>
                        <p className="text-slate-400 text-sm mb-6">Create your first QR code to start tracking scans.</p>
                        <button
                            onClick={() => navigate('/create')}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                        >
                            Create QR Code
                        </button>
                    </div>
                ) : filteredQRCodes.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-700 mb-1">No results found</h4>
                        <p className="text-slate-400 text-sm mb-6">No QR codes match "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <>
                        {/* First QR Success Banner */}
                        {showFirstQRBanner && qrCodes.length > 0 && (
                            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 relative">
                                <button
                                    onClick={() => { setShowFirstQRBanner(false); setSearchParams({}); }}
                                    className="absolute top-4 right-4 text-green-400 hover:text-green-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <PartyPopper className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-800 text-lg">Your first QR code is live!</h3>
                                        <p className="text-green-600 text-sm">Share it to start seeing who's scanning.</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => {
                                            const qr = qrCodes[0];
                                            const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                                            const shortUrl = `${baseUrl}/r/${qr.short_id}`;
                                            navigator.clipboard.writeText(shortUrl);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg font-medium text-sm hover:bg-green-50 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Copy QR Link
                                    </button>
                                    <button
                                        onClick={() => setDownloadModal(qrCodes[0])}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download QR
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                        {filteredQRCodes.map((qr) => {
                            const colors = getTypeColor(qr.qr_type);
                            const isSelected = selectedQRs.has(qr._id);

                            // Format dates
                            const createdDate = qr.createdAt ? new Date(qr.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown';
                            const modifiedDate = qr.updatedAt ? new Date(qr.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : createdDate;

                            return (
                                <div key={qr._id} className="flex flex-col xl:flex-row items-start xl:items-center gap-4 p-4 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">

                                    {/* Left: Checkbox & QR Image */}
                                    <div className="flex items-center gap-4 w-full xl:w-auto">
                                        <button onClick={() => toggleSelect(qr._id)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                                            {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                                        </button>
                                        <div
                                            className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden p-2 relative group"
                                            onClick={() => setPreviewModal(qr)}
                                        >
                                            <QrCode className={`w-10 h-10 ${colors.text} transition-all group-hover:scale-110`} />
                                            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Search className="w-5 h-5 text-slate-700 bg-white/80 rounded-full p-1" />
                                            </div>
                                        </div>

                                        {/* Main Details (Mobile/Tablet view inline) */}
                                        <div className="flex-1 xl:hidden">
                                            <p className={`text-[11px] font-bold ${colors.text} mb-1 flex items-center gap-1`}>
                                                {qr.qr_type}
                                            </p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-extrabold text-slate-900 text-base">{qr.metadata?.title || 'Untitled QR'}</h4>
                                                <button onClick={() => setEditingItem({ id: qr._id, field: 'title', value: qr.metadata?.title || '' })} className="text-blue-500 hover:text-blue-700 p-1">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Group 1: Title & Dates (Desktop) */}
                                    <div className="hidden xl:block flex-1 min-w-[200px]">
                                        <p className={`text-[11px] font-bold ${colors.text} mb-1`}>{qr.qr_type}</p>
                                        <div className="flex items-center gap-2 mb-1.5 line-clamp-1">
                                            <h4 className="font-extrabold text-slate-900 text-base m-0 leading-tight">{qr.metadata?.title || 'Untitled QR'}</h4>
                                            <button
                                                onClick={() => setEditingItem({ id: qr._id, field: 'title', value: qr.metadata?.title || '' })}
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                                                title="Rename QR Code"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{createdDate}</span>
                                        </div>
                                    </div>

                                    {/* Details Group 2: Folder, URL, Modified */}
                                    <div className="flex-1 min-w-[250px] space-y-2.5 w-full xl:w-auto border-t border-slate-100 pt-4 xl:border-0 xl:pt-0">
                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                            <Folder className="w-3.5 h-3.5" />
                                            <span>No folder</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            <a href={qr.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm font-medium truncate max-w-[200px] xl:max-w-xs block">
                                                {qr.target_url}
                                            </a>
                                            <button
                                                onClick={() => setEditingItem({ id: qr._id, field: 'url', value: qr.target_url })}
                                                className="text-slate-400 hover:text-blue-500 hover:bg-slate-100 p-1 rounded transition-colors flex-shrink-0"
                                                title="Edit Destination URL"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                                            <PencilLine className="w-3.5 h-3.5" />
                                            <span>Modified: {modifiedDate}</span>
                                        </div>
                                    </div>

                                    {/* Scans Badge */}
                                    <div className="flex flex-col items-center justify-center min-w-[80px] xl:border-l xl:border-r border-slate-100 xl:px-8 w-full xl:w-auto py-2 xl:py-0 border-t xl:border-t-0">
                                        <span className="text-[10px] font-black uppercase text-blue-500 mb-1">Scans</span>
                                        <div className="w-12 h-12 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-xl font-black text-blue-600">{(qr.stats?.total_scans || 0)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 w-full xl:w-auto mt-2 xl:mt-0 pt-4 xl:pt-0 border-t border-slate-100 xl:border-0 relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDownloadModal(qr); }}
                                            className="px-4 py-2 border border-blue-200 text-blue-500 font-bold text-sm rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/qrcodes/${qr._id}`); }}
                                            className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            Detail
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === qr._id ? null : qr._id);
                                                }}
                                                className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${activeMenuId === qr._id ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                                title="More Actions"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenuId === qr._id && (
                                                <div
                                                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-10"
                                                    onClick={(e) => e.stopPropagation()} // Keep open if clicking inside
                                                >
                                                    <button
                                                        onClick={() => { setEditingItem({ id: qr._id, field: 'url', value: qr.target_url }); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><Edit2 className="w-4 h-4 text-slate-500" /></div>
                                                        Edit QR Content
                                                    </button>
                                                    <button
                                                        onClick={() => { navigate(`/qrcodes/${qr._id}`); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><Palette className="w-4 h-4 text-slate-500" /></div>
                                                        Edit QR Design
                                                    </button>
                                                    <button
                                                        onClick={() => { setChangeTypeModal({ id: qr._id, type: qr.qr_type }); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><ArrowRightLeft className="w-4 h-4 text-slate-500" /></div>
                                                        Change QR Type
                                                    </button>

                                                    <div className="my-1.5 border-t border-slate-100"></div>

                                                    <button
                                                        onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><Copy className="w-4 h-4 text-slate-500" /></div>
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><Folder className="w-4 h-4 text-slate-500" /></div>
                                                        Send to folder
                                                    </button>

                                                    <div className="my-1.5 border-t border-slate-100"></div>

                                                    <button
                                                        onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-slate-100 rounded-md"><PauseCircle className="w-4 h-4 text-slate-500" /></div>
                                                        Pause
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveMenuId(null); handleDelete(qr._id); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                    >
                                                        <div className="p-1 bg-red-50 rounded-md"><Trash2 className="w-4 h-4 text-red-500" /></div>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            );
                        })}

                        <div className="text-sm text-slate-500 font-medium py-4 px-2">
                            Showing {filteredQRCodes.length} of {qrCodes.length} results{searchQuery && ` for "${searchQuery}"`}
                        </div>
                    </div>
                    </>
                )}
            </div>

            {/* Inline Editing Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingItem.field === 'title' ? 'Rename QR Code' : 'Edit destination URL'}
                            </h3>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 13L13 1M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                {editingItem.field === 'title' ? 'QR Code Name' : 'Complete URL'}
                            </label>
                            <input
                                type="text"
                                value={editingItem.value}
                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder={editingItem.field === 'title' ? "Enter a name" : "https://..."}
                                autoFocus
                            />
                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editingItem.value.trim()}
                                className="flex-1 py-3 px-4 bg-[#23a8f2] text-white font-bold text-sm rounded-xl hover:bg-[#1a90d4] transition-colors flex items-center justify-center shadow-md shadow-blue-200 disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Type Modal */}
            {changeTypeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="relative bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-100">
                            {/* Graphic illustration placeholder */}
                            <div className="w-64 h-32 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiM2MzY2ZjEiLz48L3N2Zz4=')]"></div>
                                <div className="z-10 bg-indigo-50 text-indigo-500 p-4 rounded-full ring-8 ring-white shadow-lg animate-bounce">
                                    <ArrowRightLeft className="w-8 h-8" />
                                </div>
                            </div>

                            <button
                                onClick={() => setChangeTypeModal(null)}
                                className="absolute top-4 right-4 bg-white text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-full shadow-sm border border-blue-100 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 13L13 1M1 1L13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                Change QR Code Type
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6">
                                Changing the QR code type is useful to update the content of your QR code without creating a new one. For instance, if your QR code currently redirects to an image gallery but you want it to redirect to a PDF, you can change the type from <strong className="text-blue-500">"{changeTypeModal.type}"</strong> to <strong className="text-blue-500">another type</strong>.
                            </p>
                            <p className="font-bold text-sm text-slate-800 mb-8 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                When you switch the type, there's no need to reprint or download the QR code again. It will be updated automatically.
                            </p>

                            {/* Type Selection Grid */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">QR Code Types</label>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 p-1">
                                    {availableTypes.map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => setChangeTypeModal({ ...changeTypeModal, type: type.id })}
                                            className={`
                                                flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all
                                                ${changeTypeModal.type === type.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm transform scale-105'
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                                                }
                                            `}
                                        >
                                            <div className="mb-2">
                                                {React.cloneElement(type.icon, { size: 24, className: changeTypeModal.type === type.id ? 'text-blue-500' : 'text-slate-500' })}
                                            </div>
                                            <span className={`text-[10px] font-bold text-center ${changeTypeModal.type === type.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {type.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSaveTypeChange}
                                    disabled={isSaving}
                                    className="flex-1 py-3.5 px-4 bg-[#23a8f2] text-white font-black text-sm rounded-xl hover:bg-[#1a90d4] transition-colors flex items-center justify-center shadow-lg shadow-blue-200 disabled:opacity-70"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckSquare className="w-5 h-5 mr-2" />
                                            Confirm
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setChangeTypeModal(null)}
                                    className="flex-1 py-3.5 px-4 bg-white border-2 border-slate-100 text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {previewModal && (() => {
                const design = previewModal.customization || {};
                const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                const shortUrl = `${baseUrl}/r/${previewModal.short_id}`;

                return (
                    <div className="fixed inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 min-h-screen z-[100]">
                        <button
                            onClick={() => setPreviewModal(null)}
                            className="absolute top-6 right-8 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-[60]"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative animate-in fade-in zoom-in duration-300 ease-out flex flex-col items-center">

                            {/* QR Canvas Container */}
                            <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex items-center justify-center shadow-sm border border-slate-100">
                                <StyledQRCode
                                    data={shortUrl}
                                    size={300}
                                    ecLevel="Q"
                                    dotStyle={design.qrStyle || 'square'}
                                    primaryColor={design.fgColor || '#000000'}
                                    bgColor={design.bgColor || '#ffffff'}
                                    cornerSquareStyle={design.eyeShape === 'circle' ? 'dot' : 'square'}
                                    cornerDotStyle={design.eyeShape === 'circle' ? 'dot' : 'square'}
                                    logo={design.logoUrl || undefined}
                                />
                            </div>

                            {/* Download Button in Preview */}
                            <button
                                onClick={() => setDownloadModal(previewModal)}
                                className="bg-[#23a8f2] hover:bg-[#1a90d4] text-white px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
                            >
                                <Download className="w-5 h-5" />
                                Download
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* DOWNLOAD FORMAT OPTIONS MODAL */}
            {downloadModal && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">

                        <div className="relative p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">
                                Download QR Code
                            </h2>
                            <button
                                onClick={() => setDownloadModal(null)}
                                className="text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg p-1.5 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Format Grid - Now 3 columns, smaller cards */}
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 mb-8">
                                {['PNG', 'JPEG', 'SVG', 'PDF', 'EPS', 'Print'].map(format => {
                                    const isSelected = downloadFormat === format;
                                    const isAvailable = ['PNG', 'JPEG', 'SVG'].includes(format);
                                    return (
                                        <div
                                            key={format}
                                            onClick={() => isAvailable && setDownloadFormat(format)}
                                            className={`
                                                relative py-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-${isAvailable ? 'pointer' : 'not-allowed'}
                                                ${isSelected
                                                    ? 'border-[#23a8f2] bg-blue-50/50 text-[#23a8f2]'
                                                    : 'border-slate-100 bg-white text-slate-400'
                                                }
                                                ${!isAvailable && 'opacity-40'}
                                            `}
                                        >
                                            {format === 'PNG' || format === 'JPEG' ? (
                                                <ImageIcon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#23a8f2]' : 'text-slate-400'}`} />
                                            ) : format === 'Print' ? (
                                                <QrCode className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#23a8f2]' : 'text-slate-400'}`} />
                                            ) : (
                                                <FileText className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#23a8f2]' : 'text-slate-400'}`} />
                                            )}
                                            <span className="font-bold text-xs">{format}</span>
                                            {isSelected && (
                                                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#23a8f2] text-white flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Controls - Compact */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">File size</label>
                                    <div className="relative">
                                        <select
                                            value={downloadSize}
                                            onChange={e => setDownloadSize(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#23a8f2]"
                                        >
                                            <option value="Default">Standard (1000px)</option>
                                            <option value="Large">High Quality (2000px)</option>
                                            <option value="Small">Web Optimized (500px)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleTriggerDownload}
                                        className="flex-1 bg-[#23a8f2] hover:bg-[#1a90d4] text-white py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Now
                                    </button>
                                    <button className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-[#23a8f2] hover:border-[#23a8f2] transition-colors">
                                        <Share className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
        )}
        </>
    );
};

export default Dashboard;
