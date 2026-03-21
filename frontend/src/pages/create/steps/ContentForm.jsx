import React from 'react';
import URLForm from '../forms/URLForm';
import PDFForm from '../forms/PDFForm';
import VCardForm from '../forms/VCardForm';
import WhatsAppForm from '../forms/WhatsAppForm';
import SocialMediaForm from '../forms/SocialMediaForm';
import MediaForm from '../forms/MediaForm';

const ContentForm = ({ type, data, onChange }) => {
    // Map QR types to their respective form components (6 types only)
    const formComponents = {
        URL: URLForm,
        PDF: PDFForm,
        VCARD: VCardForm,
        WHATSAPP: WhatsAppForm,
        SOCIAL: SocialMediaForm,
        MEDIA: MediaForm,
    };

    const FormComponent = formComponents[type];

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">2. Enter Content</h2>
            <p className="text-slate-500 mb-8">
                Enter the content you want to link to your QR code.
            </p>

            {/* Render Form Based on Type */}
            {FormComponent ? (
                <FormComponent data={data} onChange={onChange} />
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800">
                    Form for <strong>{type}</strong> is coming soon!
                </div>
            )}
        </div>
    );
};

export default ContentForm;
