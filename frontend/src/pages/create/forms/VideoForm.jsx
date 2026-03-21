import React, { useState } from 'react';
import { Video, Youtube, Link, Upload, X } from 'lucide-react';

const VideoForm = ({ data, onChange }) => {
    const [sourceType, setSourceType] = useState(data?.sourceType || 'url');

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleSourceChange = (type) => {
        setSourceType(type);
        updateField('sourceType', type);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Video</h3>
            <p className="text-sm text-slate-500 mb-6">
                Share a video with your audience. Add a YouTube link or video URL.
            </p>

            <div className="space-y-4">
                {/* Video Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Video Title
                    </label>
                    <input
                        type="text"
                        value={data?.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="My Awesome Video"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Source Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Video Source
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSourceChange('youtube')}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                sourceType === 'youtube'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                            }`}
                        >
                            <Youtube className="w-6 h-6" />
                            <span className="text-sm font-medium">YouTube</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSourceChange('url')}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                sourceType === 'url'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                            }`}
                        >
                            <Link className="w-6 h-6" />
                            <span className="text-sm font-medium">Video URL</span>
                        </button>
                    </div>
                </div>

                {/* Video URL Input */}
                {sourceType === 'youtube' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            YouTube URL
                        </label>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                            <input
                                type="url"
                                value={data?.youtubeUrl || ''}
                                onChange={(e) => updateField('youtubeUrl', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Paste a YouTube video link (regular or shorts)
                        </p>
                    </div>
                )}

                {sourceType === 'url' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Video URL
                        </label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                            <input
                                type="url"
                                value={data?.videoUrl || ''}
                                onChange={(e) => updateField('videoUrl', e.target.value)}
                                placeholder="https://example.com/video.mp4"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Direct link to an MP4, WebM, or other video file
                        </p>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description (Optional)
                    </label>
                    <textarea
                        value={data?.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Tell viewers what this video is about..."
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoForm;
