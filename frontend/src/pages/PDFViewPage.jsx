import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Loader2, AlertCircle, QrCode, ExternalLink } from 'lucide-react';
import axios from 'axios';

const PDFViewPage = () => {
    const { shortId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${apiBase}/r/info/${shortId}`);
                setQrData(data);
            } catch (err) {
                setError(err.response?.data?.message || 'This QR code could not be found.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shortId, apiBase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                    <p className="text-slate-500 text-sm">{error || 'This QR code does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (!qrData.isActive) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <AlertCircle className="w-14 h-14 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Inactive</h1>
                    <p className="text-slate-500 text-sm">This QR code has been deactivated by the owner.</p>
                </div>
            </div>
        );
    }

    const primaryColor = qrData.customization?.fgColor || '#4F46E5';

    // Get the PDF URL for viewing (remove fl_attachment if present)
    const pdfViewUrl = qrData.target_url.replace('/fl_attachment/', '/');
    const downloadUrl = qrData.target_url.replace('/upload/', '/upload/fl_attachment/');

    // Mobile view - card style with buttons
    if (isMobile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                        {/* Top Color Band */}
                        <div
                            className="h-1.5 w-full"
                            style={{ background: `linear-gradient(90deg, ${primaryColor}, #6366f1)` }}
                        />

                        {/* Content */}
                        <div className="p-6 text-center">
                            {/* Company */}
                            {qrData.company && (
                                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                                    {qrData.company}
                                </p>
                            )}

                            {/* PDF Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                            </div>

                            {/* Title */}
                            <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
                                {qrData.title}
                            </h1>

                            {/* Description */}
                            {qrData.description && (
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {qrData.description}
                                </p>
                            )}

                            {!qrData.description && <div className="mb-6" />}

                            {/* Buttons */}
                            <div className="space-y-3">
                                <a
                                    href={pdfViewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View PDF
                                </a>
                                <a
                                    href={downloadUrl}
                                    download
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm border-2 active:scale-[0.98] transition-transform"
                                    style={{ borderColor: primaryColor, color: primaryColor }}
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                        <div className="bg-indigo-600 p-1 rounded">
                            <QrCode className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold">
                            Powered by <span className="text-indigo-600">QRVibe</span>
                        </span>
                    </div>
                </footer>
            </div>
        );
    }

    // Desktop view - iframe with header
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${primaryColor}15` }}
                        >
                            <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight truncate">
                                {qrData.title}
                            </h1>
                            {qrData.company && (
                                <p className="text-xs text-slate-500 truncate">{qrData.company}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={pdfViewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 py-2 px-3 rounded-lg text-slate-600 font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden md:inline">Open in New Tab</span>
                        </a>
                        <a
                            href={downloadUrl}
                            download
                            className="inline-flex items-center gap-2 py-2 px-3 md:px-4 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1">
                <iframe
                    src={`${pdfViewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={qrData.title}
                    style={{ minHeight: 'calc(100vh - 120px)' }}
                />
            </div>

            {/* Footer */}
            <footer className="py-2 text-center bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <div className="bg-indigo-600 p-1 rounded">
                        <QrCode className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold">
                        Powered by <span className="text-indigo-600">QRVibe</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default PDFViewPage;
