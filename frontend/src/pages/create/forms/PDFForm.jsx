import React, { useState } from 'react';
import { uploadFile } from '../../../api/axios';
import { Upload, X, FileText, Palette, Info, Image as ImageIcon, FileType } from 'lucide-react';
import AccordionItem from '../../../components/UI/AccordionItem';

const PDFForm = ({ data, onChange }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // --- Handlers ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const response = await uploadFile(file);
            onChange({ ...data, pdfUrl: response.url, originalName: file.name });
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Generic text handler for other fields
    const handleInputChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">

            {/* 1. PDF File Section */}
            <AccordionItem title="PDF File" icon={FileType} defaultOpen={true}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Upload the PDF file you want to display.</p>

                    {!data.pdfUrl ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className={`p-4 rounded-full ${uploading ? 'bg-teal-50' : 'bg-slate-100'}`}>
                                    {uploading ? (
                                        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700">
                                        {uploading ? 'Uploading...' : 'Click to upload PDF'}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Maximum file size: 10MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="text-teal-600" />
                                <div>
                                    <p className="font-medium text-slate-800 truncate max-w-[200px]">
                                        {data.originalName || 'Uploaded PDF'}
                                    </p>
                                    <a href={data.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">
                                        View File
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => handleInputChange('pdfUrl', null)}
                                className="p-1 hover:bg-teal-100 rounded-full text-teal-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </div>
            </AccordionItem>

            {/* 2. Design Section (Landing Page Colors) */}
            <AccordionItem title="Design" icon={Palette}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Choose a color theme for your page.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Primary Color</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg">
                                <input
                                    type="color"
                                    value={data.primaryColor || '#000000'}
                                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-sm text-slate-600">{data.primaryColor || '#000000'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Button Color</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-lg">
                                <input
                                    type="color"
                                    value={data.buttonColor || '#EF4444'}
                                    onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-sm text-slate-600">{data.buttonColor || '#EF4444'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* 3. PDF Information */}
            <AccordionItem title="PDF Information" icon={Info}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company / Author</label>
                        <input
                            type="text"
                            placeholder="e.g. Acme Corp"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={data.company || ''}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Annual Report 2024"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={data.title || ''}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Brief description of the document..."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={data.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Website URL (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={data.website || ''}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                        />
                    </div>
                </div>
            </AccordionItem>

            {/* 4. Welcome Screen */}
            <AccordionItem title="Welcome Screen" icon={ImageIcon}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Display an image/logo while your page loads.</p>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-center">
                        <p className="text-xs text-slate-400">Welcome screen image upload coming soon.</p>
                    </div>
                </div>
            </AccordionItem>
        </div>
    );
};

export default PDFForm;
