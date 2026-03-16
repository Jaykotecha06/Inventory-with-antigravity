import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");

        setLoading(true);
        try {
            const resultAction = await dispatch(forgotPassword(email));
            if (forgotPassword.fulfilled.match(resultAction)) {
                setSent(true);
                toast.success('Reset link sent successfully!');
            } else {
                toast.error(resultAction.payload || 'Failed to send reset email');
            }
        } catch (err) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full text-green-600 animate-bounce">
                            <CheckCircle size={48} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Email Sent!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        We've sent a secure password reset link to <br />
                        <span className="font-bold text-gray-900">{email}</span>. <br />
                        Please check your inbox (and spam folder).
                    </p>
                    <Link
                        to="/login"
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                            <Mail size={40} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-center text-gray-500 mb-8 leading-relaxed">
                        For your security, we'll send a link to your email to verify it's you and set a new password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Registered Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email address"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all duration-200"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send size={18} className="mr-2" />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
