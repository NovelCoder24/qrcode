import React from 'react';
import { Music, Link, User, FileText } from 'lucide-react';

const MP3Form = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-600" />
                Audio / MP3
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Share an audio file or podcast episode with your audience.
            </p>

            <div className="space-y-4">
                {/* Track Title */}
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Artist Name */}
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

                {/* Audio URL */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Audio File URL *
                    </label>
                    <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="url"
                            value={data?.audioUrl || ''}
                            onChange={(e) => updateField('audioUrl', e.target.value)}
                            placeholder="https://example.com/audio.mp3"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Direct link to MP3, WAV, or other audio file
                    </p>
                </div>

                {/* Or Streaming Link */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-white text-xs text-slate-400 font-medium">OR</span>
                    </div>
                </div>

                {/* Streaming Platform Link */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Streaming Platform Link
                    </label>
                    <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="url"
                            value={data?.streamingUrl || ''}
                            onChange={(e) => updateField('streamingUrl', e.target.value)}
                            placeholder="https://open.spotify.com/track/..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Spotify, Apple Music, SoundCloud, or other streaming link
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description (Optional)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Tell listeners about this track..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MP3Form;
