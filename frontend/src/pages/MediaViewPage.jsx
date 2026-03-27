import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Video, Music, Loader2, AlertCircle, QrCode, ExternalLink } from 'lucide-react';
import axios from 'axios';

// Helper to convert YouTube/Vimeo URLs to embeddable format
const getEmbedUrl = (url) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
};

const MediaViewPage = () => {
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
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading media...</p>
                </div>
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
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

    const m = qrData.metadata || {};
    const primaryColor = qrData.customization?.fgColor || '#4F46E5';
    const mediaType = m.mediaType || 'image';

    return (
        <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                    {/* Color Band */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, #8B5CF6)` }} />

                    {/* IMAGE Gallery */}
                    {mediaType === 'image' && (
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Image className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                                <h1 className="text-lg font-bold text-slate-900">{m.galleryTitle || m.title || 'Image Gallery'}</h1>
                            </div>

                            {(m.images || []).length > 0 ? (
                                <div className="space-y-4">
                                    {m.images.map((img, i) => (
                                        <div key={i} className="rounded-xl overflow-hidden border border-slate-100">
                                            <img
                                                src={img.url}
                                                alt={img.caption || `Image ${i + 1}`}
                                                className="w-full h-auto object-cover"
                                                loading="lazy"
                                            />
                                            {img.caption && (
                                                <p className="px-3 py-2 text-sm text-slate-500 bg-slate-50">{img.caption}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-8 text-slate-400 text-sm">No images added.</p>
                            )}
                        </div>
                    )}

                    {/* VIDEO Player */}
                    {mediaType === 'video' && (
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Video className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                                <h1 className="text-lg font-bold text-slate-900">{m.videoTitle || m.title || 'Video'}</h1>
                            </div>

                            {m.videoUrl && (() => {
                                const embedUrl = getEmbedUrl(m.videoUrl);
                                if (embedUrl) {
                                    return (
                                        <div className="rounded-xl overflow-hidden border border-slate-100 aspect-video">
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={m.videoTitle || 'Video'}
                                            />
                                        </div>
                                    );
                                }
                                // Direct video URL
                                return (
                                    <div className="rounded-xl overflow-hidden border border-slate-100">
                                        <video controls className="w-full" preload="metadata">
                                            <source src={m.videoUrl} />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                );
                            })()}

                            {m.videoDescription && (
                                <p className="mt-4 text-sm text-slate-500 leading-relaxed">{m.videoDescription}</p>
                            )}

                            {m.videoUrl && (
                                <a
                                    href={m.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Video
                                </a>
                            )}
                        </div>
                    )}

                    {/* AUDIO Player */}
                    {mediaType === 'audio' && (
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Music className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900">{m.trackTitle || m.title || 'Audio Track'}</h1>
                                    {m.artistName && <p className="text-xs text-slate-500">{m.artistName}</p>}
                                </div>
                            </div>

                            {m.audioDescription && (
                                <p className="mt-3 mb-4 text-sm text-slate-500 leading-relaxed">{m.audioDescription}</p>
                            )}

                            {m.audioUrl && (() => {
                                // Check if it's a Spotify/SoundCloud URL
                                const isStreaming = /spotify\.com|soundcloud\.com/i.test(m.audioUrl);
                                if (isStreaming) {
                                    return (
                                        <a
                                            href={m.audioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Listen Now
                                        </a>
                                    );
                                }
                                // Direct audio file
                                return (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <audio controls className="w-full" preload="metadata">
                                            <source src={m.audioUrl} />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-3 flex-shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <div className="bg-indigo-600 p-1 rounded">
                        <QrCode className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium">
                        Powered by <span className="text-indigo-600 font-semibold">Qrio</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default MediaViewPage;
