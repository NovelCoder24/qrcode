import React, { useState } from 'react';
import { Image, Upload, X, Link, Plus } from 'lucide-react';

const ImageForm = ({ data, onChange }) => {
    const images = data?.images || [{ url: '', caption: '' }];

    const addImage = () => {
        onChange({ ...data, images: [...images, { url: '', caption: '' }] });
    };

    const removeImage = (index) => {
        if (images.length === 1) return;
        const newImages = images.filter((_, i) => i !== index);
        onChange({ ...data, images: newImages });
    };

    const updateImage = (index, field, value) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], [field]: value };
        onChange({ ...data, images: newImages });
    };

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Image Gallery</h3>
            <p className="text-sm text-slate-500 mb-6">
                Create a gallery of images that users can view when they scan your QR code.
            </p>

            <div className="space-y-4">
                {/* Gallery Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Gallery Title
                    </label>
                    <input
                        type="text"
                        value={data?.galleryTitle || ''}
                        onChange={(e) => updateField('galleryTitle', e.target.value)}
                        placeholder="My Photo Gallery"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Images List */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                        Images
                    </label>
                    {images.map((image, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-600">Image {index + 1}</span>
                                <button
                                    onClick={() => removeImage(index)}
                                    disabled={images.length === 1}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={image.url}
                                        onChange={(e) => updateImage(index, 'url', e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={image.caption}
                                    onChange={(e) => updateImage(index, 'caption', e.target.value)}
                                    placeholder="Caption (optional)"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Image Button */}
                <button
                    onClick={addImage}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Another Image
                </button>

                {/* Gallery Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Gallery Description (Optional)
                    </label>
                    <textarea
                        value={data?.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Describe your image gallery..."
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageForm;
