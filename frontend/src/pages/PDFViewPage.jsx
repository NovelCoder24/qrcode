import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Loader2, AlertCircle, QrCode, ExternalLink, Eye } from 'lucide-react';
import axios from 'axios';

const PDFViewPage = () => {
    const { shortId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
            <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                    <p className="text-slate-500 text-sm">{error || 'This QR code does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (!qrData.isActive) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Inactive</h1>
                    <p className="text-slate-500 text-sm">This QR code has been deactivated by the owner.</p>
                </div>
            </div>
        );
    }

    const primaryColor = qrData.customization?.fgColor || '#4F46E5';
    const pdfViewUrl = qrData.target_url.replace('/fl_attachment/', '/');
    const downloadUrl = qrData.target_url.replace('/upload/', '/upload/fl_attachment/');

    return (
        <div className="h-screen h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-3 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
                    {/* Left - Icon & Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${primaryColor}15` }}
                        >
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate pr-2">
                                {qrData.title}
                            </h1>
                            {qrData.company && (
                                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{qrData.company}</p>
                            )}
                        </div>
                    </div>

                    {/* Right - Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {/* Open in New Tab - Desktop */}
                        <a
                            href={pdfViewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 py-2 px-3 rounded-lg text-slate-600 font-medium text-xs sm:text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden md:inline">New Tab</span>
                        </a>
                        {/* Download Button */}
                        <a
                            href={downloadUrl}
                            download
                            className="inline-flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Download</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 min-h-0 overflow-auto">
                {/* Desktop - PDF Viewer */}
                <div className="hidden md:block h-full">
                    <iframe
                        src={`${pdfViewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                        className="w-full h-full border-0"
                        title={qrData.title}
                    />
                </div>

                {/* Mobile - Card View */}
                <div className="md:hidden h-full flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-[340px] overflow-hidden">
                        {/* Color Band */}
                        <div
                            className="h-1.5 w-full"
                            style={{ background: `linear-gradient(90deg, ${primaryColor}, #8B5CF6)` }}
                        />

                        {/* Card Content */}
                        <div className="p-5 sm:p-6 text-center">
                            {/* Company Badge */}
                            {qrData.company && (
                                <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-4">
                                    {qrData.company}
                                </span>
                            )}

                            {/* PDF Icon */}
                            <div
                                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: `${primaryColor}12` }}
                            >
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: primaryColor }} />
                            </div>

                            {/* Title */}
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-tight px-2">
                                {qrData.title}
                            </h2>

                            {/* Description */}
                            {qrData.description && (
                                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 line-clamp-2">
                                    {qrData.description}
                                </p>
                            )}

                            {!qrData.description && <div className="mb-5" />}

                            {/* Action Buttons */}
                            <div className="space-y-2.5">
                                <a
                                    href={pdfViewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Eye className="w-4 h-4" />
                                    View PDF
                                </a>
                                <a
                                    href={downloadUrl}
                                    download
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm border-2 bg-white active:scale-[0.98] transition-transform"
                                    style={{ borderColor: primaryColor, color: primaryColor }}
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </a>
                            </div>

                            {/* File Badge */}
                            <p className="text-[10px] text-slate-400 mt-4 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                PDF Document
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 py-2.5 flex-shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <div className="bg-indigo-600 p-1 rounded">
                        <QrCode className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium">
                        Powered by <span className="text-indigo-600 font-semibold">QRVibe</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default PDFViewPage;
