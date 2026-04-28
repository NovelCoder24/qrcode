import React from 'react';
import {
    QrCode, Globe, FileText, List, Contact, Briefcase, Video, Image as ImageIcon,
    Facebook, Instagram, Share2, MessageCircle, Music, Phone, Mail, MapPin,
    ExternalLink, Play, Headphones, Download
} from 'lucide-react';
import StyledQRCode from '../StyledQRCode';

const typeConfig = {
    URL: { label: 'Website', icon: <Globe size={48} />, desc: 'Link to any website URL' },
    PDF: { label: 'PDF', icon: <FileText size={48} />, desc: 'Show a PDF' },
    LIST: { label: 'List of Links', icon: <List size={48} />, desc: 'Share multiple links' },
    VCARD: { label: 'vCard', icon: <Contact size={48} />, desc: 'Share a digital business card' },
    BUSINESS: { label: 'Business', icon: <Briefcase size={48} />, desc: 'Share information about your business' },
    VIDEO: { label: 'Video', icon: <Video size={48} />, desc: 'Show a video' },
    IMAGE: { label: 'Images', icon: <ImageIcon size={48} />, desc: 'Share multiple images' },
    FACEBOOK: { label: 'Facebook', icon: <Facebook size={48} />, desc: 'Share your Facebook page' },
    INSTAGRAM: { label: 'Instagram', icon: <Instagram size={48} />, desc: 'Share your Instagram' },
    SOCIAL: { label: 'Social Media', icon: <Share2 size={48} />, desc: 'Share your social channels' },
    WHATSAPP: { label: 'WhatsApp', icon: <MessageCircle size={48} />, desc: 'Get WhatsApp messages' },
    MP3: { label: 'MP3', icon: <Music size={48} />, desc: 'Share an audio file' },
    MEDIA: { label: 'Media', icon: <Play size={48} />, desc: 'Share media files' },
};

/* ─── Status bar at top of phone ─── */
const StatusBar = () => (
    <div className="h-6 w-full flex justify-between px-4 items-center text-[10px] font-bold text-slate-800 shrink-0">
        <span>9:41</span>
        <div className="flex gap-1">
            <div className="w-4 h-2 bg-slate-800 rounded-sm"></div>
            <div className="w-3 h-2 bg-slate-800 rounded-sm"></div>
        </div>
    </div>
);

/* ─── URL Preview ─── */
const URLPreview = ({ data }) => (
    <div className="flex flex-col h-full bg-white">
        <StatusBar />
        <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-indigo-50 rounded-xl p-4 mb-4 flex items-center gap-3">
                <Globe size={20} className="text-indigo-500 shrink-0" />
                <p className="text-[11px] text-indigo-700 font-semibold truncate">
                    {data?.url || 'https://example.com'}
                </p>
            </div>

            <h2 className="text-lg font-extrabold text-slate-900 mb-2">
                {data?.title || 'Website Link'}
            </h2>

            <div className="w-full aspect-video bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl mb-4 flex items-center justify-center border border-indigo-100">
                <div className="text-center">
                    <Globe size={32} className="text-indigo-300 mx-auto mb-2" />
                    <span className="text-[10px] text-indigo-400 font-medium">Website Preview</span>
                </div>
            </div>

            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <ExternalLink size={14} />
                Visit Website
            </button>
        </div>
    </div>
);

/* ─── PDF Preview ─── */
const PDFPreview = ({ data }) => (
    <div className="flex flex-col h-full bg-white">
        <StatusBar />
        <div className="flex-1 overflow-y-auto p-5">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                {data?.title || 'PDF Document'}
            </h2>
            <p className="text-[11px] text-slate-500 mb-4 font-medium">
                {data?.description || 'Tap to view the document'}
            </p>

            <div className="w-full aspect-[3/4] bg-gradient-to-b from-rose-50 to-white rounded-xl mb-4 flex flex-col items-center justify-center border border-rose-100">
                <FileText size={40} className="text-rose-300 mb-3" />
                <span className="text-xs text-rose-400 font-semibold">
                    {data?.pdfUrl ? 'PDF Uploaded' : 'No PDF yet'}
                </span>
                {data?.pdfUrl && (
                    <span className="text-[9px] text-rose-300 mt-1 px-3 truncate max-w-full">
                        {data.pdfUrl.split('/').pop()?.substring(0, 20)}...
                    </span>
                )}
            </div>

            <button className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Download size={14} />
                View PDF
            </button>
        </div>
    </div>
);

