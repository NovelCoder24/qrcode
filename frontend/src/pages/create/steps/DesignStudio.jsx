import React from 'react';
import AccordionItem from '../../../components/UI/AccordionItem';
import { Frame, Grid, Box, Image, MousePointer2 } from 'lucide-react';
import { uploadFile } from '../../../api/axios';

const DesignStudio = ({ design, onChange }) => {

    const handleColorChange = (key, value) => {
        onChange({ ...design, [key]: value });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadFile(file);
            onChange({ ...design, logoUrl: res.url });
        } catch (error) {
            console.error("Logo upload failed", error);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 1. Frame */}
            <AccordionItem title="Frame" icon={Frame}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Select a frame style for your QR code.</p>
                    <div className="grid grid-cols-3 gap-3">
                        {['none', 'simple', 'rounded', 'banner'].map(style => (
                            <button
                                key={style}
                                onClick={() => onChange({ ...design, frame: style })}
                                className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 capitalize
                                    ${design?.frame === style ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 hover:bg-slate-50'}
                                `}
                            >
                                <span className="text-xs font-semibold">{style}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </AccordionItem>

            {/* 2. QR Code Pattern (Dots & Colors) */}
            <AccordionItem title="QR Code Pattern" icon={Grid} defaultOpen={true}>
                <div className="space-y-6">
                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Dots Color</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg">
                                <input
                                    type="color"
                                    value={design?.fgColor || '#000000'}
                                    onChange={(e) => handleColorChange('fgColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-sm text-slate-600">{design?.fgColor || '#000000'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Background</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg">
                                <input
                                    type="color"
                                    value={design?.bgColor || '#ffffff'}
                                    onChange={(e) => handleColorChange('bgColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-sm text-slate-600">{design?.bgColor || '#ffffff'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dot Style (Style of the small squares) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Pattern Style</label>
                        <div className="flex gap-2">
                            {['squares', 'dots', 'fluid'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => onChange({ ...design, qrStyle: style })}
                                    className={`flex-1 py-2 text-xs border rounded-md capitalize
                                        ${design?.qrStyle === style ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200'}
                                    `}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* 3. QR Code Corners (Eyes) */}
            <AccordionItem title="QR Code Corners" icon={Box}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Corner Color</label>
                        <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg w-1/2">
                            <input
                                type="color"
                                value={design?.eyeColor || '#000000'}
                                onChange={(e) => handleColorChange('eyeColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-sm text-slate-600">{design?.eyeColor || '#000000'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Corner Shape</label>
                        <div className="flex gap-2">
                            {['square', 'circle'].map(shape => (
                                <button
                                    key={shape}
                                    onClick={() => onChange({ ...design, eyeShape: shape })}
                                    className={`flex-1 py-2 text-xs border rounded-md capitalize
                                        ${design?.eyeShape === shape ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200'}
                                    `}
                                >
                                    {shape}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* 4. Add Logo */}
            <AccordionItem title="Add Logo" icon={Image}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Upload a logo to display in the center.</p>

                    <div className="border border-slate-200 rounded-lg p-4">
                        {design?.logoUrl ? (
                            <div className="flex items-center gap-4">
                                <img src={design.logoUrl} alt="Logo" className="w-12 h-12 object-contain bg-slate-100 p-1 rounded" />
                                <button onClick={() => onChange({ ...design, logoUrl: null })} className="text-sm text-red-500 hover:underline">Remove</button>
                            </div>
                        ) : (
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                        )}
                    </div>
                </div>
            </AccordionItem>
        </div>
    );
};

export default DesignStudio;
