import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TypeSelection from './steps/TypeSelection';
import ContentForm from './steps/ContentForm';
import DesignStudio from './steps/DesignStudio';
import SafetyCheck from './steps/SafetyCheck';
import DownloadStep from './steps/DownloadStep';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const CreateQRPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const currentStep = parseInt(searchParams.get('step') || '1', 10);
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;

    const [qrType, setQrType] = useState('URL');
    const [qrData, setQrData] = useState({});
    const [qrDesign, setQrDesign] = useState({
        fgColor: '#000000',
        fgColor2: '#4F46E5',
        gradientType: 'none',
        bgColor: '#ffffff',
        qrStyle: 'square',
        eyeShape: 'square',
        frame: 'none'
    });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [createdQrData, setCreatedQrData] = useState(null);

    // Load existing QR data in edit mode
    useEffect(() => {
        if (editId) {
            const loadQR = async () => {
                setEditLoading(true);
                try {
                    const { data } = await api.get(`/qrcodes/${editId}`);
                    setQrType(data.qr_type || 'URL');
                    // Preserve all metadata
                    setQrData({ 
                        url: data.target_url, 
                        ...data.metadata 
                    });
                    setQrDesign({
                        fgColor: data.customization?.fgColor || '#000000',
                        fgColor2: data.customization?.fgColor2 || '#4F46E5',
                        gradientType: data.customization?.gradientType || 'none',
                        bgColor: data.customization?.bgColor || '#ffffff',
                        qrStyle: data.customization?.qrStyle || 'square',
                        eyeShape: data.customization?.eyeShape || 'square',
                        eyeColor: data.customization?.eyeColor,
                        frame: data.customization?.frame || 'none',
                        logoUrl: data.customization?.logoUrl || null,
                    });
                } catch (err) {
                    setError('Failed to load QR code for editing.');
                } finally {
                    setEditLoading(false);
                }
            };
            loadQR();
        }
    }, [editId]);

    const handleTypeSelect = (type) => {
        setQrType(type);
        setSearchParams({ step: 1 });
    };

    const nextStep = () => {
        if (currentStep < 4) {
            const params = { step: currentStep + 1 };
            if (editId) params.edit = editId;
            setSearchParams(params);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            const params = { step: currentStep - 1 };
            if (editId) params.edit = editId;
            setSearchParams(params);
        }
    };

    const handleCreateQR = async () => {
        setIsCreating(true);
        setError(null);
        try {
            // Validate and generate target_url based on QR type
            let target_url = '';
            let metadata = { title: qrData?.title || `${qrType} QR Code` };

            switch (qrType) {
                case 'URL':
                    target_url = qrData?.url || '';
                    if (!target_url) {
                        setError('Please enter a URL.');
                        setIsCreating(false);
                        return;
                    }
                    break;

                case 'PDF':
                    target_url = qrData?.pdfUrl || '';
                    if (!target_url) {
                        setError('Please upload a PDF file.');
                        setIsCreating(false);
                        return;
                    }
                    break;

                case 'VCARD':
                    if (!qrData?.firstName && !qrData?.lastName && !qrData?.phone && !qrData?.email) {
                        setError('Please fill in at least name, phone, or email.');
                        setIsCreating(false);
                        return;
                    }
                    metadata = { ...metadata, ...qrData };
                    target_url = `vcard://${qrData?.firstName || 'contact'}`;
                    break;

                case 'WHATSAPP':
                    if (!qrData?.phoneNumber) {
                        setError('Please enter a phone number.');
                        setIsCreating(false);
                        return;
                    }
                    const phone = qrData.phoneNumber.replace(/\D/g, '');
                    const message = encodeURIComponent(qrData?.prefillMessage || '');
                    target_url = `https://wa.me/${phone}${message ? `?text=${message}` : ''}`;
                    metadata = { ...metadata, phoneNumber: qrData.phoneNumber, prefillMessage: qrData?.prefillMessage, contactName: qrData?.contactName };
                    break;

                case 'SOCIAL':
                    const socialLinks = qrData?.socialLinks || [];
                    const hasValidLink = socialLinks.some(link => link.url && link.url.trim());
                    if (!hasValidLink) {
                        setError('Please add at least one social media link.');
                        setIsCreating(false);
                        return;
                    }
                    metadata = { ...metadata, ...qrData };
                    target_url = socialLinks.find(link => link.url)?.url || '';
                    break;

                case 'MEDIA':
                    const mediaType = qrData?.mediaType || 'image';
                    if (mediaType === 'image') {
                        if (!qrData?.images || qrData.images.length === 0 || !qrData.images[0]?.url) {
                            setError('Please add at least one image URL.');
                            setIsCreating(false);
                            return;
                        }
                        target_url = qrData.images[0].url;
                        metadata = { ...metadata, ...qrData };
                    } else if (mediaType === 'video') {
                        if (!qrData?.videoUrl) {
                            setError('Please enter a video URL.');
                            setIsCreating(false);
                            return;
                        }
                        target_url = qrData.videoUrl;
                        metadata = { ...metadata, ...qrData };
                    } else if (mediaType === 'audio') {
                        if (!qrData?.audioUrl) {
                            setError('Please enter an audio URL.');
                            setIsCreating(false);
                            return;
                        }
                        target_url = qrData.audioUrl;
                        metadata = { ...metadata, ...qrData };
                    }
                    break;

                case 'MENU':
                    if (!qrData?.restaurantName && (!qrData?.categories || qrData.categories.length === 0)) {
                        setError('Please add a restaurant name or menu items.');
                        setIsCreating(false);
                        return;
                    }
                    metadata = { ...metadata, ...qrData };
                    target_url = `menu://${Date.now()}`;
                    break;

                default:
                    setError('Invalid QR type selected.');
                    setIsCreating(false);
                    return;
            }

            const payload = {
                target_url,
                title: metadata.title,
                qr_type: qrType,
                metadata,
                folder_id: qrData.folder_id || null,
                utm: qrData.utm || { source: '', medium: '', campaign: '', term: '', content: '' },
                customization: {
                    fgColor: qrDesign.fgColor,
                    fgColor2: qrDesign.fgColor2 || null,
                    gradientType: qrDesign.gradientType || 'none',
                    bgColor: qrDesign.bgColor,
                    qrStyle: qrDesign.qrStyle,
                    eyeShape: qrDesign.eyeShape,
                    eyeColor: qrDesign.eyeColor,
                    frame: qrDesign.frame,
                    logoUrl: qrDesign.logoUrl || null,
                },
            };

            if (isEditMode) {
                const res = await api.put(`/qrcodes/${editId}`, payload);
                setCreatedQrData(res.data);
                setSearchParams({ step: 5, edit: editId });
            } else {
                const res = await api.post('/qrcodes/create', payload);
                setCreatedQrData(res.data);
                setSearchParams({ step: 5 });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save QR code. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    if (editLoading) {
        return (
            <div className="w-full flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            </div>
        );
    }

    const steps = [
        { num: 1, label: 'Choose Type' },
        { num: 2, label: 'Destination' },
        { num: 3, label: 'Design' },
        { num: 4, label: 'Safety Check' },
        { num: 5, label: 'Download' }
    ];

    return (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
            {/* Page Header & Progress */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">
                    {isEditMode ? 'Edit QR Code' : 'Create QR Code'}
                </h1>
                
                {/* Horizontal Progress Bar */}
                <div className="flex items-center w-full overflow-x-auto pb-2 scrollbar-hide">
                    {steps.map((step, index) => (
                        <div key={step.num} className="flex items-center min-w-max">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                                ${currentStep > step.num ? 'bg-green-500 text-white' : 
                                  currentStep === step.num ? 'bg-slate-900 text-white' : 
                                  'bg-slate-100 text-slate-400'}`}>
                                {currentStep > step.num ? <Check size={16} /> : step.num}
                            </div>
                            <span className={`ml-3 text-sm font-medium transition-colors
                                ${currentStep >= step.num ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                            {index < steps.length - 1 && (
                                <div className="w-12 sm:w-20 h-px bg-slate-200 mx-4" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                {currentStep === 1 && (
                    <TypeSelection selectedType={qrType} onSelect={handleTypeSelect} onProceed={nextStep} />
                )}

                {currentStep === 2 && (
                    <ContentForm
                        type={qrType}
                        data={qrData}
                        onChange={setQrData}
                    />
                )}

                {currentStep === 3 && (
                    <DesignStudio 
                        type={qrType}
                        data={qrData}
                        design={qrDesign} 
                        onChange={setQrDesign} 
                    />
                )}

                {currentStep === 4 && (
                    <SafetyCheck 
                        type={qrType}
                        data={qrData}
                        design={qrDesign}
                    />
                )}

                {currentStep === 5 && (
                    <DownloadStep 
                        qrData={createdQrData}
                        qrType={qrType}
                        design={qrDesign}
                    />
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Navigation Buttons */}
                {currentStep < 5 && (
                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                disabled={!qrType}
                                className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateQR}
                                disabled={isCreating}
                                className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save & Continue' : 'Create & Continue'
                                )}
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreateQRPage;