/* ─── vCard Preview ─── */
const VCardPreview = ({ data }) => (
    <div className="flex flex-col h-full bg-white">
        <StatusBar />
        <div className="flex-1 overflow-y-auto">
            {/* Hero area */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 pb-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-extrabold">
                    {(data?.firstName || 'J').charAt(0)}{(data?.lastName || 'D').charAt(0)}
                </div>
                <h2 className="text-base font-extrabold text-white">
                    {[data?.firstName, data?.lastName].filter(Boolean).join(' ') || 'John Doe'}
                </h2>
                {(data?.organization || data?.jobTitle) && (
                    <p className="text-[11px] text-emerald-100 mt-1 font-medium">
                        {[data?.jobTitle, data?.organization].filter(Boolean).join(' • ')}
                    </p>
                )}
            </div>

            {/* Contact details */}
            <div className="p-4 space-y-2.5 -mt-3">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg"><Phone size={14} className="text-emerald-600" /></div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Phone</p>
                        <p className="text-xs text-slate-800 font-semibold truncate">{data?.phone || '—'}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><Mail size={14} className="text-blue-600" /></div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Email</p>
                        <p className="text-xs text-slate-800 font-semibold truncate">{data?.email || '—'}</p>
                    </div>
                </div>
                {data?.address && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg"><MapPin size={14} className="text-amber-600" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Address</p>
                            <p className="text-xs text-slate-800 font-semibold truncate">{data.address}</p>
                        </div>
                    </div>
                )}
                {data?.website && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg"><Globe size={14} className="text-indigo-600" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Website</p>
                            <p className="text-xs text-slate-800 font-semibold truncate">{data.website}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

/* ─── WhatsApp Preview ─── */
const WhatsAppPreview = ({ data }) => (
    <div className="flex flex-col h-full bg-white">
        <StatusBar />
        {/* WhatsApp-style header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                    {data?.contactName || data?.phoneNumber || 'Contact'}
                </p>
                <p className="text-[9px] text-green-200">online</p>
            </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-[#ECE5DD] p-4 flex flex-col justify-end">
            {data?.prefillMessage && (
                <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-sm max-w-[85%] self-end shadow-sm mb-2">
                    <p className="text-[11px] text-slate-800 leading-relaxed">{data.prefillMessage}</p>
                    <p className="text-[8px] text-slate-400 mt-1 text-right">now</p>
                </div>
            )}
            {!data?.prefillMessage && (
                <div className="text-center py-6">
                    <p className="text-[10px] text-slate-400 italic">Pre-fill message will appear here...</p>
                </div>
            )}
        </div>

        {/* Input bar */}
        <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-2">
                <p className="text-[10px] text-slate-400">Type a message...</p>
            </div>
            <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center">
                <MessageCircle size={12} className="text-white" />
            </div>
        </div>
    </div>
);

/* ─── Social Media Preview ─── */
const SocialPreview = ({ data }) => {
    const links = data?.socialLinks?.filter(l => l.url && l.url.trim()) || [];
    return (
        <div className="flex flex-col h-full bg-white">
            <StatusBar />
            <div className="flex-1 overflow-y-auto">
                {/* Profile section */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-center">
                    <div className="w-14 h-14 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Share2 size={22} className="text-white" />
                    </div>
                    <h2 className="text-sm font-extrabold text-white">
                        {data?.title || 'My Social Links'}
                    </h2>
                    {data?.bio && (
                        <p className="text-[10px] text-blue-100 mt-1.5 max-w-[200px] mx-auto">{data.bio}</p>
                    )}
                </div>

                {/* Social links list */}
                <div className="p-4 space-y-2">
                    {links.length > 0 ? links.map((link, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                <ExternalLink size={14} className="text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 capitalize">{link.platform || 'Link'}</p>
                                <p className="text-[9px] text-slate-400 truncate">{link.url}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8">
                            <Share2 size={24} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] text-slate-400">Add social links to preview</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── Media Preview ─── */
const MediaPreview = ({ data }) => {
    const mediaType = data?.mediaType || 'image';
    return (
        <div className="flex flex-col h-full bg-white">
            <StatusBar />
            <div className="flex-1 overflow-y-auto p-5">
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                    {data?.title || 'Media Gallery'}
                </h2>
                <p className="text-[11px] text-slate-500 mb-4 font-medium">
                    {mediaType === 'image' ? 'Image Gallery' : mediaType === 'video' ? 'Video Player' : 'Audio Player'}
                </p>

                {mediaType === 'image' && (
                    <div className="space-y-2">
                        {(data?.images && data.images.length > 0) ? data.images.slice(0, 3).map((img, i) => (
                            <div key={i} className="w-full aspect-video bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center">
                                {img?.url ? (
                                    <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <ImageIcon size={24} className="text-purple-300" />
                                )}
                            </div>
                        )) : (
                            <div className="w-full aspect-video bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center">
                                <div className="text-center">
                                    <ImageIcon size={28} className="text-purple-200 mx-auto mb-1" />
                                    <span className="text-[10px] text-purple-300">Add images</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mediaType === 'video' && (
                    <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Play size={20} className="text-white ml-0.5" />
                            </div>
                            <p className="text-[10px] text-white/60 truncate max-w-[180px]">
                                {data?.videoUrl ? 'Video ready' : 'Add a video URL'}
                            </p>
                        </div>
                    </div>
                )}

                {mediaType === 'audio' && (
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-purple-100 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <Headphones size={24} className="text-purple-500" />
                        </div>
                        <p className="text-xs font-bold text-purple-700 mb-1">Audio Player</p>
                        <p className="text-[10px] text-purple-400 truncate max-w-[180px] mx-auto">
                            {data?.audioUrl || 'Add an audio URL'}
                        </p>
                        <div className="mt-4 h-1 bg-purple-100 rounded-full">
                            <div className="h-1 bg-purple-400 rounded-full w-1/3"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Main PhoneMockup ─── */
const PhoneMockup = ({ type, data, step, design }) => {
    const activeType = typeConfig[type] || typeConfig.URL;

    const renderStep2Preview = () => {
        switch (type) {
            case 'URL':      return <URLPreview data={data} />;
            case 'PDF':      return <PDFPreview data={data} />;
            case 'VCARD':    return <VCardPreview data={data} />;
            case 'WHATSAPP': return <WhatsAppPreview data={data} />;
            case 'SOCIAL':   return <SocialPreview data={data} />;
            case 'MEDIA':    return <MediaPreview data={data} />;
            default:         return <URLPreview data={data} />;
        }
    };

    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-white flex flex-col overflow-hidden">

                    {/* Step 1: Type selection state */}
                    {step === 1 && (
                        <div className="w-full h-full bg-slate-100 p-6 flex flex-col items-center justify-center text-center">
                            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-200">
                                <div className="w-24 h-24 flex items-center justify-center bg-indigo-50 text-indigo-500 rounded-lg overflow-hidden">
                                    <div className="transform scale-75">
                                        {activeType.icon}
                                    </div>
                                </div>
                            </div>
                            <h4 className="font-extrabold text-slate-800 mb-2">{activeType.label}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{activeType.desc}</p>
                        </div>
                    )}

                    {/* Step 2: Live content preview */}
                    {step === 2 && renderStep2Preview()}

                    {/* Step 3: QR design preview */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-full p-6" style={{ backgroundColor: design?.bgColor || '#ffffff' }}>
                            <h3 className="text-slate-800 font-bold mb-6" style={{ color: design?.bgColor && design.bgColor !== '#ffffff' ? '#ffffff' : undefined }}>Scan to View</h3>
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <StyledQRCode
                                    data={data?.url || data?.pdfUrl || 'https://qr-code.io'}
                                    size={180}
                                    ecLevel="H"
                                    primaryColor={design?.fgColor || '#000000'}
                                    fgColor2={design?.fgColor2}
                                    gradientType={design?.gradientType}
                                    bgColor={design?.bgColor || '#ffffff'}
                                    dotStyle={design?.qrStyle || 'square'}
                                    cornerSquareStyle={design?.eyeShape || 'square'}
                                    cornerDotStyle={design?.eyeShape || 'square'}
                                    eyeColor={design?.eyeColor}
                                    logo={design?.logoUrl || undefined}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 text-center max-w-[200px]" style={{ color: design?.bgColor && design.bgColor !== '#ffffff' ? '#ffffff80' : undefined }}>
                                Live preview — changes update instantly
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PhoneMockup;
