import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleLogin, clearError } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Loader, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // we dispatch the access token to our backend
            dispatch(googleLogin(tokenResponse.access_token));
        },
        onError: () => {
            console.error('Google Login Failed');
        }
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/qrcodes');
        }
        return () => {
            dispatch(clearError());
        }
    }, [isAuthenticated, navigate, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ email, password }));
    };

    return (
        <div className="w-full p-4 sm:p-6 min-h-screen flex items-center justify-center relative bg-slate-50 font-sans overflow-hidden">
            <div className="absolute top-0 left-0 -z-10 w-full h-full qr-pattern opacity-5"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-indigo-100 rounded-full blur-[80px] sm:blur-[120px] opacity-30"></div>

            <div className="glass max-w-md w-full p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl border border-white/50 relative">
                <div className="text-center mb-8 sm:mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900">Welcome Back</h2>
                    <p className="text-slate-500 text-sm">Sign in to manage your QR codes.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                {/* Social Auth */}
                <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all mb-6 shadow-sm"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative flex items-center gap-4 mb-6">
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Or email</span>
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                </div>

                {/* Login Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="rohan@example.com" className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 flex justify-between">
                            <span>Password</span>
                            <a href="#" className="text-indigo-600 hover:underline capitalize normal-case font-semibold">Forgot?</a>
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 pl-11 pr-12 py-3.5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium text-slate-900" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-6 flex items-center justify-center gap-2 disabled:opacity-70">
                        {loading && <Loader size={20} className="animate-spin" />}
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">
                        Don't have an account?
                        <Link to="/register" className="text-indigo-600 font-bold hover:underline ml-1">Sign Up</Link>
                    </p>
                    <Link to="/" className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto w-fit">
                        <ArrowLeft className="w-3 h-3" /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
