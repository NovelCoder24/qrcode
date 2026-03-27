import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User, Phone, Mail, Building2, Globe, MapPin, Download, Loader2, AlertCircle, QrCode } from 'lucide-react';
import axios from 'axios';

const VCardViewPage = () => {
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

    const generateVCF = () => {
        const m = qrData.metadata || {};
        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${m.lastName || ''};${m.firstName || ''};;;`,
            `FN:${m.firstName || ''} ${m.lastName || ''}`.trim(),
        ];
        if (m.organization) lines.push(`ORG:${m.organization}`);
        if (m.jobTitle) lines.push(`TITLE:${m.jobTitle}`);
        if (m.phone) lines.push(`TEL;TYPE=CELL:${m.phone}`);
        if (m.email) lines.push(`EMAIL:${m.email}`);
        if (m.website) lines.push(`URL:${m.website}`);
        if (m.address) lines.push(`ADR;TYPE=HOME:;;${m.address};;;;`);
        lines.push('END:VCARD');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${m.firstName || 'contact'}_${m.lastName || ''}.vcf`.trim();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading contact card...</p>
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
    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Contact';

    const contactFields = [
        { icon: Building2, label: 'Company', value: m.organization },
        { icon: User, label: 'Title', value: m.jobTitle },
        { icon: Phone, label: 'Phone', value: m.phone, href: `tel:${m.phone}` },
        { icon: Mail, label: 'Email', value: m.email, href: `mailto:${m.email}` },
        { icon: Globe, label: 'Website', value: m.website, href: m.website },
        { icon: MapPin, label: 'Address', value: m.address },
    ].filter(f => f.value);

    return (
        <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden">
                    {/* Color Band */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, #8B5CF6)` }} />

                    {/* Avatar & Name */}
                    <div className="pt-6 pb-4 px-6 text-center">
                        <div
                            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                        {m.jobTitle && m.organization && (
                            <p className="text-sm text-slate-500 mt-1">{m.jobTitle} at {m.organization}</p>
                        )}
                        {m.jobTitle && !m.organization && (
                            <p className="text-sm text-slate-500 mt-1">{m.jobTitle}</p>
                        )}
                        {!m.jobTitle && m.organization && (
                            <p className="text-sm text-slate-500 mt-1">{m.organization}</p>
                        )}
                    </div>

                    {/* Contact Fields */}
                    <div className="px-6 pb-4 space-y-3">
                        {contactFields.map((field, i) => {
                            const Icon = field.icon;
                            const content = (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Icon className="w-4 h-4" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{field.label}</p>
                                        <p className="text-sm font-medium text-slate-700 truncate">{field.value}</p>
                                    </div>
                                </div>
                            );
                            return field.href ? (
                                <a key={i} href={field.href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
                            ) : content;
                        })}
                    </div>

                    {/* Save to Contacts Button */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={generateVCF}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Download className="w-4 h-4" />
                            Save to Contacts
                        </button>
                    </div>
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

export default VCardViewPage;
