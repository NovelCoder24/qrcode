
import React from 'react';
import { Download, Info, MoreHorizontal, TrendingUp, Globe, Instagram } from 'lucide-react';

const QRCard = ({ qr }) => {
    // Simple Mock QR Visualization using CSS grid and blocks
    const renderMockQR = () => (
        <div className="relative w-24 h-24 bg-white border-2 border-slate-200 rounded-lg p-1.5 flex flex-wrap items-center justify-center overflow-hidden">
            {/* Visual representation of a QR code */}
            <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                {[...Array(16)].map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                <div className="bg-white p-1 rounded-full shadow-sm">
                    {qr.title.toLowerCase().includes('instagram') ? (
                        <Instagram size={20} className="text-slate-800" />
                    ) : (
                        <Globe size={20} className="text-slate-800" />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-5">
            <div className="flex items-start gap-4">
                {/* Mock QR Image */}
                {renderMockQR()}

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 truncate">{qr.title}</h3>
                    <p className="text-xs text-gray-400 font-medium">Created {qr.createdDate}</p>

                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-semibold text-emerald-500">{qr.status}</span>
                    </div>

                    <div className="mt-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Scans</p>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={16} className="text-slate-800" />
                            <span className="text-xl font-bold text-slate-800">{qr.scanCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1A2533] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                    <Download size={16} />
                    <span>Download</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                    <Info size={16} />
                    <span>Detail</span>
                </button>
                <button className="p-2.5 border border-gray-200 text-slate-400 rounded-lg hover:bg-gray-50 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>
    );
};

export default QRCard;
