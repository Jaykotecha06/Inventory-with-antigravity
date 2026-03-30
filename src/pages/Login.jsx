import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleLogin } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, isAuthenticated } = useSelector((state) => state.auth);

    const [role, setRole] = useState('Staff');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resultAction = await dispatch(loginUser({ email, password }));
            if (loginUser.fulfilled.match(resultAction)) {
                toast.success('Logged in successfully');
                navigate('/');
            } else {
                const errorMsg = resultAction.payload;
                if (errorMsg?.includes('auth/invalid-credential') || errorMsg?.includes('auth/user-not-found') || errorMsg?.includes('auth/wrong-password')) {
                    toast.error('Invalid email or password. Please check your credentials.');
                } else {
                    toast.error(errorMsg || 'Failed to login');
                }
            }
        } catch (err) {
            toast.error('An error occurred');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const resultAction = await dispatch(googleLogin({ role }));
            if (googleLogin.fulfilled.match(resultAction)) {
                toast.success('Logged in with Google');
                navigate('/');
            } else {
                toast.error(resultAction.payload || 'Google Login failed');
            }
        } catch (err) {
            toast.error('An error occurred during Google Login');
        }
    };

    return (
        <div className="bg-background font-body text-on-surface min-h-screen flex flex-col">
            <main className="flex-grow flex flex-col md:flex-row">
                {/* Left Section: Marketing/Intro */}
                <section className="hidden md:flex md:w-1/2 bg-mesh-gradient relative overflow-hidden flex-col justify-between p-12 lg:p-20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            </div>
                            <span className="font-headline text-2xl font-bold text-white tracking-tight">Vyapar Ledger</span>
                        </div>
                        <div className="max-w-md">
                            <h1 className="font-headline text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                The Precision Architect for your business inventory.
                            </h1>
                            <p className="text-on-primary-container text-lg font-medium opacity-90 leading-relaxed">
                                Master your stock levels, automate entries, and gain architectural clarity over your entire supply chain with our next-generation digital ledger.
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                <img alt="User 1" className="w-10 h-10 rounded-full border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH9XGse9d1XVfQEiCkgEC70kMalMdxLqTa36e2Yt6_t4XTFbgz47oFkrcudZSI2bjZYDuTtnEYejVR5khy-vbwgit4yyAt17km4Pf0z4hHrBzfO06852dgRgMY7CiP_P6qrnE3MiT697MIv0XEoPB3TNOrml1pJuXocKdxkS_ijpgjp06oxgwEqTxjaifLQp7isVSuwOMR00JPdR9GrVzy6KnEaE67nL54mpMz6xbkd-ihTNgNUBFqemB0CdqrrWMu1ffjrQnnBGc" />
                                <img alt="User 2" className="w-10 h-10 rounded-full border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBx_Hoe9P9tJdp3N4Of6eK6qTiDHGjbdgmTGLWSCen_Mv0sAQlT-zfnpTT0fD-80snAUHFSUyVAXzjHnr3pVKguw7DX9X52ZC4Oh3Jger_kq0sWx-s2DkjmFWxE7ZLHF15fFkf4ZMJU0_XyPj-iGLKehA1SY4CHZqzY6vo_8l2yyDiA3eEnFVED1WQikgZWAlrqsvPik_WgHd67l5MoBm797XYqmrwqCA9NDhOJ9O7D43_OcwhrfPGL-5n16Fm7EW6-U0AL4ONmc_Q" />
                                <img alt="User 3" className="w-10 h-10 rounded-full border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbVivBe7vcYzCWx9pl72sLES8LglsOjyhj4ChKh_gLm1QOZMp49cGe9hM_BrlGre77_8dnU4-pR0BCT-8uMoejIZlB4ojnBlZJttg9s0xAMYezaBKNL7WTlEFAUNUuPY_ROt0E_k342JXjDqnSaCqkvQ1skMaLXfPAfg-g4Lbyh1L41TqGXYbFU4l9Ee2ePIXNjAFM93lNEpwmpji0nLheq6-wC0MEVKgS7Oy3sLFvG4nfRwAbDL5Q_KpqYBIC1QsCptMBbi7oodI" />
                            </div>
                            <p className="text-white text-sm font-medium">
                                Trusted by <span className="text-secondary-container font-bold">12,000+</span> businesses worldwide.
                            </p>
                        </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl"></div>
                </section>

                {/* Right Section: Login Card */}
                <section className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface">
                    <div className="w-full max-w-[440px]">
                        {/* Mobile Logo (Visible only on small screens) */}
                        <div className="flex md:hidden items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            </div>
                            <span className="font-headline text-xl font-bold text-on-surface tracking-tight">Vyapar Ledger</span>
                        </div>
                        <header className="mb-8 text-center md:text-left">
                            <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Welcome back</h2>
                            <p className="text-on-surface-variant font-medium">Please enter your credentials to access the ledger.</p>
                        </header>

                        {/* Role Selector for Google Login */}
                        <div className="space-y-1.5 mb-6">
                            <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="role">Workspace Role (For Google Login)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">shield_person</span>
                                </div>
                                <select
                                    className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest border-0 ring-1 ring-outline-variant focus:ring-2 focus:ring-primary/40 rounded-xl focus:bg-white transition-all text-on-surface font-medium shadow-sm appearance-none"
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-on-surface-variant">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low transition-colors rounded-lg font-medium text-sm text-on-surface"
                                disabled={loading}
                            >
                                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqxr73NJUTwWxQHU6-UnVhPP8wG6tsK72jahKlmMlk5F2d_2sXthZmx0gAio2nYVtPeD1FU3L30ETB3QKak9CzL5UZ-MVoV74cVOndk8tl8yxfTYzVZLKvpdZCUxRFiUtxhd4V_mMhhlxkMXaeYjn6fiyGzu2RpuFkKBzDwRIdd310ngBh-GmOL1aazEERDs4nRn0_IBu2KBRVs1OdUkZ_89OLvQfUqRGbBWFSoWTPIdKiskphTkHyfsQH2wWk0MtqTD-oZqP-d28" />
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low transition-colors rounded-lg font-medium text-sm text-on-surface">
                                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">key</span>
                                SSO
                            </button>
                        </div>

                        <div className="relative flex items-center justify-center mb-8">
                            <div className="w-full border-t border-outline-variant"></div>
                            <span className="absolute px-4 bg-surface text-on-surface-variant text-xs font-bold uppercase tracking-widest">Or continue with</span>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                                <div className="relative group">
                                    <input
                                        className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant focus:ring-2 focus:ring-primary/40 rounded-lg py-3.5 px-4 transition-all outline-none text-on-surface font-medium placeholder:text-outline/60"
                                        id="email"
                                        placeholder="name@company.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="password">Password</label>
                                    <Link className="text-xs font-semibold text-primary hover:text-primary-container transition-colors" to="/forgot-password">Forgot Password?</Link>
                                </div>
                                <div className="relative group">
                                    <input
                                        className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant focus:ring-2 focus:ring-primary/40 rounded-lg py-3.5 px-4 transition-all outline-none text-on-surface font-medium placeholder:text-outline/60"
                                        id="password"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                                <button
                                    className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    type="submit"
                                    disabled={loading}
                                >
                                    <span>{loading ? 'Signing in...' : 'Sign in to Account'}</span>
                                </button>
                            </div>
                        </form>

                        <footer className="mt-12 text-center">
                            <p className="text-on-surface-variant font-medium">
                                Don't have an account?
                                <Link className="text-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1" to="/signup">Create one now</Link>
                            </p>
                        </footer>
                    </div>
                </section>
            </main>

            {/* Footer Component */}
            <footer className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-6 mt-auto bg-surface-container-low border-t border-outline-variant font-body text-xs text-on-surface-variant">
                <div className="mb-4 md:mb-0">
                    © 2024 Vyapar Ledger. Precision in every entry.
                </div>
                <div className="flex gap-6">
                    <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-primary transition-colors" href="#">Contact Support</a>
                </div>
            </footer>
        </div>
    );
};

export default Login;
