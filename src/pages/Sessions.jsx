import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSessions, revokeSession } from '../redux/slices/sessionSlice';
import { Laptop, Clock, User, LogOut, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Sessions = () => {
    const dispatch = useDispatch();
    const { user, sessionId: currentSessionId } = useSelector(state => state.auth);
    const { items: sessions, loading } = useSelector(state => state.sessions);

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchSessions(user.uid));
        }
    }, [dispatch, user?.uid]);

    const handleRevoke = async (sessionId) => {
        if (window.confirm('Are you sure you want to log out of this device?')) {
            try {
                await dispatch(revokeSession({ uid: user.uid, sessionId })).unwrap();
                toast.success('Session revoked successfully');
            } catch (error) {
                toast.error(error || 'Failed to revoke session');
            }
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-forest-green p-3 rounded-2xl text-white shadow-lg shadow-forest-green/20">
                    <Laptop size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Active Sessions</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage your logged-in devices and security</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Device / Browser</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Login Date</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-forest-green border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading sessions...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && sessions.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 font-medium">
                                        No active sessions found.
                                    </td>
                                </tr>
                            )}
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${session.id === currentSessionId ? 'bg-forest-green/10 text-forest-green' : 'bg-gray-100 text-gray-400'}`}>
                                                <Laptop size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 tracking-tight">{session.device}</p>
                                                <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                    <User size={12} /> {session.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                            <Clock size={16} className="text-gray-300" />
                                            {formatDate(session.loginDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {session.id === currentSessionId ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200 animate-pulse">
                                                <ShieldCheck size={12} /> This Device
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => handleRevoke(session.id)}
                                            disabled={session.id === currentSessionId}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                ${session.id === currentSessionId
                                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                                                    : 'text-red-500 hover:bg-red-50 active:scale-95'}`}
                                        >
                                            <LogOut size={14} />
                                            Logout
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <p className="text-sm text-amber-800 font-bold flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} /> Security Tip
                </p>
                <p className="text-sm text-amber-700 font-medium leading-relaxed">
                    If you notice any unfamiliar devices or unexpected login dates, we recommend logging out of those sessions immediately and changing your password for enhanced security.
                </p>
            </div>
        </div>
    );
};

export default Sessions;
