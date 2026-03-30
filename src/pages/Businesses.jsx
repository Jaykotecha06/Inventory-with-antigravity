import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBusinesses, createBusiness, updateBusinessSlice, deleteBusinessSlice, setActiveBusiness } from '../redux/slices/businessSlice';
import { fetchUserInvitations, acceptInvitation } from '../redux/slices/teamSlice';
import { Plus, Edit, Trash2, Building2, MapPin, Phone, Mail, PlusCircle, Briefcase, CheckCircle2, Search, Filter, ChevronLeft, ChevronRight, X, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Businesses = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { items: businesses, loading, activeBusiness } = useSelector(state => state.business);
    const { userPendingInvitations } = useSelector(state => state.team);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentBusinessId, setCurrentBusinessId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Retail',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        upiId: ''
    });

    // Pagination & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

    // Reset pagination on search, filter, or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, customDateRange, itemsPerPage]);

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchBusinesses(user.uid));
        }
        if (user?.email) {
            dispatch(fetchUserInvitations(user.email));
        }
    }, [dispatch, user]);

    const handleAcceptInvite = async (invite) => {
        try {
            await dispatch(acceptInvitation({
                invitationId: invite.id,
                businessId: invite.businessId,
                userId: user.uid,
                email: user.email,
                role: invite.role
            })).unwrap();
            toast.success(`Joined ${invite.businessName} as ${invite.role}!`);
            dispatch(fetchBusinesses(user.uid));
        } catch (error) {
            toast.error('Failed to accept invitation');
        }
    };

    const getFilteredBusinesses = () => {
        let result = businesses;

        if (searchTerm) {
            result = result.filter(b =>
                b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.address?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter !== 'all') {
            result = result.filter(b => {
                const bDate = b.createdAt;
                if (!bDate) return dateFilter === 'all';

                switch (dateFilter) {
                    case 'today':
                        return bDate >= todayStart;
                    case 'yesterday':
                        return bDate >= (todayStart - 86400000) && bDate < todayStart;
                    case 'this_week':
                        const weekStart = todayStart - now.getDay() * 86400000;
                        return bDate >= weekStart;
                    case 'this_month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                        return bDate >= monthStart;
                    case 'last_month':
                        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime() + 86399999;
                        return bDate >= lastMonthStart && bDate <= lastMonthEnd;
                    case 'custom':
                        if (customDateRange.from && customDateRange.to) {
                            const from = new Date(customDateRange.from).getTime();
                            const to = new Date(customDateRange.to).getTime() + 86399999;
                            return bDate >= from && bDate <= to;
                        }
                        return true;
                    default:
                        return true;
                }
            });
        }
        return [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    };

    const finalFiltered = getFilteredBusinesses();
    const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);
    const paginatedBusinesses = finalFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (business = null) => {
        if (business) {
            setFormData({
                name: business.name,
                category: business.category || 'Retail',
                address: business.address || '',
                phone: business.phone || '',
                email: business.email || '',
                gstin: business.gstin || '',
                upiId: business.upiId || ''
            });
            setCurrentBusinessId(business.id);
            setIsEditMode(true);
        } else {
            setFormData({ name: '', category: 'Retail', address: '', phone: '', email: '', gstin: '', upiId: '' });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Business name is required");

        const businessData = { ...formData, ownerId: user.uid };

        try {
            if (isEditMode) {
                await dispatch(updateBusinessSlice({ id: currentBusinessId, data: businessData })).unwrap();
                toast.success("Business updated successfully");
            } else {
                await dispatch(createBusiness(businessData)).unwrap();
                toast.success("Business created successfully");
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error || "An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this business?")) {
            try {
                await dispatch(deleteBusinessSlice(id)).unwrap();
                toast.success("Business deleted");
            } catch (error) {
                toast.error(error);
            }
        }
    };

    const handleSelectBusiness = (business) => {
        dispatch(setActiveBusiness(business));
        toast.success(`Active business switched to: ${business.name}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Manage Businesses</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-all active:scale-95 font-bold"
                >
                    <Plus size={18} className="mr-2" /> Add Business
                </button>
            </div>

            {userPendingInvitations?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mb-8">
                    <div className="p-4 border-b border-indigo-50 bg-indigo-50/50">
                        <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                            <UserPlus size={18} className="mr-2 text-indigo-600" /> Pending Invitations
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {userPendingInvitations.map(invite => (
                            <div key={invite.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">You've been invited to join <span className="text-indigo-600">{invite.businessName}</span></h3>
                                    <p className="text-xs text-gray-500 mt-1">Role assigned: <span className="font-bold text-gray-700">{invite.role}</span></p>
                                </div>
                                <button
                                    onClick={() => handleAcceptInvite(invite)}
                                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                                >
                                    <Check size={16} className="mr-1.5" /> Accept Invitation
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search by name or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={customDateRange.from}
                                    onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                                />
                                <span className="text-gray-400 text-xs">to</span>
                                <input
                                    type="date"
                                    className="border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={customDateRange.to}
                                    onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <select
                                className="bg-white border border-gray-300 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="all">All Records</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <Filter size={14} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sr No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Information</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Industry</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedBusinesses.map((business, index) => (
                                <tr
                                    key={business.id}
                                    className={`group hover:bg-gray-50/80 transition-all cursor-pointer ${activeBusiness?.id === business.id ? 'bg-indigo-50/30' : ''}`}
                                    onClick={() => handleSelectBusiness(business)}
                                >
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400 font-mono font-medium">
                                        {String(((currentPage - 1) * itemsPerPage) + index + 1).padStart(2, '0')}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${activeBusiness?.id === business.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-gray-100 text-indigo-500 shadow-sm group-hover:border-indigo-200'} transition-all duration-300`}>
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{business.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium truncate max-w-[180px] mt-0.5 flex items-center gap-1">
                                                    <MapPin size={10} /> {business.address || 'Location Hidden'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-100/50">
                                            {business.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <div className="p-1 bg-gray-50 rounded-md">
                                                    <Phone size={10} className="text-gray-400" />
                                                </div>
                                                <span className="font-bold tracking-tight">{business.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                <div className="p-1 bg-gray-50 rounded-md">
                                                    <Mail size={10} className="text-gray-400" />
                                                </div>
                                                <span className="font-medium underline decoration-gray-200 underline-offset-2 tracking-tight">{business.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {activeBusiness?.id === business.id ? (
                                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 shadow-sm w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Current Workspace</span>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 py-1.5">Available</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleOpenModal(business)}
                                                className="p-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(business.id)}
                                                className="p-1.5 text-red-600 hover:text-red-900 bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100 animate-in slide-in-from-bottom-4 duration-500">
                    {paginatedBusinesses.map((business, index) => (
                        <div
                            key={business.id}
                            className={`p-5 active:bg-gray-50 transition-colors ${activeBusiness?.id === business.id ? 'bg-indigo-50/50' : ''}`}
                            onClick={() => handleSelectBusiness(business)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${activeBusiness?.id === business.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-gray-100 text-indigo-400'}`}>
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-mono mb-1 block">#{String(((currentPage - 1) * itemsPerPage) + index + 1).padStart(2, '0')}</span>
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight leading-none">{business.name}</h3>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest">{business.category}</span>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()} className="flex gap-3">
                                    <button
                                        onClick={() => handleOpenModal(business)}
                                        className="p-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(business.id)}
                                        className="p-1.5 text-red-600 hover:text-red-900 bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                                    <p className="text-xs font-bold text-gray-700">{business.phone || 'Not set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                                    <p className="text-xs font-bold text-gray-700 truncate">{business.address || 'Online'}</p>
                                </div>
                            </div>

                            {activeBusiness?.id === business.id && (
                                <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2 text-green-600">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] border border-green-200"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Active Workspace</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Show</span>
                            <select
                                className="bg-white border border-gray-300 px-2 py-1 rounded text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500"
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {paginatedBusinesses.length === 0 && !loading && (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="bg-indigo-50 p-8 rounded-full mb-6">
                        <Briefcase size={64} className="text-indigo-200" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Business Profiles Found</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mt-3 font-medium px-4">
                        Create your first business profile to start managing inventory, products, and sales separately.
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                    >
                        <PlusCircle size={22} /> Create My First Business
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                    {isEditMode ? 'Edit Business' : 'New Business'}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Profile Settings</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto hide-scrollbar">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Business Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-gray-300"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Apple Store"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Industry</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Retail">Retail</option>
                                            <option value="Semi Wholesaller">Semi Wholesaller</option>
                                            <option value="Wholesale">Wholesale</option>


                                        </select>
                                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-gray-300"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Full Address</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold h-20 resize-none placeholder:text-gray-300"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Street details..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-gray-300"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="mail@..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">GSTIN</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-gray-300 uppercase"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">UPI ID (for Payments)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-gray-300"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                    placeholder="e.g. name@upi"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-indigo-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                                >
                                    {isEditMode ? 'Update' : 'Launch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Businesses;
