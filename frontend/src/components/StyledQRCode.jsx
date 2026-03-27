import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

/**
 * StyledQRCode — Declarative React wrapper for the imperative `qr-code-styling` library.
 *
 * Props:
 *   data          (string)  — URL or text to encode (required)
 *   size          (number)  — Pixel width & height (default: 200)
 *   logo          (string)  — URL or data-URI for center image
 *   primaryColor  (string)  — Foreground/dot color (default: '#000000')
 *   bgColor       (string)  — Background color (default: '#ffffff')
 *   dotStyle      (string)  — 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded'
 *   cornerSquareStyle (string) — 'dot' | 'square' | 'extra-rounded'
 *   cornerDotStyle    (string) — 'dot' | 'square'
 *   ecLevel       (string)  — Error correction: 'L' | 'M' | 'Q' | 'H' (default: 'H')
 *   className     (string)  — CSS class for the container div
 *   imageOptions  (object)  — Override image options (margin, crossOrigin, etc.)
 *
 * Ref API (via forwardRef):
 *   ref.current.download(format, filename) — format: 'png' | 'jpeg' | 'svg'
 *   ref.current.instance                   — raw QRCodeStyling instance
 */
const StyledQRCode = forwardRef(({
    data,
    size = 200,
    logo,
    primaryColor = '#000000',
    bgColor = '#ffffff',
    dotStyle = 'square',
    cornerSquareStyle = 'square',
    cornerDotStyle = 'square',
    ecLevel = 'H',
    className = '',
    imageOptions,
}, ref) => {
    const containerRef = useRef(null);
    const qrInstanceRef = useRef(null);
    const [hasError, setHasError] = useState(false);

    // Map legacy react-qrcode-logo style names to qr-code-styling names
    const mapDotStyle = (style) => {
        const mapping = {
            'squares': 'square',
            'dots': 'dots',
            'rounded': 'rounded',
            'classy': 'classy',
            'classy-rounded': 'classy-rounded',
            'extra-rounded': 'extra-rounded',
            'square': 'square',
        };
        return mapping[style] || 'square';
    };

    // Build the options object
    const buildOptions = () => ({
        width: size,
        height: size,
        type: 'svg',
        data: data || '',
        image: logo || undefined,
        dotsOptions: {
            color: primaryColor,
            type: mapDotStyle(dotStyle),
        },
        backgroundOptions: {
            color: bgColor,
        },
        cornersSquareOptions: {
            type: cornerSquareStyle === 'circle' || cornerSquareStyle === 'dot' ? 'dot' : cornerSquareStyle,
        },
        cornersDotOptions: {
            type: cornerDotStyle === 'circle' || cornerDotStyle === 'dot' ? 'dot' : cornerDotStyle,
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 4,
            imageSize: 0.35,
            hideBackgroundDots: true,
            ...(imageOptions || {}),
        },
        qrOptions: {
            errorCorrectionLevel: ecLevel,
        },
    });

    // Mount: Create QRCodeStyling instance and append to DOM (once)
    useEffect(() => {
        if (!data) return;

        try {
            const qrCode = new QRCodeStyling(buildOptions());
            qrInstanceRef.current = qrCode;

            // Guard: only append if the container is empty (prevents double-append on StrictMode re-renders)
            if (containerRef.current && containerRef.current.children.length === 0) {
                qrCode.append(containerRef.current);
            }

            setHasError(false);
        } catch (err) {
            console.error('StyledQRCode: Failed to initialize QR code', err);
            setHasError(true);
        }

        // Cleanup: remove the rendered SVG/canvas from the DOM and release the instance
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            qrInstanceRef.current = null;
        };
    }, []); // Only run on mount — updates are handled by the update effect below

    // Update: When props change, call .update() instead of re-creating
    useEffect(() => {
        if (!qrInstanceRef.current || !data) return;

        try {
            qrInstanceRef.current.update(buildOptions());
        } catch (err) {
            console.error('StyledQRCode: Failed to update QR code', err);
        }
    }, [data, size, logo, primaryColor, bgColor, dotStyle, cornerSquareStyle, cornerDotStyle, ecLevel]);

    // Expose download API and raw instance via ref
    useImperativeHandle(ref, () => ({
        download: async (format = 'png', filename = 'qr-code') => {
            if (!qrInstanceRef.current) {
                console.warn('StyledQRCode: No QR instance to download from');
                return;
            }
            try {
                await qrInstanceRef.current.download({
                    name: filename,
                    extension: format,
                });
            } catch (err) {
                console.error('StyledQRCode: Download failed', err);
            }
        },
        getRawData: async (format = 'png') => {
            if (!qrInstanceRef.current) return null;
            try {
                return await qrInstanceRef.current.getRawData(format);
            } catch (err) {
                console.error('StyledQRCode: getRawData failed', err);
                return null;
            }
        },
        instance: qrInstanceRef.current,
    }), [data, size, logo, primaryColor, bgColor]);

    // Error / empty state
    if (!data || hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-100 rounded-xl ${className}`}
                style={{ width: size, height: size }}
            >
                <span className="text-slate-400 text-xs font-medium">
                    {hasError ? 'QR Error' : 'No Data'}
                </span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: size, height: size, lineHeight: 0 }}
        />
    );
});

StyledQRCode.displayName = 'StyledQRCode';

export default StyledQRCode;
