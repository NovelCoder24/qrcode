import React from 'react';
import {
    QrCode, Globe, FileText, List, Contact, Briefcase, Video, Image as ImageIcon,
    Facebook, Instagram, Share2, MessageCircle, Music
} from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';

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
};

const PhoneMockup = ({ type, data, step, design }) => {
    // Default colors if not selected
    const primaryColor = data?.primaryColor || '#000000';
    const buttonColor = data?.buttonColor || '#F97316'; // Default orange like screenshot
    const activeType = typeConfig[type] || typeConfig.URL;

    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800 flex flex-col items-center justify-center relative">
                {/* Screen Content */}
                <div className="absolute inset-0 bg-white flex flex-col overflow-hidden">

                    {/* CASE 1: Initial State (Step 1) */}
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

                    {/* CASE 2: PDF Preview (Step 2 Only) */}
                    {type === 'PDF' && step === 2 && (
                        <div className="flex flex-col h-full bg-white relative">
                            {/* StatusBar Mock */}
                            <div className="h-6 w-full flex justify-between px-4 items-center text-[10px] font-bold text-slate-800">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-2 bg-slate-800 rounded-sm"></div>
                                    <div className="w-3 h-2 bg-slate-800 rounded-sm"></div>
                                </div>
                            </div>

                            {/* Main Landing Page Content */}
                            <div className="flex-1 overflow-y-auto pb-8 relative z-10">
                                {/* Header / Company Name */}
                                <div className="p-6 text-center">
                                    <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500 mb-8">
                                        {data?.company || 'Company Name'}
                                    </h2>

                                    {/* Main Title */}
                                    <h1 className="text-3xl font-bold leading-tight mb-4" style={{ color: primaryColor }}>
                                        {data?.title || 'Bookkeeping Experts'}
                                    </h1>

                                    {/* Description */}
                                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                        {data?.description || 'Learn about how we can help with all your business accounting needs.'}
                                    </p>

                                    {/* Image Placeholder */}
                                    <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg mb-8 flex items-center justify-center border-2 border-dashed border-slate-200">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 flex items-center justify-center shadow-sm">
                                                <QrCode size={20} className="text-slate-300" />
                                            </div>
                                            <span className="text-xs text-slate-400">PDF Preview</span>
                                        </div>
                                    </div>

                                    {/* The Action Button */}
                                    <button
                                        className="w-full py-3 rounded-lg text-white font-bold shadow-lg transform transition-transform active:scale-95"
                                        style={{ backgroundColor: buttonColor }}
                                    >
                                        View PDF
                                    </button>
                                </div>
                            </div>

                            {/* Decorative Curve (Optional) */}
                            <div className="absolute top-[40%] left-0 w-full h-24 bg-teal-500/10 -skew-y-6 -z-0"></div>
                        </div>
                    )}

                    {/* CASE 3: URL/Other Preview */}
                    {type !== 'PDF' && step === 2 && (
                        <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
                            <p className="text-slate-400 text-sm">Preview for {type}</p>
                        </div>
                    )}

                    {/* CASE 4: QR Design Preview (Step 3) */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-full p-6 bg-white">
                            <h3 className="text-slate-800 font-bold mb-8">Scan to View</h3>
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                <QRCode
                                    value={data?.url || data?.pdfUrl || 'https://qr-code.io'}
                                    size={180}
                                    ecLevel="H"
                                    fgColor={design?.fgColor}
                                    bgColor={design?.bgColor}
                                    qrStyle={design?.qrStyle}
                                    eyeRadius={design?.eyeShape === 'circle' ? 10 : 0}
                                    logoImage={design?.logoUrl || undefined}
                                    logoWidth={30}
                                    logoHeight={30}
                                    logoPaddingStyle="circle"
                                    logoPadding={2}
                                    removeQrCodeBehindLogo={true}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-6 text-center max-w-[200px]">
                                This is a live preview of your QR design.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PhoneMockup;
