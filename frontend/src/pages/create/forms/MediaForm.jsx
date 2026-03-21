import React, { useState } from 'react';
import { Image, Video, Music, Link, Plus, Trash2, FileText, User } from 'lucide-react';

const MediaForm = ({ data, onChange }) => {
    const [mediaType, setMediaType] = useState(data?.mediaType || 'image');

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleMediaTypeChange = (type) => {
        setMediaType(type);
        onChange({ ...data, mediaType: type });
    };

    // Image gallery management
    const addImage = () => {
        const images = data?.images || [];
        onChange({
            ...data,
            images: [...images, { url: '', caption: '' }]
        });
    };

    const updateImage = (index, field, value) => {
        const images = [...(data?.images || [])];
        images[index] = { ...images[index], [field]: value };
        onChange({ ...data, images });
    };

    const removeImage = (index) => {
        const images = (data?.images || []).filter((_, i) => i !== index);
        onChange({ ...data, images });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Media Content</h3>
            <p className="text-sm text-slate-500 mb-6">
                Share images, videos, or audio files with your audience.
            </p>

            {/* Media Type Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button
                    type="button"
                    onClick={() => handleMediaTypeChange('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        mediaType === 'image'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Image className="w-4 h-4" />
                    Images
                </button>
                <button
                    type="button"
                    onClick={() => handleMediaTypeChange('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        mediaType === 'video'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Video className="w-4 h-4" />
                    Video
                </button>
                <button
                    type="button"
                    onClick={() => handleMediaTypeChange('audio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        mediaType === 'audio'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Music className="w-4 h-4" />
                    Audio
                </button>
            </div>

            {/* Image Form */}
            {mediaType === 'image' && (
                <div className="space-y-4">
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Images
                        </label>
                        <div className="space-y-3">
                            {(data?.images || []).map((image, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Image className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="url"
                                                value={image.url}
                                                onChange={(e) => updateImage(index, 'url', e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={image.caption}
                                                onChange={(e) => updateImage(index, 'caption', e.target.value)}
                                                placeholder="Caption (optional)"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addImage}
                            className="mt-3 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Image
                        </button>
                    </div>
                </div>
            )}

            {/* Video Form */}
            {mediaType === 'video' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Video Title *
                        </label>
                        <input
                            type="text"
                            value={data?.videoTitle || ''}
                            onChange={(e) => updateField('videoTitle', e.target.value)}
                            placeholder="My Video"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Video URL *
                        </label>
                        <div className="relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="url"
                                value={data?.videoUrl || ''}
                                onChange={(e) => updateField('videoUrl', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            YouTube, Vimeo, or direct video link
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={data?.videoDescription || ''}
                            onChange={(e) => updateField('videoDescription', e.target.value)}
                            placeholder="Tell viewers about this video..."
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            )}

            {/* Audio Form */}
            {mediaType === 'audio' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Track Title *
                        </label>
                        <div className="relative">
                            <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={data?.trackTitle || ''}
                                onChange={(e) => updateField('trackTitle', e.target.value)}
                                placeholder="My Audio Track"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Artist / Creator Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={data?.artistName || ''}
                                onChange={(e) => updateField('artistName', e.target.value)}
                                placeholder="Artist Name"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Audio URL *
                        </label>
                        <div className="relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="url"
                                value={data?.audioUrl || ''}
                                onChange={(e) => updateField('audioUrl', e.target.value)}
                                placeholder="https://example.com/audio.mp3"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Direct MP3 link or Spotify/SoundCloud URL
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={data?.audioDescription || ''}
                            onChange={(e) => updateField('audioDescription', e.target.value)}
                            placeholder="Tell listeners about this track..."
                            rows={2}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaForm;
