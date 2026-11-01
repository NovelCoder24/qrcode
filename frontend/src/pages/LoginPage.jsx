import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleLogin, clearError, setAuthError } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Field Error State & Shake Animation (identical to RegisterPage)
    const [fieldErrors, setFieldErrors] = useState({});
    const [shakingFields, setShakingFields] = useState({});

    // Clear redux error on unmount
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    // Navigate to dashboard if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/qrcodes');
        }
    }, [isAuthenticated, navigate]);

    // Google OAuth Handler (identical to RegisterPage)
    const handleGoogleAuth = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await dispatch(googleLogin(tokenResponse.access_token)).unwrap();
            } catch (err) {
                console.error("Google sign-in error:", err);
            }
        },
        onError: (errorResponse) => {
            console.error('Google Auth Failed:', errorResponse);
            dispatch(setAuthError('Google authentication was cancelled or failed.'));
        }
    });

    const triggerFieldError = (fieldKey, hasError) => {
        setFieldErrors(prev => ({ ...prev, [fieldKey]: hasError }));
        if (hasError) {
            setShakingFields(prev => ({ ...prev, [fieldKey]: true }));
            setTimeout(() => {
                setShakingFields(prev => ({ ...prev, [fieldKey]: false }));
            }, 350);
        }
    };

    // Handle Login Submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        const emailVal = email.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        const passValid = password.length >= 6;

        triggerFieldError('email', !emailValid);
        triggerFieldError('password', !passValid);

        if (!emailValid || !passValid) return;

        try {
            await dispatch(login({ email: emailVal, password })).unwrap();
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <div className="lp min-h-screen flex flex-col justify-between">
            {/* Top Navigation - exact same component & classes as RegisterPage */}
            <header className="nav reg-nav">
                <Link className="brand" to="/">
                    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                        <rect x="1" y="1" width="8" height="8" rx="2" fill="#E5A93C" />
                        <rect x="13" y="1" width="8" height="8" rx="2" fill="currentColor" />
                        <rect x="1" y="13" width="8" height="8" rx="2" fill="currentColor" />
                        <rect x="13" y="13" width="4" height="4" fill="#E5A93C" />
                    </svg>
                    <span>QRVibe</span>
                </Link>

                <div className="nav-right">
                    <Link
                        to="/register"
                        className="bg-transparent border-0 cursor-pointer text-[#2B1E19] hover:underline"
                        style={{ borderBottom: '1px solid #2B1E19', paddingBottom: '2px', fontWeight: 500, fontSize: '13.5px' }}
                    >
                        New storefront? <span className="font-bold">Create account</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Split Grid - exact same component & layout as RegisterPage */}
            <main className="reg-grid w flex-1">
                {/* Left Column: Sign In Form */}
                <div>
                    {/* Error Banner from Redux */}
                    {error && (
                        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#FFF0F0', border: '1px solid #B93829', borderRadius: '10px', color: '#B93829', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    <div className="view-section active">
                        <div className="lbl">For salons, cafes &amp; clinics</div>
                        <h1 className="reg-h1">
                            Sign in to your <em>front desk</em>.
                        </h1>
                        <p className="reg-sub">
                            Continue with Google or enter your registered credentials to access your storefront dashboard.
                        </p>

                        <div className="form-card">
                            {/* Google OAuth Quick Sign In */}
                            <button
                                type="button"
                                className="btn btn-google"
                                disabled={loading}
                                onClick={() => handleGoogleAuth()}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                                </svg>
                                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                            </button>

                            <div className="or-divider">
                                or sign in with email &amp; password
                            </div>

                            <form onSubmit={handleLoginSubmit} noValidate>
                                <div className="field-row">
                                    <div>
                                        <div className="field-label">
                                            <label className="lbl" htmlFor="loginEmail">Email Address <span className="req-star">*</span></label>
                                        </div>
                                        <input
                                            type="email"
                                            id="loginEmail"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                triggerFieldError('email', false);
                                            }}
                                            className={`reg-input ${fieldErrors.email ? 'input-error' : ''} ${shakingFields.email ? 'shake' : ''}`}
                                            placeholder="rohan@auraspa.in"
                                            required
                                        />
                                        <span className={`error-msg ${fieldErrors.email ? 'show' : ''}`}>Please enter your registered email address.</span>
                                    </div>

                                    <div>
                                        <div className="field-label">
                                            <label className="lbl" htmlFor="loginPassword">Password <span className="req-star">*</span></label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="loginPassword"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    triggerFieldError('password', false);
                                                }}
                                                className={`reg-input ${fieldErrors.password ? 'input-error' : ''} ${shakingFields.password ? 'shake' : ''}`}
                                                placeholder="••••••••"
                                                style={{ paddingRight: '46px' }}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B5A50] hover:text-[#2B1E19] focus:outline-none"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <span className={`error-msg ${fieldErrors.password ? 'show' : ''}`}>Password is required.</span>
                                    </div>
                                </div>

                                <div className="form-actions" style={{ marginTop: '24px' }}>
                                    <span className="lbl">No credit card needed · Encrypted session</span>
                                    <button type="submit" className="btn hn" disabled={loading}>
                                        {loading ? 'Processing...' : 'Sign in & open storefront →'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Direct Navigation to Registration Page */}
                        <div className="text-center mt-5">
                            <p className="text-sm text-[#6B5A50]">
                                Don't have a storefront account yet?{' '}
                                <Link to="/register" className="font-bold text-[#2B1E19] underline hover:text-[#E5A93C] transition-colors">
                                    Create account &amp; start setup →
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Interactive Stage Preview - exact same component & layout as RegisterPage */}
                <aside className="preview-col" aria-label="Live Standee & Phone Preview">
                    <div className="stage dk">
                        <div className="stage-top">
                            <span className="lbl">Counter &amp; Guest Preview</span>
                            <span className="live-badge"><span className="live-dot" /> Live sync</span>
                        </div>

                        {/* Physical Acrylic Standee Mockup (Dedicated, single-sided, no UPI) */}
                        <div className="stand">
                            <div className="lbl">Salons &amp; Spas · Scan to</div>
                            <div className="sh">Scan to rate your visit</div>
                            <svg
                                viewBox="0 0 17 17"
                                width="100%"
                                style={{ display: 'block', maxWidth: '142px', margin: '14px 0' }}
                                fill="#2B1E19"
                                role="img"
                                aria-label="Dedicated Storefront QR Code with Center Category Brand Icon"
                            >
                                <path d="M6 0h2v1h-2zM9 0h1v1h-1zM6 1h2v1h-2zM9 1h2v1h-2zM6 2h3v1h-3zM10 2h1v1h-1zM6 3h1v1h-1zM10 3h1v1h-1zM7 4h1v1h-1zM9 4h2v1h-2zM6 5h2v1h-2zM9 5h1v1h-1zM1 6h1v1h-1zM3 6h3v1h-3zM7 6h2v1h-2zM10 6h2v1h-2zM14 6h1v1h-1zM2 7h1v1h-1zM4 7h2v1h-2zM7 7h3v1h-3zM14 7h1v1h-1zM1 8h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM11 8h2v1h-2zM14 8h3v1h-3zM0 9h2v1h-2zM3 9h3v1h-3zM7 9h2v1h-2zM13 9h3v1h-3zM1 10h5v1h-5zM7 10h4v1h-4zM6 11h1v1h-1zM11 11h3v1h-3zM15 11h2v1h-2zM6 12h9v1h-9zM6 13h5v1h-5zM13 13h4v1h-4zM6 14h2v1h-2zM9 14h2v1h-2zM13 14h1v1h-1zM15 14h1v1h-1zM9 15h3v1h-3zM15 15h2v1h-2zM12 16h1v1h-1zM14 16h3v1h-3z" />
                                <rect x="0" y="0" width="5" height="5" />
                                <rect x="1" y="1" width="3" height="3" fill="#FBF9F6" />
                                <rect x="2" y="2" width="1" height="1" />
                                <rect x="12" y="0" width="5" height="5" />
                                <rect x="13" y="1" width="3" height="3" fill="#FBF9F6" />
                                <rect x="14" y="2" width="1" height="1" />
                                <rect x="0" y="12" width="5" height="5" />
                                <rect x="1" y="13" width="3" height="3" fill="#FBF9F6" />
                                <rect x="2" y="14" width="1" height="1" />

                                {/* MANDATORY CENTER CATEGORY ICON (Never a naked barcode) */}
                                <circle cx="8.5" cy="8.5" r="2.8" fill="#FFFFFF" stroke="#2B1E19" strokeWidth="0.5" />
                                <path d="M7.3 7.3 L9.7 9.7 M9.7 7.3 L7.3 9.7 M6.9 6.9 A0.6 0.6 0 1 0 6.9 8.1 A0.6 0.6 0 1 0 6.9 6.9 M10.1 6.9 A0.6 0.6 0 1 0 10.1 8.1 A0.6 0.6 0 1 0 10.1 6.9" stroke="#E5A93C" strokeWidth="0.4" fill="none" />
                            </svg>
                            <div className="lbl">Phone camera, not GPay</div>
                            <div className="stand-url">qrvibe.in/aura-hair-spa</div>
                        </div>

                        {/* Guest Mobile Phone Mockup */}
                        <div className="phone">
                            <div className="lbl">Aura Hair &amp; Spa</div>
                            <div className="ph-h">How was your visit?</div>
                            <div className="pst" aria-label="5 stars">★★★★★</div>
                            <div className="chip-list">
                                <span className="chip">Stylist · Riya</span>
                                <span className="chip">Colour &amp; gloss</span>
                                <span className="chip">Keratin</span>
                            </div>
                            <div className="pbtn">Post to Google · 1 tap</div>
                            <div className="pn">Rather tell us privately? Message on WhatsApp</div>
                        </div>

                        <div className="stage-foot">
                            <span className="lbl" style={{ display: 'block', color: '#E5A93C', marginBottom: '4px' }}>
                                Acrylic Review Standee
                            </span>
                            Dedicated to 1-tap Google reviews &amp; private WhatsApp feedback.<br />
                            Scans in 1 second with the default phone camera.
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default LoginPage;
