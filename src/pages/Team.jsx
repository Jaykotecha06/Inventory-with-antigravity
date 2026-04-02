import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamMembers, inviteUser, removeTeamMember } from '../redux/slices/teamSlice';
import { Plus, Trash2, Mail, Shield, User as UserIcon, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Team = () => {
    const dispatch = useDispatch();
    const { activeBusiness } = useSelector(state => state.business);
    const { members, invitations, loading } = useSelector(state => state.team);
    const { user } = useSelector(state => state.auth);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Staff');

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchTeamMembers(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!activeBusiness?.id) return;

        if (!email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            await dispatch(inviteUser({ businessId: activeBusiness.id, email, password, role })).unwrap();
            toast.success('Invitation sent successfully!');
            setIsModalOpen(false);
            setEmail('');
            setPassword('');
            setRole('Staff');
        } catch (error) {
            toast.error('Failed to send invitation');
        }
    };

    const handleRemove = async (id, type, userId) => {
        if (!activeBusiness?.id) return;

        const isSelf = userId === user?.uid;
        if (isSelf) {
            toast.error("You cannot remove yourself from here.");
            return;
        }

        if (window.confirm(`Are you sure you want to ${type === 'invitation' ? 'revoke this invitation' : 'remove this team member'}?`)) {
            try {
                await dispatch(removeTeamMember({ businessId: activeBusiness.id, id, type, userId })).unwrap();
                toast.success(type === 'invitation' ? 'Invitation revoked' : 'Member removed');
            } catch (error) {
                toast.error('Failed to remove');
            }
        }
    };

    if (!activeBusiness) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                    <p className="text-gray-500 mb-6">Select a business profile to manage team members.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Team Management</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">Manage access to {activeBusiness?.name}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" /> Invite Member
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Active Members</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {/* The owner is not stored in users list, but we can display them based on activeBusiness.ownerId if we want, but for now we'll just show the invited members */}
                            {members.length > 0 ? members.map((member) => (
                                <tr key={member.userId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <UserIcon size={16} className="text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 flex items-center w-max rounded-md text-xs font-bold uppercase ${member.role === 'Manager' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                            <Shield size={12} className="mr-1" /> {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleRemove(null, 'active', member.userId)}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500 italic">No additional active members.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {invitations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-amber-50/50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center"><Clock size={18} className="mr-2 text-amber-500" /> Pending Invitations</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {invitations.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900 font-medium">
                                                <Mail size={16} className="text-gray-400 mr-2" />
                                                {inv.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-gray-100 text-gray-600">
                                                {inv.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleRemove(inv.id, 'invitation', null)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-in zoom-in duration-300 z-10 m-4">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
                                <p className="text-sm text-gray-500 mt-1">They will receive an invitation when they log in.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="colleague@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Set a password for them"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Assign Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setRole('Manager')}
                                        className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center transition-all ${role === 'Manager' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <Shield size={20} className="mb-1" />
                                        <span className="font-bold text-sm">Manager</span>
                                    </div>
                                    <div
                                        onClick={() => setRole('Staff')}
                                        className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center transition-all ${role === 'Staff' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <UserIcon size={20} className="mb-1" />
                                        <span className="font-bold text-sm">Staff</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 ml-1">
                                    {role === 'Manager' ? 'Managers can edit and manage items but cannot alter business settings.' : 'Staff can only create records (like invoices) and view public data.'}
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md disabled:bg-indigo-400">
                                    {loading ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
