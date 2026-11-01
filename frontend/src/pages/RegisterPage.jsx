import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, login, googleLogin, clearError, setAuthError } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';
import { ShieldCheck } from 'lucide-react';

const categoryPresets = {
    salon: {
        badge: "Salons & Spas · Scan to",
        headline: "Scan to rate your visit",
        prompt: "How was your visit?",
        chips: ["Stylist · Riya", "Colour & gloss", "Keratin", "Haircut & Blowdry", "Bridal", "Facial"],
        active: ["Stylist · Riya", "Colour & gloss", "Keratin"]
    },
    cafe: {
        badge: "Cafes & QSRs · Scan to",
        headline: "Loved the food? Rate us",
        prompt: "What did you love today?",
        chips: ["Iced Pour Over", "Truffle Fries", "Sourdough Toast", "Fast service", "Cozy vibe", "Chef's Special"],
        active: ["Iced Pour Over", "Truffle Fries", "Cozy vibe"]
    },
    clinic: {
        badge: "Clinics · Scan to",
        headline: "Share your care feedback",
        prompt: "How was your consultation?",
        chips: ["Dr. Sharma", "Zero wait time", "Clear explanation", "Hygienic clinic", "Painless care"],
        active: ["Dr. Sharma", "Clear explanation", "Hygienic clinic"]
    }
};

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "your-store";
}

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

    // Phase / View Mode: 'signup' | 'onboarding' | 'success'
    const [viewMode, setViewMode] = useState('signup');

    // Phase 1: Registration Form State
    const [ownerName, setOwnerName] = useState('');
    const [storeName, setStoreName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Field Error State
    const [fieldErrors, setFieldErrors] = useState({});
    const [shakingFields, setShakingFields] = useState({});

    // Phase 2: 3-Step Onboarding State
    const [currentStep, setCurrentStep] = useState(1);
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
    const [currentCat, setCurrentCat] = useState('salon');
    const [allChips, setAllChips] = useState([...categoryPresets.salon.chips]);
    const [activeChips, setActiveChips] = useState([...categoryPresets.salon.active]);
    const [customChipInput, setCustomChipInput] = useState('');
    const [city, setCity] = useState('');
    const [standeeHeadline, setStandeeHeadline] = useState(categoryPresets.salon.headline);
    const [slug, setSlug] = useState('aura-hair-spa');
    const [selectedPlan, setSelectedPlan] = useState('bundle');
    const [shippingAddress, setShippingAddress] = useState('');
    const [rateCardFile, setRateCardFile] = useState(null);
    const [dpdpOptIn, setDpdpOptIn] = useState(true);

    // Registered user profile cache
    const [registeredUser, setRegisteredUser] = useState({
        name: '',
        storeName: 'Aura Hair & Spa',
        whatsapp: '',
        email: '',
        authMethod: 'email'
    });

    const displayStoreName = storeName.trim() || (currentCat === 'cafe' ? 'Copper Chimney Cafe' : currentCat === 'clinic' ? 'Apex Dental Clinic' : 'Aura Hair & Spa');

    // Clear redux error on unmount
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    // If user is already authenticated and lands on register, launch onboarding directly
    useEffect(() => {
        if (isAuthenticated && user && viewMode === 'signup') {
            const userName = user.name || 'Store Owner';
            const userEmail = user.email || '';
            const userPhone = user.whatsappNumber || '';
            setRegisteredUser({
                name: userName,
                storeName: storeName || 'Aura Hair & Spa',
                whatsapp: userPhone,
                email: userEmail,
                authMethod: 'session'
            });
            setViewMode('onboarding');
        }
    }, [isAuthenticated, user]);

    // Google OAuth Handler
    const handleGoogleAuth = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await dispatch(googleLogin(tokenResponse.access_token)).unwrap();
                const userName = ownerName.trim() || 'Store Owner';
                const userStore = storeName.trim() || 'Aura Hair & Spa';
                const userPhone = whatsappNumber.replace(/\D/g, '') || '';
                setRegisteredUser({
                    name: userName,
                    storeName: userStore,
                    whatsapp: userPhone,
                    email: email.trim(),
                    authMethod: 'google'
                });
                setSlug(slugify(userStore));
                setViewMode('onboarding');
                setCurrentStep(1);
            } catch (err) {
                console.error("Google sign-in error", err);
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

    // Handle Registration Submission
    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        const cleanPhone = whatsappNumber.replace(/\D/g, "");
        const emailVal = email.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        const passValid = password.length >= 6;

        const ownerValid = ownerName.trim().length >= 2;
        const storeValid = storeName.trim().length >= 2;
        const phoneValid = cleanPhone.length === 10;

        triggerFieldError('ownerName', !ownerValid);
        triggerFieldError('storeName', !storeValid);
        triggerFieldError('waNumber', !phoneValid);
        triggerFieldError('email', !emailValid);
        triggerFieldError('password', !passValid);

        if (!ownerValid || !storeValid || !phoneValid || !emailValid || !passValid) return;

        try {
            await dispatch(register({ name: ownerName.trim(), email: emailVal, password })).unwrap();

            setRegisteredUser({
                name: ownerName.trim() || 'Store Owner',
                storeName: storeName.trim() || 'Aura Hair & Spa',
                whatsapp: cleanPhone,
                email: emailVal,
                authMethod: 'email'
            });

            setSlug(slugify(storeName.trim() || 'aura-hair-spa'));
            setViewMode('onboarding');
            setCurrentStep(1);
        } catch (err) {
            console.error("Registration error:", err);
        }
    };

    // Category Selection
    const handleSelectCategory = (cat) => {
        setCurrentCat(cat);
        const preset = categoryPresets[cat];
        setAllChips([...preset.chips]);
        setActiveChips([...preset.active]);
        setStandeeHeadline(preset.headline);
    };

    // Toggle Review Chips
    const toggleChip = (chip) => {
        if (activeChips.includes(chip)) {
            if (activeChips.length > 1) {
                setActiveChips(activeChips.filter(c => c !== chip));
            }
        } else {
            setActiveChips([...activeChips, chip]);
        }
    };

    const addCustomChip = () => {
        const val = customChipInput.trim();
        if (!val) return;
        if (!allChips.includes(val)) {
            setAllChips([...allChips, val]);
        }
        if (!activeChips.includes(val)) {
            setActiveChips([...activeChips, val]);
        }
        setCustomChipInput('');
    };

    // Validation for Onboarding Steps
    const validateStep = (stepNumber) => {
        let valid = true;

        if (stepNumber === 1) {
            const bizValid = storeName.trim().length >= 2;
            const cityValid = city.trim().length >= 2;
            triggerFieldError('bizName', !bizValid);
            triggerFieldError('cityInput', !cityValid);
            if (!bizValid || !cityValid) valid = false;
        }

        if (stepNumber === 2) {
            const headlineValid = standeeHeadline.trim().length >= 3;
            const slugValid = slug.trim().length >= 2;
            triggerFieldError('standeeHeadline', !headlineValid);
            triggerFieldError('slugInput', !slugValid);
            if (!headlineValid || !slugValid) valid = false;
        }

        if (stepNumber === 3) {
            if (selectedPlan !== 'digital') {
                const addrValid = shippingAddress.trim().length >= 5;
                triggerFieldError('addressInput', !addrValid);
                if (!addrValid) valid = false;
            } else {
                triggerFieldError('addressInput', false);
            }
        }

        return valid;
    };

    const nextFromStep = (stepNumber) => {
        if (!validateStep(stepNumber)) return;
        const nextStep = stepNumber + 1;
        if (nextStep > maxUnlockedStep) {
            setMaxUnlockedStep(nextStep);
        }
        setCurrentStep(nextStep);
    };

    const handlePillClick = (targetStep) => {
        if (targetStep <= maxUnlockedStep) {
            setCurrentStep(targetStep);
        } else if (targetStep === currentStep + 1) {
            nextFromStep(currentStep);
        } else {
            validateStep(currentStep);
        }
    };

    // Complete Onboarding & Save Storefront Profile
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        try {
            // Save profile details to backend
            await api.put('/users/profile', {
                name: registeredUser.name || ownerName,
                whatsappNumber: registeredUser.whatsapp || whatsappNumber,
                businessCategory: currentCat,
                workspaceMode: 'storefront'
            });
        } catch (err) {
            console.warn("Profile sync warning (continuing to success view):", err);
        }

        setViewMode('success');
    };

    const waFinishMsg = encodeURIComponent(
        `Hi QRVibe! I'm ${registeredUser.name || ownerName} (${registeredUser.email || email}). I just set up "${storeName}" in ${city}. My review standee shortlink is qrvibe.in/${slug}. Please activate my page and standee kit.`
    );
    const waFinishLink = `https://wa.me/?text=${waFinishMsg}`;

    const currentPreset = categoryPresets[currentCat] || categoryPresets.salon;

    return (
        <div className="lp min-h-screen flex flex-col justify-between">
            {/* Top Navigation */}
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
                    {viewMode !== 'signup' ? (
                        <span className="lbl hide-sm">
                            First-Time Setup · 3 Steps
                        </span>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-transparent border-0 cursor-pointer text-[#2B1E19] hover:underline"
                            style={{ borderBottom: '1px solid #2B1E19', paddingBottom: '2px', fontWeight: 500, fontSize: '13.5px' }}
                        >
                            Already registered? <span className="font-bold">Sign in</span>
                        </Link>
                    )}
                </div>
            </header>

            {/* Main Content Split Grid */}
            <main className="reg-grid w flex-1">
                {/* Left Column: Account Registration or 3-Step Onboarding */}
                <div>
                    {/* Error Banner from Redux */}
                    {error && (
                        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#FFF0F0', border: '1px solid #B93829', borderRadius: '10px', color: '#B93829', fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    {/* =========================================================
                        PHASE 1: CLEAN REGISTRATION & GOOGLE AUTH
                        ========================================================= */}
                    {viewMode === 'signup' && (
                        <div className="view-section active">
                            <div className="lbl">For salons, cafes &amp; clinics</div>
                            <h1 className="reg-h1">
                                Create your <em>QRVibe</em> account.
                            </h1>
                            <p className="reg-sub">
                                Start with your basic details below. Right after you sign in for the first time, we’ll guide you through a quick 3-step standee setup.
                            </p>

                            <div className="form-card">
                                {/* Google OAuth Quick Registration */}
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
                                    or register with email &amp; whatsapp
                                </div>

                                <form onSubmit={handleSignupSubmit} noValidate>
                                    <div className="field-row">
                                        <div>
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="regOwnerName">Your Name <span className="req-star">*</span></label>
                                            </div>
                                            <input
                                                type="text"
                                                id="regOwnerName"
                                                value={ownerName}
                                                onChange={(e) => {
                                                    setOwnerName(e.target.value);
                                                    triggerFieldError('ownerName', false);
                                                }}
                                                className={`reg-input ${fieldErrors.ownerName ? 'input-error' : ''} ${shakingFields.ownerName ? 'shake' : ''}`}
                                                placeholder="e.g., Rohan Mehta"
                                                required
                                            />
                                            <span className={`error-msg ${fieldErrors.ownerName ? 'show' : ''}`}>Please enter your full name.</span>
                                        </div>

                                        <div>
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="regStoreName">Store Name <span className="req-star">*</span></label>
                                            </div>
                                            <input
                                                type="text"
                                                id="regStoreName"
                                                value={storeName}
                                                onChange={(e) => {
                                                    setStoreName(e.target.value);
                                                    setSlug(slugify(e.target.value));
                                                    triggerFieldError('storeName', false);
                                                }}
                                                className={`reg-input ${fieldErrors.storeName ? 'input-error' : ''} ${shakingFields.storeName ? 'shake' : ''}`}
                                                placeholder="e.g., Aura Hair & Spa"
                                                required
                                            />
                                            <span className={`error-msg ${fieldErrors.storeName ? 'show' : ''}`}>Please enter your storefront name.</span>
                                        </div>
                                    </div>

                                    <div className="field-row">
                                        <div>
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="regWaNumber">WhatsApp Number <span className="req-star">*</span></label>
                                            </div>
                                            <div className="input-wrap">
                                                <span className="prefix">+91</span>
                                                <input
                                                    type="tel"
                                                    id="regWaNumber"
                                                    value={whatsappNumber}
                                                    onChange={(e) => {
                                                        setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                                                        triggerFieldError('waNumber', false);
                                                    }}
                                                    className={`reg-input has-prefix ${fieldErrors.waNumber ? 'input-error' : ''} ${shakingFields.waNumber ? 'shake' : ''}`}
                                                    placeholder="98765 43210"
                                                    maxLength={10}
                                                    required
                                                />
                                            </div>
                                            <span className={`error-msg ${fieldErrors.waNumber ? 'show' : ''}`}>Enter a valid 10-digit WhatsApp number.</span>
                                        </div>

                                        <div>
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="regEmail">Email Address <span className="req-star">*</span></label>
                                            </div>
                                            <input
                                                type="email"
                                                id="regEmail"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    triggerFieldError('email', false);
                                                }}
                                                className={`reg-input ${fieldErrors.email ? 'input-error' : ''} ${shakingFields.email ? 'shake' : ''}`}
                                                placeholder="rohan@auraspa.in"
                                                required
                                            />
                                            <span className={`error-msg ${fieldErrors.email ? 'show' : ''}`}>Please enter a valid email address.</span>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <div className="field-label">
                                            <label className="lbl" htmlFor="regPassword">Account Password <span className="req-star">*</span></label>
                                            <span className="hint">Minimum 6 characters</span>
                                        </div>
                                        <input
                                            type="password"
                                            id="regPassword"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                triggerFieldError('password', false);
                                            }}
                                            className={`reg-input ${fieldErrors.password ? 'input-error' : ''} ${shakingFields.password ? 'shake' : ''}`}
                                            placeholder="Create a password (min 6 characters)"
                                            required
                                        />
                                        <span className={`error-msg ${fieldErrors.password ? 'show' : ''}`}>Please enter at least 6 characters.</span>
                                    </div>

                                    <div className="form-actions" style={{ marginTop: '24px' }}>
                                        <span className="lbl">No credit card needed · Setup in 3 steps after login</span>
                                        <button type="submit" className="btn hn" disabled={loading}>
                                            {loading ? 'Creating account...' : 'Create account & start setup →'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Direct Navigation to Login Page */}
                            <div className="text-center mt-5">
                                <p className="text-sm text-[#6B5A50]">
                                    Already registered your storefront?{' '}
                                    <Link to="/login" className="font-bold text-[#2B1E19] underline hover:text-[#E5A93C] transition-colors">
                                        Sign in to your front desk →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                        PHASE 2: FIRST-TIME LOGIN 3-STEP ONBOARDING
                        ========================================================= */}
                    {viewMode === 'onboarding' && (
                        <div className="view-section active">
                            <div className="welcome-pill">
                                <span style={{ color: '#E5A93C' }}>●</span>
                                <span>
                                    {registeredUser.authMethod === 'google' ? '✓ Google Verified' : '✓ Account Created'} · Welcome, {registeredUser.name?.split(' ')[0] || 'Storefront Owner'}
                                </span>
                            </div>

                            {/* Stepper Navigation */}
                            <div className="stepper" role="tablist" aria-label="Onboarding steps">
                                <button
                                    type="button"
                                    className={`step-pill ${currentStep === 1 ? 'active' : (maxUnlockedStep >= 1 ? 'done' : 'locked')}`}
                                    onClick={() => handlePillClick(1)}
                                >
                                    <span className="num">{currentStep === 1 ? '01' : '✓'}</span> Storefront Profile
                                </button>
                                <span className={`step-connector ${maxUnlockedStep >= 2 ? 'done' : ''}`} />
                                <button
                                    type="button"
                                    className={`step-pill ${currentStep === 2 ? 'active' : (maxUnlockedStep >= 2 ? 'done' : 'locked')}`}
                                    onClick={() => handlePillClick(2)}
                                >
                                    <span className="num">{currentStep === 2 ? '02' : (maxUnlockedStep >= 2 ? '✓' : '02')}</span> Review Tags &amp; QR
                                </button>
                                <span className={`step-connector ${maxUnlockedStep >= 3 ? 'done' : ''}`} />
                                <button
                                    type="button"
                                    className={`step-pill ${currentStep === 3 ? 'active' : (maxUnlockedStep >= 3 ? 'done' : 'locked')}`}
                                    onClick={() => handlePillClick(3)}
                                >
                                    <span className="num">{currentStep === 3 ? '03' : '03'}</span> Standee &amp; Dispatch
                                </button>
                            </div>

                            <div className="lbl">
                                {currentStep === 1 && "Step 01 of 03 · Your Counter Identity"}
                                {currentStep === 2 && "Step 02 of 03 · 1-Tap Review Engine & QR"}
                                {currentStep === 3 && "Step 03 of 03 · Acrylic Standee Dispatch"}
                            </div>

                            <h1 className="reg-h1">
                                {currentStep === 1 && <>Let’s tailor your <em>review standee</em>.</>}
                                {currentStep === 2 && <>Customise your <em>review tags &amp; QR</em>.</>}
                                {currentStep === 3 && <>Claim your <em>standee kit</em>.</>}
                            </h1>

                            <p className="reg-sub">
                                {currentStep === 1 && "Pick your category and locality to unlock your 1-tap review tags."}
                                {currentStep === 2 && "Highlight the exact dishes, stylists, or services guests loved so they leave detailed 5-star Google reviews."}
                                {currentStep === 3 && "Select your standee bundle. We ship within 24 hours across India, completely print-ready."}
                            </p>

                            <form className="form-card" onSubmit={handleFinalSubmit} noValidate>
                                {/* Summary bar */}
                                <div className="flow-summary show">
                                    <div>
                                        <span className="lbl" style={{ marginRight: '8px' }}>✓ Account:</span>
                                        <strong>{storeName}</strong>
                                        <span style={{ color: '#6B5A50' }}>
                                            {city ? ` · ${city}` : ''}
                                            {registeredUser.whatsapp ? ` · +91 ${registeredUser.whatsapp}` : ''}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="flow-summary-edit"
                                        onClick={() => setViewMode('signup')}
                                    >
                                        Edit Account
                                    </button>
                                </div>

                                {/* STEP 1 PANEL: Storefront Profile & Category */}
                                {currentStep === 1 && (
                                    <div className="step-panel active">
                                        <div className="field-row">
                                            <div>
                                                <div className="field-label">
                                                    <label className="lbl" htmlFor="bizName">Storefront Name <span className="req-star">*</span></label>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="bizName"
                                                    value={storeName}
                                                    onChange={(e) => {
                                                        setStoreName(e.target.value);
                                                        setSlug(slugify(e.target.value));
                                                        triggerFieldError('bizName', false);
                                                    }}
                                                    className={`reg-input ${fieldErrors.bizName ? 'input-error' : ''} ${shakingFields.bizName ? 'shake' : ''}`}
                                                    placeholder="e.g., Aura Hair & Spa"
                                                    required
                                                />
                                                <span className={`error-msg ${fieldErrors.bizName ? 'show' : ''}`}>Please enter your storefront name.</span>
                                            </div>

                                            <div>
                                                <div className="field-label">
                                                    <label className="lbl" htmlFor="cityInput">City &amp; Neighbourhood <span className="req-star">*</span></label>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="cityInput"
                                                    value={city}
                                                    onChange={(e) => {
                                                        setCity(e.target.value);
                                                        triggerFieldError('cityInput', false);
                                                    }}
                                                    className={`reg-input ${fieldErrors.cityInput ? 'input-error' : ''} ${shakingFields.cityInput ? 'shake' : ''}`}
                                                    placeholder="e.g., Indiranagar, Bengaluru"
                                                    required
                                                />
                                                <span className={`error-msg ${fieldErrors.cityInput ? 'show' : ''}`}>Please enter your city &amp; locality.</span>
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <div className="field-label">
                                                <span className="lbl">Storefront Category <span className="req-star">*</span></span>
                                                <span className="hint">Tailors your guest review prompts</span>
                                            </div>
                                            <div className="cat-grid" role="radiogroup" aria-label="Storefront Business Category">
                                                <div
                                                    role="radio"
                                                    aria-checked={currentCat === 'salon'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSelectCategory('salon')}
                                                    className={`cat-card ${currentCat === 'salon' ? 'selected' : ''}`}
                                                    onClick={() => handleSelectCategory('salon')}
                                                >
                                                    <div className="cat-dot" aria-hidden="true" />
                                                    <div className="lbl">Salons &amp; Spas</div>
                                                    <div className="cat-title">Fill chairs</div>
                                                    <div className="cat-sub">Stylist tags, service lookbook &amp; rebooking</div>
                                                </div>

                                                <div
                                                    role="radio"
                                                    aria-checked={currentCat === 'cafe'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSelectCategory('cafe')}
                                                    className={`cat-card ${currentCat === 'cafe' ? 'selected' : ''}`}
                                                    onClick={() => handleSelectCategory('cafe')}
                                                >
                                                    <div className="cat-dot" aria-hidden="true" />
                                                    <div className="lbl">Cafes &amp; QSRs</div>
                                                    <div className="cat-title">Sell dishes</div>
                                                    <div className="cat-sub">Visual menu, chef specials &amp; dish reviews</div>
                                                </div>

                                                <div
                                                    role="radio"
                                                    aria-checked={currentCat === 'clinic'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleSelectCategory('clinic')}
                                                    className={`cat-card ${currentCat === 'clinic' ? 'selected' : ''}`}
                                                    onClick={() => handleSelectCategory('clinic')}
                                                >
                                                    <div className="cat-dot" aria-hidden="true" />
                                                    <div className="lbl">Clinics</div>
                                                    <div className="cat-title">Earn trust</div>
                                                    <div className="cat-sub">Treatment list, doctor timings &amp; feedback</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <span className="lbl">Step 01 of 03 · Completes your counter identity</span>
                                            <button type="button" className="btn hn" onClick={() => nextFromStep(1)}>
                                                Save &amp; Continue to Step 02 →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 PANEL: Review Engine & Rate Card */}
                                {currentStep === 2 && (
                                    <div className="step-panel active">
                                        <div className="field-group">
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="standeeHeadline">Standee Callout Headline <span className="req-star">*</span></label>
                                                <span className="hint">Appears above the QR code</span>
                                            </div>
                                            <input
                                                type="text"
                                                id="standeeHeadline"
                                                value={standeeHeadline}
                                                onChange={(e) => {
                                                    setStandeeHeadline(e.target.value);
                                                    triggerFieldError('standeeHeadline', false);
                                                }}
                                                className={`reg-input ${fieldErrors.standeeHeadline ? 'input-error' : ''} ${shakingFields.standeeHeadline ? 'shake' : ''}`}
                                                placeholder="e.g., Scan to rate your visit"
                                                required
                                            />
                                            <span className={`error-msg ${fieldErrors.standeeHeadline ? 'show' : ''}`}>Please add a short headline.</span>
                                        </div>

                                        <div className="field-group">
                                            <div className="field-label">
                                                <span className="lbl">1-Tap Review Highlight Chips</span>
                                                <span className="hint">Guests tap these to draft specific Google reviews</span>
                                            </div>
                                            <div className="chip-pool">
                                                {allChips.map((chip) => {
                                                    const isSelected = activeChips.includes(chip);
                                                    return (
                                                        <button
                                                            key={chip}
                                                            type="button"
                                                            className={`tag-btn ${isSelected ? 'active' : ''}`}
                                                            onClick={() => toggleChip(chip)}
                                                        >
                                                            <span className="plus">{isSelected ? '✓' : '+'}</span> {chip}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                                <input
                                                    type="text"
                                                    value={customChipInput}
                                                    onChange={(e) => setCustomChipInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomChip(); } }}
                                                    placeholder="Add a staff name or signature service (e.g., Stylist · Kabir)"
                                                    className="reg-input"
                                                    style={{ height: '44px', fontSize: '14px' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ minHeight: '44px', padding: '0 18px', whiteSpace: 'nowrap' }}
                                                    onClick={addCustomChip}
                                                >
                                                    + Add tag
                                                </button>
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <div className="field-label">
                                                <label className="lbl" htmlFor="slugInput">Your QR Shortlink <span className="req-star">*</span></label>
                                                <span className="hint">Printed on your standee · Change destination anytime</span>
                                            </div>
                                            <div className="input-wrap">
                                                <span className="prefix">qrvibe.in/</span>
                                                <input
                                                    type="text"
                                                    id="slugInput"
                                                    value={slug}
                                                    onChange={(e) => {
                                                        setSlug(slugify(e.target.value));
                                                        triggerFieldError('slugInput', false);
                                                    }}
                                                    className={`reg-input has-slug-prefix ${fieldErrors.slugInput ? 'input-error' : ''} ${shakingFields.slugInput ? 'shake' : ''}`}
                                                />
                                            </div>
                                            <span className={`error-msg ${fieldErrors.slugInput ? 'show' : ''}`}>Please set a valid shortlink.</span>
                                        </div>

                                        <div className="field-group">
                                            <div className="field-label">
                                                <span className="lbl">Snap Your Paper Rate Card or Menu (Optional)</span>
                                                <span className="hint">AI will extract dishes &amp; services into a live digital page</span>
                                            </div>
                                            <label className={`dropzone ${rateCardFile ? 'uploaded' : ''}`} htmlFor="rateCardFile">
                                                <input
                                                    type="file"
                                                    id="rateCardFile"
                                                    accept="image/*,.pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => setRateCardFile(e.target.files && e.target.files[0])}
                                                />
                                                <div className="lbl">{rateCardFile ? "Rate card attached · Ready to digitise" : "JPG, PNG, PDF · Or send via WhatsApp later"}</div>
                                                <div className="dropzone-title">{rateCardFile ? `✓ ${rateCardFile.name}` : "Click to upload your service list or menu photo"}</div>
                                            </label>
                                        </div>

                                        <div className="form-actions">
                                            <button type="button" className="btn" onClick={() => setCurrentStep(1)}>← Back to Step 01</button>
                                            <button type="button" className="btn hn" onClick={() => nextFromStep(2)}>Save &amp; Choose Standee Plan →</button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 PANEL: Standee & Dispatch */}
                                {currentStep === 3 && (
                                    <div className="step-panel active">
                                        <div className="field-group">
                                            <div className="field-label">
                                                <span className="lbl">Select Your Setup</span>
                                                <span className="hint">Simple pricing, shown upfront</span>
                                            </div>
                                            <ul className="plan-list" role="radiogroup" aria-label="Hardware & Subscription Plan">
                                                <li
                                                    role="radio"
                                                    aria-checked={selectedPlan === 'bundle'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setSelectedPlan('bundle')}
                                                    className={`plan-item ${selectedPlan === 'bundle' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedPlan('bundle')}
                                                >
                                                    <div className="plan-left">
                                                        <span className="radio-ring" aria-hidden="true" />
                                                        <div>
                                                            <b>Review Standee Bundle + Starter</b>
                                                            <span className="s">Custom acrylic counter review standee + mirror tag shipped, plus 1-tap Google reviews &amp; private feedback inbox</span>
                                                        </div>
                                                    </div>
                                                    <span className="pr">₹1,499 <small>kit</small></span>
                                                </li>

                                                <li
                                                    role="radio"
                                                    aria-checked={selectedPlan === 'annual'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setSelectedPlan('annual')}
                                                    className={`plan-item ${selectedPlan === 'annual' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedPlan('annual')}
                                                >
                                                    <div className="plan-left">
                                                        <span className="radio-ring" aria-hidden="true" />
                                                        <div>
                                                            <b>Annual All-In</b>
                                                            <span className="s">Everything above + 12 months of AI review drafts &amp; private WhatsApp alerts, billed once a year</span>
                                                        </div>
                                                    </div>
                                                    <span className="pr">₹4,999 <small>/ year</small></span>
                                                </li>

                                                <li
                                                    role="radio"
                                                    aria-checked={selectedPlan === 'digital'}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setSelectedPlan('digital')}
                                                    className={`plan-item ${selectedPlan === 'digital' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedPlan('digital')}
                                                >
                                                    <div className="plan-left">
                                                        <span className="radio-ring" aria-hidden="true" />
                                                        <div>
                                                            <b>Starter Digital Only</b>
                                                            <span className="s">Instant review QR page &amp; private feedback inbox (print your own standee)</span>
                                                        </div>
                                                    </div>
                                                    <span className="pr">₹499 <small>/ month</small></span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Conditional Shipping vs Digital Notice */}
                                        {selectedPlan === 'digital' ? (
                                            <div className="p-4 bg-[#F5EFE6] border border-[#2B1E19]/20 rounded-xl my-3">
                                                <div className="flex items-center gap-2 font-semibold text-sm text-[#2B1E19]">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" aria-hidden="true"></span>
                                                    <span>Instant Digital License · Print-Your-Own</span>
                                                </div>
                                                <p className="text-xs text-[#6B5A50] mt-1">
                                                    High-resolution vector PDF &amp; SVG standee assets will be generated instantly in your dashboard. Physical delivery address is not required.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="field-group">
                                                <div className="field-label">
                                                    <label className="lbl" htmlFor="addressInput">Standee Delivery Address <span className="req-star">*</span></label>
                                                    <span className="hint">Dispatched within 24 hours across India</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="addressInput"
                                                    value={shippingAddress}
                                                    onChange={(e) => {
                                                        setShippingAddress(e.target.value);
                                                        triggerFieldError('addressInput', false);
                                                    }}
                                                    className={`reg-input ${fieldErrors.addressInput ? 'input-error' : ''} ${shakingFields.addressInput ? 'shake' : ''}`}
                                                    placeholder="Shop No. 4, Linking Road, Bandra West, Mumbai 400050"
                                                    required
                                                />
                                                <span className={`error-msg ${fieldErrors.addressInput ? 'show' : ''}`}>Please enter the shop address where we should ship your standee.</span>
                                            </div>
                                        )}

                                        {/* 100% Anti-Hostageware Guarantee Seal */}
                                        <div className="guar mt-3 mb-2">
                                            <div className="guar-icon" aria-hidden="true">
                                                <ShieldCheck size={18} className="text-[#2B1E19]" />
                                            </div>
                                            <div className="guar-txt">
                                                <div className="guar-t font-semibold">100% Anti-Hostageware Guarantee</div>
                                                <p className="text-xs text-[#6B5A50] mt-0.5">
                                                    Your printed acrylic standees and mirror tags never expire. Dynamic Google review redirects remain permanently active.
                                                </p>
                                            </div>
                                        </div>

                                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#4A3B33', cursor: 'pointer', marginTop: '16px' }}>
                                            <input
                                                type="checkbox"
                                                checked={dpdpOptIn}
                                                onChange={(e) => setDpdpOptIn(e.target.checked)}
                                                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#2B1E19' }}
                                            />
                                            <span>Send my live storefront preview link and order tracking on WhatsApp. Guest data is handled with consent under India’s DPDP Act.</span>
                                        </label>

                                        <div className="form-actions">
                                            <button type="button" className="btn" onClick={() => setCurrentStep(2)}>← Back to Step 02</button>
                                            <button type="submit" className="btn hn">Launch page &amp; order standee</button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Completion / Success Box */}
                    {viewMode === 'success' && (
                        <div className="success-box show">
                            <div className="lbl">Storefront Ready · Live in Preview</div>
                            <h2 style={{ marginTop: '10px' }}>Your counter front desk is reserved.</h2>
                            <p style={{ marginTop: '12px' }}>
                                We have reserved <b>qrvibe.in/{slug}</b> for <b>{storeName}</b>. Your custom countertop review standee is being prepped.
                            </p>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    className="btn hn"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Enter Storefront Dashboard →
                                </button>
                                <a
                                    className="btn"
                                    href={waFinishLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Verify on WhatsApp
                                </a>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setViewMode('onboarding');
                                        setCurrentStep(1);
                                    }}
                                >
                                    Edit storefront details
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Live Interactive Stage Preview */}
                <aside className="preview-col" aria-label="Live Standee & Phone Preview">
                    <div className="stage dk">
                        <div className="stage-top">
                            <span className="lbl">Counter &amp; Guest Preview</span>
                            <span className="live-badge"><span className="live-dot" /> Live sync</span>
                        </div>

                        {/* Physical Acrylic Standee Mockup (Dedicated, single-sided, no UPI) */}
                        <div className="stand">
                            <div className="lbl">{currentPreset.badge}</div>
                            <div className="sh">{standeeHeadline}</div>
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
                                {currentCat === 'salon' && (
                                    <path d="M7.3 7.3 L9.7 9.7 M9.7 7.3 L7.3 9.7 M6.9 6.9 A0.6 0.6 0 1 0 6.9 8.1 A0.6 0.6 0 1 0 6.9 6.9 M10.1 6.9 A0.6 0.6 0 1 0 10.1 8.1 A0.6 0.6 0 1 0 10.1 6.9" stroke="#E5A93C" strokeWidth="0.4" fill="none" />
                                )}
                                {currentCat === 'cafe' && (
                                    <path d="M7.5 7.2 H9.5 V8.8 C9.5 9.4 9 9.8 8.5 9.8 C8 9.8 7.5 9.4 7.5 8.8 Z M9.5 7.6 H10 C10.3 7.6 10.5 7.8 10.5 8.1 C10.5 8.4 10.3 8.6 10 8.6 H9.5" stroke="#E5A93C" strokeWidth="0.45" fill="none" />
                                )}
                                {currentCat === 'clinic' && (
                                    <path d="M8.5 6.8 V10.2 M6.8 8.5 H10.2" stroke="#E5A93C" strokeWidth="0.75" strokeLinecap="round" />
                                )}
                            </svg>
                            <div className="lbl">Phone camera, not GPay</div>
                            <div className="stand-url">qrvibe.in/{slug}</div>
                        </div>

                        {/* Guest Mobile Phone Mockup */}
                        <div className="phone">
                            <div className="lbl">{displayStoreName}</div>
                            <div className="ph-h">{currentPreset.prompt}</div>
                            <div className="pst" aria-label="5 stars">★★★★★</div>
                            <div className="chip-list">
                                {activeChips.slice(0, 4).map((chip) => (
                                    <span key={chip} className="chip">{chip}</span>
                                ))}
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

export default RegisterPage;
