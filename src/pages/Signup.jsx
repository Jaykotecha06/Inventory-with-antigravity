import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signupUser, googleLogin } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('Admin');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resultAction = await dispatch(signupUser({ email, password, name, role }));
            if (signupUser.fulfilled.match(resultAction)) {
                toast.success('Account created successfully');
                navigate('/');
            } else {
                const errorMsg = resultAction.payload;
                if (errorMsg?.includes('auth/email-already-in-use')) {
                    toast.error('This email is already registered. Please Login instead.');
                } else if (errorMsg?.includes('auth/weak-password')) {
                    toast.error('Password is too weak. Please use at least 6 characters.');
                } else {
                    toast.error(errorMsg || 'Failed to sign up');
                }
            }
        } catch (err) {
            toast.error('An error occurred');
        }
    };

    const handleGoogleLogin = async () => {
        if (!name || role === "Select your role") {
            toast.error('Please enter your name and select a role first.');
            return;
        }
        try {
            const resultAction = await dispatch(googleLogin({ name, role }));
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
        <div className="min-h-screen flex flex-col md:flex-row bg-background font-body text-on-surface">
            {/* Left Side: Aesthetic/Branding (Hidden on mobile) */}
            <div className="hidden md:flex md:w-1/2 bg-surface-container-low flex-col justify-between p-12 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 rounded-full bg-secondary/10 blur-2xl"></div>
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <span className="font-headline text-2xl font-extrabold text-primary tracking-tight">Vyapar Ledger</span>
                    </div>
                    <h1 className="font-headline text-5xl font-bold text-on-surface leading-tight mb-6">
                        Master your <br />
                        <span className="text-primary">Inventory flow.</span>
                    </h1>
                    <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                        Join over 10,000 businesses using The Digital Ledger to track stock, manage parties, and generate professional invoices in seconds.
                    </p>
                </div>
                <div className="z-10 bg-surface-container-lowest/60 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/20 shadow-xl shadow-primary/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex -space-x-3">
                            <img className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" alt="User 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJKA4bQtXXfrU82lLHjlbRKg_JPhjEL8UqD9ue_0tEDJkRYtq77sbt-2GDoC4LHD1AxyM4lqH_8wzq1VdlaojR6YSMQQUnTdysZRrd_uYKjtgWEq4xywTaA3LwAx7wGKkIUPh5nTxfCNJvxguB3yKFZ1B7bjimSbFAWhrtDFYR4i9TctlvSNi0l9LuJ0p3aYkrN8tFYxAu_EAQ82dRH3hchy-N-jG3OKFZ84E0-lFcRA_3Dqmykz2fE4Ws4R3gmXp4njkXQOmE9cA" />
                            <img className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" alt="User 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5s6vypRtAV76kXqfXd9FCUWLE3Pjnh6fkgZAlV6OQrAMjot1N6DORccn5nukFQzQ1aAkWtzf8GkEuP_wQtR-B1-x8IySQW032LwkSp0xaXfYwdoAx1yiXFZ2CbLJX09e0GeeLEqC17-uIenSK_7uzr4CePGGbM905fO-frtbFN3AHTNfBZES6VXyk3TPXl6XRBEyEuF5s4cyqRRj4XuMUFNxp42S6NJh9FijF-GA8lTjsYHI2Nt2Rntt5CIJRfmUsrvV-hfLw25M" />
                            <img className="w-10 h-10 rounded-full border-2 border-surface-container-lowest" alt="User 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1Dn8PhzYf10mdASDmxS4NGZeiS_pS4Ys84-dd4gQqUkfAACXWm_Cmr947oaU7aHWdEl_SNFvSIt9F1eSfcCt2y70e9Bkhwy47_W1L-5e2emMwpU20VAmUyoyoRYrePi8QkyTw3D6T0PDWMn0IgsSM7cqeT9H3s98Qn12ozECKiTaBKngBFiNLWb6zOfy7eZEvwhxChe7n7N-pEcW8NVXA_IhnmmFS38eU51lZMfRD8e0-Dl5Q6LlFgGMGt9J28fyuaBEBmO1dtmo" />
                        </div>
                        <div className="text-sm font-medium text-on-surface">
                            <span className="block font-bold">4.9/5 Rating</span>
                            <span className="text-on-surface-variant text-xs">Trusted by professionals globally</span>
                        </div>
                    </div>
                    <blockquote className="text-on-surface-variant italic text-sm">
                        "The Digital Ledger transformed how we handle our warehouse stock. It's the precision architect our business needed."
                    </blockquote>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <main className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface">
                <div className="w-full max-w-[480px]">
                    {/* Mobile Logo (Only visible on small screens) */}
                    <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <span className="font-headline text-xl font-bold text-primary tracking-tight">Vyapar Ledger</span>
                    </div>

                    <div className="mb-10 text-center md:text-left">
                        <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Create an account</h2>
                        <p className="text-on-surface-variant">Get started with your 14-day free trial.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="name">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface placeholder:text-surface-dim font-medium shadow-sm"
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface placeholder:text-surface-dim font-medium shadow-sm"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Social Signup (Quick Access) */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-white hover:shadow-md transition-all text-on-surface font-semibold text-sm"
                                type="button"
                                disabled={loading}
                            >
                                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5wjFf-AHRAFZN_FdCS6cOuqBXDnZ80356FE1WIeTin4RGDRJwKJw4o1w7FLQY41w9QqzJXeXnRtpjN9Ck6HLB39oz37-4qQUprYwpb7zXw_2j2CLpUy1DQML4yTJ3zXrW9YXxZ8YFHg9ZG3UPlt8b9-4bd69bFIqhp8fzqr0yBZJuPCnksqk67_qp3NepS4V-zcLqubacEHUYjcsrpxRSs_c3-oqPUWGW8ledbiHwAFezHm3azfbaxCcT91r208IQQac2o3PgHgQ" />
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-white hover:shadow-md transition-all text-on-surface font-semibold text-sm" type="button">
                                <img alt="Facebook" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjdqMTpfViPcY4gNnHzkPKyMJnsA_fTzYWhPkRmK4O6abXU4LULmHkw6qASN9940YdKTMRszOYZ9FpS_wEk-h_uHnUfZ8yWboBMC8wLHfuvg6njQoCmCeADo4xkVpvo1TEhz4bQxyrpZOk8seQ2yZfehBgvJB_Dhv_H3MjeUQ5C-GfM-Tg4cpsLaqX2Jxstsf641L9ORgHwxA0awWpz_D-xLOhaEMFVQIc4MXXULfCFTYLg6lH8g6Zn_D73wpt3UJ2ryfWM9XTavY" />
                                Facebook
                            </button>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="role">Account Role</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">shield_person</span>
                                </div>
                                <select
                                    className="w-full pl-11 pr-10 py-3.5 bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface font-medium shadow-sm appearance-none"
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

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="password">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-12 py-3.5 bg-surface-container-lowest border-0 rounded-xl focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all text-on-surface placeholder:text-surface-dim font-medium shadow-sm"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength="6"
                                />
                                <button
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 px-1">
                            <div className="flex items-center h-5">
                                <input
                                    className="w-5 h-5 rounded border-outline text-primary focus:ring-primary/40 transition-all cursor-pointer"
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    required
                                />
                            </div>
                            <label className="text-sm text-on-surface-variant leading-tight" htmlFor="terms">
                                I agree to the <a className="text-primary font-semibold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-semibold hover:underline" href="#">Privacy Policy</a>.
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full py-4 primary-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                            type="submit"
                            disabled={loading}
                        >
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-on-surface-variant font-medium">
                        Already have an account?
                        <Link className="text-primary font-bold hover:underline ml-1 transition-all" to="/login">Log in</Link>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Signup;
