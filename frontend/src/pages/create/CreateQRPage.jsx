import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PhoneMockup from '../../components/Create/PhoneMockup';
import TypeSelection from './steps/TypeSelection';
import ContentForm from './steps/ContentForm';
import DesignStudio from './steps/DesignStudio';
import { ChevronRight, HelpCircle, Menu, X, QrCode, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const CreateQRPage = ({ isOpen, onToggle }) => {
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

    // Load existing QR data in edit mode
    useEffect(() => {
        if (editId) {
            const loadQR = async () => {
                setEditLoading(true);
                try {
                    const { data } = await api.get(`/qrcodes/${editId}`);
                    setQrType(data.qr_type || 'URL');
                    setQrData({ url: data.target_url, title: data.metadata?.title });
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
        if (currentStep < 3) {
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
                    // For vCard, we'll store data in metadata and use a placeholder URL
                    if (!qrData?.firstName && !qrData?.lastName && !qrData?.phone && !qrData?.email) {
                        setError('Please fill in at least name, phone, or email.');
                        setIsCreating(false);
                        return;
                    }
                    // Store vCard data in metadata
                    metadata = { ...metadata, ...qrData };
                    target_url = `vcard://${qrData?.firstName || 'contact'}`;
                    break;

                case 'WHATSAPP':
                    if (!qrData?.phoneNumber) {
                        setError('Please enter a phone number.');
                        setIsCreating(false);
                        return;
                    }
                    // Generate WhatsApp URL
                    const phone = qrData.phoneNumber.replace(/\D/g, '');
                    const message = encodeURIComponent(qrData?.prefillMessage || '');
                    target_url = `https://wa.me/${phone}${message ? `?text=${message}` : ''}`;
                    metadata = { ...metadata, phoneNumber: qrData.phoneNumber, prefillMessage: qrData?.prefillMessage, contactName: qrData?.contactName };
                    break;

                case 'SOCIAL':
                    // Check if at least one social link is provided
                    const socialLinks = qrData?.socialLinks || [];
                    const hasValidLink = socialLinks.some(link => link.url && link.url.trim());
                    if (!hasValidLink) {
                        setError('Please add at least one social media link.');
                        setIsCreating(false);
                        return;
                    }
                    // Store all social data in metadata, use first available as target_url
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
                // Update existing QR code
                await api.put(`/qrcodes/${editId}`, payload);
                navigate(`/qrcodes/${editId}`);
            } else {
                // Create new QR code
                await api.post('/qrcodes/create', payload);
                navigate('/qrcodes');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save QR code. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    if (editLoading) {
        return (
            <div className="min-h-screen w-full bg-[#F8F9FB] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col">

            {/* Wizard Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo Area (Left) */}
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <QrCode className="text-white w-5 h-5" />
                        </div>
                        <span>QR<span className="text-indigo-600">Vibe</span></span>
                    </div>

                    {/* Progress Steps (Center) */}
                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-indigo-100' : 'bg-gray-100'}`}>1</span>
                            <span>Type of QR code</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-indigo-100' : 'bg-gray-100'}`}>2</span>
                            <span>Content</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                        <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-indigo-100' : 'bg-gray-100'}`}>3</span>
                            <span>QR design</span>
                        </div>
                    </div>

                    {/* Actions (Right) */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-slate-600 rounded-full hover:bg-gray-100">
                            <HelpCircle size={20} />
                        </button>
                        <button
                            onClick={onToggle}
                            className="p-2 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100">
                            {isOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-12 pb-24 grid lg:grid-cols-12 gap-12">

                {/* Left Side: Steps Content */}
                <div className="lg:col-span-8 flex flex-col">
                    {currentStep === 1 && (
                        <TypeSelection selectedType={qrType} onSelect={handleTypeSelect} onProceed={nextStep} />
                    )}

                    {/* Step 2: Content Input */}
                    {currentStep === 2 && (
                        <ContentForm
                            type={qrType}
                            data={qrData}
                            onChange={setQrData}
                        />
                    )}
                    {currentStep === 3 && (
                        <DesignStudio design={qrDesign} onChange={setQrDesign} />
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-16 flex justify-between items-center">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 3 ? (
                            <button
                                onClick={nextStep}
                                disabled={!qrType}
                                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateQR}
                                disabled={isCreating}
                                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save Changes' : 'Create QR Code'
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Phone Preview (Sticky) */}
                <div className="hidden lg:col-span-4 lg:flex flex-col items-center">
                    <div className="sticky top-24 w-full flex justify-center">
                        <PhoneMockup
                            type={qrType}
                            data={qrData}
                            design={qrDesign}
                            step={currentStep}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateQRPage;
