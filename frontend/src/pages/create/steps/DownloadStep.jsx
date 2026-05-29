import React, { useRef, useState } from 'react';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import StyledQRCode from '../../../components/StyledQRCode';

const DownloadStep = ({ qrData, qrType, design }) => {
    const qrRef = useRef();
    const [copied, setCopied] = useState(false);

    if (!qrData) {
        return (
            <div className="w-full flex flex-col items-center py-12">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Generating your QR code...</p>
            </div>
        );
    }

    const shortUrl = `${window.location.origin}/q/${qrData.short_id || qrData._id || 'demo'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format) => {
        if (qrRef.current) {
            qrRef.current.download(format, `QR-${qrType}-${Date.now()}`);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your QR Code is Ready!</h2>
                <p className="text-slate-500 text-sm">
                    Download it now or find it later in your dashboard.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Left Side: Large Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <StyledQRCode
                            ref={qrRef}
                            data={qrData.target_url || 'https://qrvibe.com'}
                            size={240}
                            logo={design?.logoUrl}
                            primaryColor={design?.fgColor}
                            fgColor2={design?.fgColor2}
                            gradientType={design?.gradientType}
                            bgColor={design?.bgColor}
                            dotStyle={design?.qrStyle}
                            cornerSquareStyle={design?.eyeShape}
                            cornerDotStyle={design?.eyeShape}
                            eyeColor={design?.eyeColor}
                        />
                    </div>
                </div>

                {/* Right Side: Download & Actions */}
                <div className="flex flex-col justify-center gap-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Download Formats</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleDownload('png')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors">
                                <span className="font-bold text-slate-800">PNG</span>
                                <span className="text-xs text-slate-500 mt-1">Best for Web</span>
                            </button>
                            <button onClick={() => handleDownload('svg')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors">
                                <span className="font-bold text-slate-800">SVG</span>
                                <span className="text-xs text-slate-500 mt-1">Vector</span>
                            </button>
                            <button onClick={() => handleDownload('jpeg')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors">
                                <span className="font-bold text-slate-800">JPEG</span>
                                <span className="text-xs text-slate-500 mt-1">Small Size</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleCopy}
                                className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-slate-700 font-medium">Copy Short URL</span>
                                {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} className="text-slate-400" />}
                            </button>
                            <a 
                                href={shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-slate-700 font-medium">Test QR Code Link</span>
                                <ExternalLink size={18} className="text-slate-400" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadStep;
