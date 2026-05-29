import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, Folder, Target } from 'lucide-react';
import URLForm from '../forms/URLForm';
import PDFForm from '../forms/PDFForm';
import VCardForm from '../forms/VCardForm';
import WhatsAppForm from '../forms/WhatsAppForm';
import SocialMediaForm from '../forms/SocialMediaForm';
import MediaForm from '../forms/MediaForm';
import MenuForm from '../forms/MenuForm';
import UpgradeModal from '../../../components/UpgradeModal';
import api from '../../../api/axios';

const ContentForm = ({ type, data, onChange }) => {
    const { user } = useSelector((state) => state.auth);
    const plan = user?.subscription?.plan || 'free';
    const isFolderLocked = plan === 'free' || plan === 'local';

    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [folders, setFolders] = useState([]);
    const [showUpgrade, setShowUpgrade] = useState(false);

    useEffect(() => {
        if (!isFolderLocked) {
            api.get('/folders')
               .then(res => setFolders(res.data))
               .catch(err => console.error("Failed to load folders", err));
        }
    }, [isFolderLocked]);

    const formComponents = {
        URL: URLForm,
        PDF: PDFForm,
        VCARD: VCardForm,
        WHATSAPP: WhatsAppForm,
        SOCIAL: SocialMediaForm,
        MEDIA: MediaForm,
        MENU: MenuForm,
    };

    const FormComponent = formComponents[type];

    const handleAdvancedClick = () => {
        if (isFolderLocked) {
            setShowUpgrade(true);
        } else {
            setIsAdvancedOpen(!isAdvancedOpen);
        }
    };

    const handleAdvancedChange = (field, value) => {
        if (isFolderLocked) return;
        onChange({ ...data, [field]: value });
    };

    const handleUtmChange = (field, value) => {
        if (isFolderLocked) return;
        const currentUtm = data.utm || { source: '', medium: '', campaign: '', term: '', content: '' };
        onChange({ ...data, utm: { ...currentUtm, [field]: value } });
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Add Destination</h2>
                <p className="text-slate-500 text-sm">
                    Enter the details and content you want to link to your QR code.
                </p>
            </div>

            {FormComponent ? (
                <FormComponent data={data} onChange={onChange} />
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800">
                    Form for <strong>{type}</strong> is coming soon!
                </div>
            )}

            {/* Advanced Options Section */}
            <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button 
                    onClick={handleAdvancedClick}
                    className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-slate-800">Advanced Options (Folders & UTMs)</span>
                        {isFolderLocked && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                                PRO
                            </span>
                        )}
                    </div>
                    {isAdvancedOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>

                {isAdvancedOpen && !isFolderLocked && (
                    <div className="p-6 space-y-6 border-t border-slate-200">
                        {/* Folder Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Folder className="w-4 h-4" /> Save to Folder
                            </label>
                            <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={data.folder_id || ""}
                                onChange={(e) => handleAdvancedChange('folder_id', e.target.value)}
                            >
                                <option value="">Uncategorized</option>
                                {folders.map(f => (
                                    <option key={f._id} value={f._id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* UTM Parameters */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Custom UTM Tracking</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="UTM Source (e.g. facebook)"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={data.utm?.source || ""}
                                    onChange={(e) => handleUtmChange('source', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="UTM Medium (e.g. social)"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={data.utm?.medium || ""}
                                    onChange={(e) => handleUtmChange('medium', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="UTM Campaign (e.g. summer_sale)"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none sm:col-span-2"
                                    value={data.utm?.campaign || ""}
                                    onChange={(e) => handleUtmChange('campaign', e.target.value)}
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Parameters will be automatically appended to your destination URL.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <UpgradeModal 
                isOpen={showUpgrade} 
                onClose={() => setShowUpgrade(false)} 
                type="premium_feature"
            />
        </div>
    );
};

export default ContentForm;
