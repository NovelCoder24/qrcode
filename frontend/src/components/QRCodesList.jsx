import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, ScanLine, Zap, PlusCircle, ChevronDown, QrCode, Download,
    MoreHorizontal, Loader2, Trash2, Edit2, Calendar, Folder, ExternalLink, PencilLine, Image as ImageIcon,
    Square, CheckSquare, Palette, ArrowRightLeft, Copy, PauseCircle, PlayCircle, X, Check, Share,
    Globe, FileText, Contact, Share2, MessageCircle, Film,
    PartyPopper, Link as LinkIcon, LogOut, CreditCard, Settings, BarChart3, ChevronRight, Eye,
    Lock, AlertTriangle, CheckCircle2, XCircle, Plus, Info
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useSelector } from 'react-redux';
import StyledQRCode from './StyledQRCode';
import UpgradeModal from './UpgradeModal';
import api from '../api/axios';


function formatNumber(value) {
    return new Intl.NumberFormat('en-IN').format(value || 0);
}

function getQrTitle(qr) {
    return qr?.metadata?.title || qr?.title || 'Untitled QR';
}

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

const QRCodesList = () => {
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
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [upgradeModalType, setUpgradeModalType] = useState('locked');
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

    // Filter QR codes based on search query, type, and status
    const filteredQRCodes = qrCodes.filter(qr => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
            (qr.metadata?.title || '').toLowerCase().includes(query) ||
            (qr.target_url || '').toLowerCase().includes(query) ||
            (qr.short_id || '').toLowerCase().includes(query);
            
        const matchesType = typeFilter === 'all' || qr.qr_type === typeFilter;
        
        let status = 'healthy';
        if (!qr.isActive) status = 'paused';
        else if (qr.accessMode === 'static_locked') status = 'locked';
        else if (qr.health_status === 'broken') status = 'broken';
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'healthy' && status === 'healthy') ||
            (statusFilter === 'paused' && status === 'paused') ||
            (statusFilter === 'broken' && status === 'broken') ||
            (statusFilter === 'locked' && status === 'locked');
            
        const folderId = searchParams.get('folder');
        const matchesFolder = !folderId || qr.folder_id === folderId;
            
        return matchesSearch && matchesType && matchesStatus && matchesFolder;
    });

    const activeDynamicCodes = filteredQRCodes.filter(qr => qr.accessMode !== 'static_locked');
    const lockedStaticCodes = filteredQRCodes.filter(qr => qr.accessMode === 'static_locked');

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

    const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const handleToggleActive = async (qr) => {
        try {
            const nextActive = !qr.isActive;
            await api.put(`/qrcodes/${qr._id}`, { isActive: nextActive });
            setQrCodes(prev => prev.map(q => {
                if (q._id === qr._id) {
                    return { ...q, isActive: nextActive };
                }
                return q;
            }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
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

            await api.put(`/qrcodes/${editingItem.id}`, payload);

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
            await api.put(`/qrcodes/${changeTypeModal.id}`, { qr_type: changeTypeModal.type });

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
                    type: (design.qrStyle === 'squares' ? 'square' : design.qrStyle) || 'square',
                    ...(design.gradientType && design.gradientType !== 'none' && design.fgColor2 ? {
                        gradient: {
                            type: design.gradientType,
                            rotation: 0.785398, // 45 degrees
                            colorStops: [
                                { offset: 0, color: design.fgColor || '#000000' },
                                { offset: 1, color: design.fgColor2 }
                            ]
                        }
                    } : {})
                },
                backgroundOptions: {
                    color: design.bgColor || '#ffffff',
                },
                cornersSquareOptions: {
                    type: design.eyeShape || 'square',
                    color: design.eyeColor || undefined,
                },
                cornersDotOptions: {
                    type: design.eyeShape || 'square',
                    color: design.eyeColor || undefined,
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
    const dynamicActiveCount = qrCodes.filter(qr => qr.accessMode !== 'static_locked' && qr.isActive).length;
    const staticLockedCount = qrCodes.filter(qr => qr.accessMode === 'static_locked').length;
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

    const warningBanner = lockedStaticCodes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 w-6 h-6 mt-0.5 sm:mt-0" />
                <div className="text-sm">
                    <p className="font-bold text-slate-800">Your Pro trial has expired.</p>
                    <p className="text-slate-600">We kept your top 5 most scanned QR codes fully dynamic. Your other QR codes are locked to their current link and analytics are paused.</p>
                </div>
            </div>
            <button onClick={() => navigate('/billing')} className="whitespace-nowrap px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-md shadow-sm transition-colors text-sm shrink-0 w-full sm:w-auto">
                Upgrade to Unlock All
            </button>
        </div>
    );

    return (
        <>
        {/* Mobile View */}
        <div className="md:hidden min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

            {loading ? <LoadingSkeleton /> : (
            <main className="max-w-md mx-auto px-4 pt-6">
                {warningBanner}
                {/* Welcome Section */}
                <section className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">My QR Codes</h1>
                            <p className="text-slate-500 text-sm font-medium">Manage destinations, downloads, and printed-code safety.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm shrink-0">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center">
                        <div className="bg-slate-100 text-slate-700 p-2 rounded-md mb-2 flex items-center justify-center">
                            <BarChart3 size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{totalScans.toLocaleString()}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Scans</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md mb-2 flex items-center justify-center">
                            <Zap size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{dynamicActiveCount}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Dynamic</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center">
                        <div className="bg-amber-50 text-amber-600 p-2 rounded-md mb-2 flex items-center justify-center">
                            <Lock size={18} />
                        </div>
                        <span className="text-xl font-bold leading-none mb-1">{staticLockedCount}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Static</span>
                    </div>
                </section>

                {/* Action Bar */}
                <section className="mb-6 space-y-4">
                    <button onClick={() => navigate('/create')} className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <PlusCircle size={20} strokeWidth={3} />
                        Create New Code
                    </button>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search your codes..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </section>

                {/* QR List Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">{lockedStaticCodes.length > 0 ? "Dynamic QR Codes" : "All QR Codes"}</h2>
                        <button className="text-slate-600 hover:text-slate-950 text-sm font-bold flex items-center" onClick={() => navigate('/analytics')}>
                            Analytics <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {activeDynamicCodes.map((qr) => {
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




                            return (
                                <div 
                                    key={qr._id} 
                                    onClick={(e) => {
                                        // On mobile, prevent navigation if clicking directly on action buttons or menus
                                        if (e.target.closest('button') || e.target.closest('[data-menu-dropdown]') || e.target.closest('[data-menu-trigger]') || activeMenuId === qr._id) {
                                            e.stopPropagation();
                                            return;
                                        }
                                        navigate(`/qrcodes/${qr._id}`);
                                    }} 
                                    className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-shadow group flex cursor-pointer relative"
                                >
                                    <div className="flex gap-4 w-full">
                                        {/* Visual Preview Area */}
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewModal(qr);
                                            }}
                                            className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center relative shrink-0 overflow-hidden hover:bg-white hover:border-slate-300 transition-all group/qr cursor-zoom-in"
                                            title="Click to view design"
                                        >
                                            <QrCode size={28} className="text-slate-900 group-hover/qr:text-slate-600 transition-colors" />
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover/qr:bg-slate-900/5 flex items-center justify-center transition-all">
                                                <Eye size={16} className="text-white opacity-0 group-hover/qr:opacity-100 translate-y-1 group-hover/qr:translate-y-0 transition-all" />
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 truncate pr-2">{qr.metadata?.title || 'Untitled QR Code'}</h3>
                                                <button 
                                                    data-menu-trigger="true"
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setActiveMenuId(activeMenuId === qr._id ? null : qr._id); 
                                                    }} 
                                                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">
                                                    {qr.qr_type || 'URL'}
                                                </span>
                                                <span>|</span>
                                                <span className="truncate max-w-[120px]">{qr.target_url?.replace('https://', '')}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Scans</span>
                                                        <span className="text-sm font-extrabold text-emerald-600">{qr.stats?.total_scans || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Created</span>
                                                        <span className="text-sm font-medium text-slate-600">{new Date(qr.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); setDownloadModal(qr); }} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-950 rounded-md transition-colors border border-slate-200">
                                                        <Download size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(qr.target_url, '_blank'); }} className="p-2 bg-slate-950 hover:bg-slate-800 text-white rounded-md transition-colors border border-slate-950">
                                                        <ExternalLink size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activeDynamicCodes.length === 0 && lockedStaticCodes.length === 0 && (
                            <div className="text-center py-8 text-slate-500">No QR codes found.</div>
                        )}

                        {lockedStaticCodes.length > 0 && (
                            <>
                                <div className="mt-8 mb-4 px-1">
                                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-amber-500" />
                                        Locked Static Codes
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">These still scan but editing and analytics are paused. <button onClick={() => navigate('/billing')} className="text-slate-900 underline font-bold">Upgrade to unlock</button>.</p>
                                </div>
                                {lockedStaticCodes.map((qr) => (
                                    <div key={qr._id} onClick={() => { setUpgradeModalType('locked'); setUpgradeModalOpen(true); }} className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm opacity-90 flex cursor-pointer relative">
                                        <div className="flex gap-4 w-full">
                                            <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                                                <QrCode size={28} className="text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-slate-700 truncate pr-2">{qr.metadata?.title || 'Untitled QR Code'}</h3>
                                                    <Lock size={16} className="text-amber-500 shrink-0" />
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
                                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">{qr.qr_type || 'URL'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded-md">LOCKED PLAN LIMIT</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
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
        <>
        <div className="hidden md:block p-6 md:p-8 bg-slate-50 min-h-full">
            {/* Header section exactly as designed in mockup */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My QR Codes</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage and monitor all your QR codes in one place.</p>
                </div>
                <button
                    onClick={() => navigate('/create')}
                    className="font-bold bg-slate-900 text-white hover:bg-slate-800 text-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                    <Plus className="w-4 h-4 animate-in fade-in" />
                    <span>Create QR Code</span>
                </button>
            </div>

            {/* Warning Banner styled as ⓘ Static Locked */}
            {lockedStaticCodes.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-600 shadow-sm mb-6">
                    <Info className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <div>
                        <span className="font-bold text-slate-800 mr-1">Static Locked</span>
                        <span>QR codes still scan and redirect to their last saved link, but editing and analytics are paused. Upgrade to Dynamic to unlock full features.</span>
                    </div>
                </div>
            )}

            {/* Main Table Card Container */}
            <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-6 space-y-6">
                {/* Search & Filter bar row */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Search field */}
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search QR codes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-slate-400 font-semibold text-slate-700"
                        />
                    </div>
                    {/* Status & Type Selectors */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-slate-400"
                        >
                            <option value="all">All Status</option>
                            <option value="healthy">Healthy</option>
                            <option value="paused">Paused</option>
                            <option value="broken">Broken</option>
                            <option value="locked">Static Locked</option>
                        </select>

                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-slate-400"
                        >
                            <option value="all">All Types</option>
                            <option value="URL">Website</option>
                            <option value="PDF">PDF</option>
                            <option value="VCARD">vCard</option>
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="SOCIAL">Social Media</option>
                            <option value="MEDIA">Media</option>
                        </select>
                    </div>
                </div>

                {/* Table list */}
                {error ? (
                    <div className="p-8 text-center text-red-500 font-medium bg-white rounded-lg border border-slate-100 shadow-sm">{error}</div>
                ) : qrCodes.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
                        <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-700 mb-1">No QR codes yet</h4>
                        <p className="text-slate-400 text-sm mb-6">Create your first QR code to start tracking scans.</p>
                    </div>
                ) : filteredQRCodes.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="font-bold text-slate-700 mb-1">No results found</h4>
                        <p className="text-slate-400 text-sm mb-6">No QR codes match "{searchQuery}"</p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className={`min-h-[360px] ${activeMenuId ? 'overflow-visible' : 'overflow-x-auto'}`}>
                        <table className="w-full text-left text-sm border-collapse min-w-[750px]">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-4 pl-4 pr-3 text-left w-10">
                                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                                            {selectedQRs.size === filteredQRCodes.length && filteredQRCodes.length > 0 ? (
                                                <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                                            ) : (
                                                <Square className="w-4.5 h-4.5" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="py-4 px-3 text-left font-bold">QR Code</th>
                                    <th className="py-4 px-3 text-left font-bold">Type</th>
                                    <th className="py-4 px-3 text-left font-bold">Destination</th>
                                    <th className="py-4 px-3 text-left font-bold">Status</th>
                                    <th className="py-4 px-3 text-right font-bold pr-6">Scans</th>
                                    <th className="py-4 px-3 text-left font-bold">Last Scanned</th>
                                    <th className="py-4 pl-3 pr-4 text-right w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQRCodes.map((qr, index) => {
                                    const isSelected = selectedQRs.has(qr._id);
                                    
                                    // Status check
                                    let statusType = 'healthy';
                                    if (!qr.isActive) statusType = 'paused';
                                    else if (qr.accessMode === 'static_locked') statusType = 'locked';
                                    else if (qr.health_status === 'broken') statusType = 'broken';

                                    // Dynamic open above direction logic for dropdown
                                    const openAbove = index >= 3 && index >= filteredQRCodes.length - 2;

                                    return (
                                        <tr key={qr._id} className="hover:bg-slate-50/40 text-[13px] text-slate-600 font-semibold animate-in fade-in duration-200">
                                            {/* Checkbox */}
                                            <td className="py-4 pl-4 pr-3 text-left">
                                                <button onClick={() => toggleSelect(qr._id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    {isSelected ? <CheckSquare className="w-4.5 h-4.5 text-indigo-600" /> : <Square className="w-4.5 h-4.5" />}
                                                </button>
                                            </td>

                                            {/* Title / QR Icon */}
                                            <td className="py-4 px-3">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        onClick={() => setPreviewModal(qr)}
                                                        className="w-10 h-10 shrink-0 border border-slate-150 rounded-lg bg-slate-50 flex items-center justify-center cursor-zoom-in hover:bg-white transition-colors"
                                                        title="Click to view design"
                                                    >
                                                        <QrCode className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-900 truncate max-w-[200px] block">{getQrTitle(qr)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="py-4 px-3 text-slate-500 uppercase text-[10px] tracking-wide font-black">
                                                {qr.qr_type}
                                            </td>

                                            {/* Destination */}
                                            <td className="py-4 px-3">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="truncate text-slate-400 font-medium max-w-[220px]">{qr.target_url}</span>
                                                    <a href={qr.target_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700 flex-shrink-0">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-3">
                                                {statusType === 'paused' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span>Paused</span>
                                                    </span>
                                                )}
                                                {statusType === 'locked' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                                                        <Lock className="w-3 h-3" />
                                                        <span>Static Locked</span>
                                                    </span>
                                                )}
                                                {statusType === 'broken' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wide">
                                                        <XCircle className="w-3 h-3" />
                                                        <span>Broken</span>
                                                    </span>
                                                )}
                                                {statusType === 'healthy' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Healthy</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Scans */}
                                            <td className="py-4 px-3 text-right font-bold text-slate-900 text-[13px] pr-6">
                                                {formatNumber(qr.stats?.total_scans)}
                                            </td>

                                            {/* Last Scanned */}
                                            <td className="py-4 px-3 text-slate-500 font-semibold text-[12px]">
                                                {qr.stats?.last_scanned_at ? new Date(qr.stats.last_scanned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never scanned'}
                                            </td>

                                            {/* Options dropdown */}
                                            <td className="py-4 pl-3 pr-4 text-right relative">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/qrcodes/${qr._id}`);
                                                        }}
                                                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                                                        Detail
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === qr._id ? null : qr._id);
                                                        }}
                                                        className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center justify-center ${activeMenuId === qr._id ? 'bg-slate-100 text-slate-900' : ''}`}
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {activeMenuId === qr._id && (
                                                    <div
                                                        className={`absolute right-4 w-44 bg-white rounded-lg border border-slate-100 py-1.5 z-50 ${
                                                            openAbove 
                                                                ? "bottom-full mb-1 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]" 
                                                                : "top-full mt-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
                                                        }`}
                                                        onClick={(e) => e.stopPropagation()} // Keep open if clicking inside
                                                    >
                                                        <button
                                                            onClick={() => { navigate(`/create?step=2&edit=${qr._id}`); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingItem({ id: qr._id, field: 'title', value: qr.metadata?.title || '' }); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <PencilLine className="w-3.5 h-3.5 text-slate-400" />
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                            Duplicate
                                                        </button>
                                                        <button
                                                            onClick={() => { setDownloadModal(qr); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5 text-slate-400" />
                                                            Download
                                                        </button>
                                                        <button
                                                            onClick={() => { window.open(`${baseUrl}/r/${qr.short_id}`, '_blank'); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                                            open link
                                                        </button>
                                                        <button
                                                            onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Folder className="w-3.5 h-3.5 text-slate-400" />
                                                            move to folder
                                                        </button>
                                                        <button
                                                            onClick={() => { handleToggleActive(qr); setActiveMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            {qr.isActive ? <PauseCircle className="w-3.5 h-3.5 text-slate-400" /> : <PlayCircle className="w-3.5 h-3.5 text-slate-400" />}
                                                            {qr.isActive ? 'Pause' : 'Resume'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveMenuId(null); handleDelete(qr._id); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Results count */}
                {filteredQRCodes.length > 0 && (
                    <div className="pt-5 border-t border-slate-100 text-xs font-semibold text-slate-400">
                        Showing {filteredQRCodes.length} of {qrCodes.length} results{searchQuery && ` for "${searchQuery}"`}
                    </div>
                )}
            </div>
        </div>
        </>
        )}

        {/* Mobile Bottom Sheet Menu - only visible on mobile */}
        <div className="md:hidden">
            {/* Overlay */}
            {activeMenuId && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                    onClick={() => setActiveMenuId(null)}
                />
            )}
            
            {/* Bottom Sheet */}
            <div 
                data-menu-dropdown="true"
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[70] transition-transform duration-300 ease-out transform ${
                    activeMenuId ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {activeMenuId && (() => {
                    const qr = qrCodes.find(q => q._id === activeMenuId);
                    if (!qr) return null;
                    return (
                        <div className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                            </div>
                            
                            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                                    {qr.qr_type || 'URL'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-900 truncate">{qr.metadata?.title || 'Untitled'}</h3>
                                    <p className="text-xs text-slate-500 truncate">{qr.target_url}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => { navigate(`/create?step=2&edit=${qr._id}`); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><Edit2 className="w-5 h-5 text-slate-600" /></div>
                                    Edit
                                </button>
                                <button
                                    onClick={() => { setEditingItem({ id: qr._id, field: 'title', value: qr.metadata?.title || '' }); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><PencilLine className="w-5 h-5 text-slate-600" /></div>
                                    Rename
                                </button>
                                <button
                                    onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><Copy className="w-5 h-5 text-slate-600" /></div>
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => { setDownloadModal(qr); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><Download className="w-5 h-5 text-slate-600" /></div>
                                    Download
                                </button>
                                <button
                                    onClick={() => { window.open(`${baseUrl}/r/${qr.short_id}`, '_blank'); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><ExternalLink className="w-5 h-5 text-slate-600" /></div>
                                    open link
                                </button>
                                <button
                                    onClick={() => { alert('Feature coming soon!'); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg"><Folder className="w-5 h-5 text-slate-600" /></div>
                                    move to folder
                                </button>
                                <button
                                    onClick={() => { handleToggleActive(qr); setActiveMenuId(null); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        {qr.isActive ? <PauseCircle className="w-5 h-5 text-slate-600" /> : <PlayCircle className="w-5 h-5 text-slate-600" />}
                                    </div>
                                    {qr.isActive ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                    onClick={() => { setActiveMenuId(null); handleDelete(qr._id); }}
                                    className="w-full text-left px-4 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-4 rounded-xl"
                                >
                                    <div className="p-2 bg-red-50 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></div>
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
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
                                    fgColor2={design.fgColor2}
                                    gradientType={design.gradientType}
                                    bgColor={design.bgColor || '#ffffff'}
                                    cornerSquareStyle={design.eyeShape || 'square'}
                                    cornerDotStyle={design.eyeShape || 'square'}
                                    eyeColor={design.eyeColor}
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
        
        <UpgradeModal 
            isOpen={upgradeModalOpen} 
            onClose={() => setUpgradeModalOpen(false)} 
            type={upgradeModalType} 
        />
        </>
    );
};

export default QRCodesList;
