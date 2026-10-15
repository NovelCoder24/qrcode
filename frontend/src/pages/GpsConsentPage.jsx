import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import api from '../api/axios';

const GpsConsentPage = ({ shortId, telemetryToken, destinationUrl, title }) => {
    const [status, setStatus] = useState('idle');
    const [redirected, setRedirected] = useState(false);
    const acquisitionStarted = useRef(false);
    const resolved = useRef(false);

    const redirectNow = () => {
        if (redirected) return;
        setRedirected(true);
        window.location.replace(destinationUrl);
    };

    useEffect(() => {
        const idleTimer = setTimeout(redirectNow, 22000);
        return () => clearTimeout(idleTimer);
    }, []);

    const sendTelemetry = async (body) => {
        if (resolved.current) return;
        resolved.current = true;
        setStatus('sending');

        try {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz) body.timezone = tz;
            } catch (_) { }

            await api.post(`/r/${shortId}/telemetry`, body);
        } catch (err) {
            console.warn('Telemetry failed:', err.message);
        }
        redirectNow();
    };

    const startLocationAcquisition = () => {
        if (acquisitionStarted.current || redirected) return;
        acquisitionStarted.current = true;
        setStatus('acquiring');

        let bdcResult = null;
        let bdcResolved = false;

        const bdcDeadline = setTimeout(() => {
            if (resolved.current) return;
            if (bdcResult) {
                sendTelemetry({
                    telemetryToken,
                    resolvedCity: bdcResult.city,
                    resolvedRegion: bdcResult.region,
                    resolvedCountry: bdcResult.country,
                    resolvedCountryCode: bdcResult.countryCode,
                });
            } else if (!bdcResolved) {
                tryGPSFinal();
            }
        }, 9000);

        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', {
            headers: { Accept: 'application/json' },
        })
            .then((r) => {
                if (!r.ok) throw new Error('BDC ' + r.status);
                return r.json();
            })
            .then((data) => {
                bdcResolved = true;
                const city = (data.city || data.locality || '').trim();
                const region = (data.principalSubdivision || '').trim();
                if (city && city !== '-') {
                    bdcResult = {
                        city,
                        region,
                        country: (data.countryName || '').trim(),
                        countryCode: (data.countryCode || '').trim(),
                    };
                } else {
                    clearTimeout(bdcDeadline);
                    tryGPSFinal();
                }
            })
            .catch(() => {
                bdcResolved = true;
                clearTimeout(bdcDeadline);
                tryGPSFinal();
            });

        if (!('geolocation' in navigator)) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (resolved.current) return;
                clearTimeout(bdcDeadline);
                sendTelemetry({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    telemetryToken,
                });
            },
            () => {
                // GPS failed — BDC will be used at deadline
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    };

    const tryGPSFinal = () => {
        if (resolved.current || redirected) return;
        if (!('geolocation' in navigator)) {
            fallbackToWan();
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (resolved.current) return;
                sendTelemetry({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    telemetryToken,
                });
            },
            () => fallbackToWan(),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
        );
    };

    const fallbackToWan = () => {
        if (resolved.current || redirected) return;
        sendTelemetry({
            telemetryToken,
            fallbackWanLookup: true,
        });
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-7 w-7" />
                </div>

                <h1 className="mb-2 text-lg font-bold text-foreground">
                    {title || 'Redirecting...'}
                </h1>

                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    We use your location to show scans near you and verify regional access. Only city and region are stored.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={startLocationAcquisition}
                        disabled={status !== 'idle'}
                        className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {status === 'idle' && 'Share location'}
                        {status === 'acquiring' && (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Connecting...
                            </span>
                        )}
                        {status === 'sending' && (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Finishing...
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); redirectNow(); }}
                        className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                        No thanks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GpsConsentPage;