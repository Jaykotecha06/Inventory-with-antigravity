import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, updateUserRole, deleteUser } from '../redux/slices/userSlice';
import toast from 'react-hot-toast';
import { Shield, User, Trash2, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    const dispatch = useDispatch();
    const { items: users, loading } = useSelector(state => state.users);
    const { user: currentUser } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const handleRoleUpdate = async (uid, newRole) => {
        try {
            await dispatch(updateUserRole({ uid, role: newRole })).unwrap();
            toast.success('User role updated!');
        } catch (error) {
            toast.error(error);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (uid === currentUser.uid) return toast.error("You cannot delete yourself!");
        if (window.confirm('Delete this user account?')) {
            try {
                await dispatch(deleteUser(uid)).unwrap();
                toast.success('User deleted!');
            } catch (error) {
                toast.error(error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-gray-900 p-3 rounded-xl text-white">
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
                    <p className="text-sm text-gray-500">Manage users, roles and system configurations</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <Shield size={20} className="mr-2 text-indigo-600" /> User Access Management
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50 uppercase text-xs text-gray-500 font-bold tracking-tight">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Current Role</th>
                                <th className="p-4">Change Role</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-800">{user.name} {user.id === currentUser.uid && <span className="text-xs text-indigo-500 font-bold ml-1">(You)</span>}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            className="text-sm border rounded-md p-1 focus:ring-indigo-500"
                                            value={user.role}
                                            disabled={user.id === currentUser.uid}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Staff">Staff</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-400 hover:text-red-600 disabled:opacity-20"
                                            disabled={user.id === currentUser.uid}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed">
                    <h3 className="font-bold text-gray-800 mb-2">General Settings</h3>
                    <p className="text-sm text-gray-500">Store name, currency, and regional settings.</p>
                    <div className="mt-4 py-2 px-4 bg-gray-50 text-xs text-gray-400 font-bold inline-block rounded-md uppercase tracking-widest">Planned</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed">
                    <h3 className="font-bold text-gray-800 mb-2">Backups & Data</h3>
                    <p className="text-sm text-gray-500">Export your database and local spreadsheets.</p>
                    <div className="mt-4 py-2 px-4 bg-gray-50 text-xs text-gray-400 font-bold inline-block rounded-md uppercase tracking-widest">Planned</div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
