import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBusinesses, createBusiness, updateBusinessSlice, deleteBusinessSlice, setActiveBusiness } from '../redux/slices/businessSlice';
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail, PlusCircle, Briefcase, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Businesses = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { items: businesses, loading, activeBusiness } = useSelector(state => state.business);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentBusinessId, setCurrentBusinessId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Retail',
        address: '',
        phone: '',
        email: '',
        gstin: ''
    });

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchBusinesses(user.uid));
        }
    }, [dispatch, user]);

    const handleOpenModal = (business = null) => {
        if (business) {
            setFormData({
                name: business.name,
                category: business.category || 'Retail',
                address: business.address || '',
                phone: business.phone || '',
                email: business.email || '',
                gstin: business.gstin || ''
            });
            setCurrentBusinessId(business.id);
            setIsEditMode(true);
        } else {
            setFormData({ name: '', category: 'Retail', address: '', phone: '', email: '', gstin: '' });
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
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Businesses</h1>
                    <p className="text-gray-500 mt-1">Create and switch between your multiple business profiles.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 font-bold"
                >
                    <Plus size={20} /> Add New Business
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Business Information</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Industry</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {businesses.map((business) => (
                                <tr
                                    key={business.id}
                                    className={`group hover:bg-indigo-50/30 transition-colors cursor-pointer ${activeBusiness?.id === business.id ? 'bg-indigo-50/50' : ''}`}
                                    onClick={() => handleSelectBusiness(business)}
                                >
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${activeBusiness?.id === business.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-all`}>
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{business.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{business.address || 'Global/Online'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-white border border-gray-100 text-gray-500 uppercase tracking-widest shadow-sm">
                                            {business.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Phone size={12} className="text-gray-300" />
                                                <span className="font-bold">{business.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                                <Mail size={12} className="text-gray-300" />
                                                <span className="font-medium">{business.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {activeBusiness?.id === business.id ? (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Active Workspace</span>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 py-1.5">Inactive</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(business)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-indigo-50"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(business.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-red-50"
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

                {businesses.length === 0 && !loading && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="bg-indigo-50 p-8 rounded-full mb-6">
                            <Briefcase size={64} className="text-indigo-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">No Business Profiles Found</h3>
                        <p className="text-gray-400 max-w-sm mx-auto mt-3 font-medium px-4">
                            Create your first business profile to start managing inventory, products, and sales separately.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-100 active:scale-95 flex items-center gap-2"
                        >
                            <PlusCircle size={22} /> Create My First Business
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {isEditMode ? 'Edit Business Details' : 'Register New Business'}
                                </h2>
                                <p className="text-gray-500 text-sm font-medium">Enter the official information for your business.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-gray-900 transition-all border border-gray-100 hover:border-gray-200">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">Business Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Apple Store, Local Grocery"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">Industry Category</label>
                                    <select
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold appearance-none cursor-pointer"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Retail">Retail Shop</option>
                                        <option value="Wholesale">Wholesale Trading</option>
                                        <option value="Manufacturer">Manufacturing</option>
                                        <option value="Service">Professional Service</option>
                                        <option value="Restaurant">Food & Restaurant</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">Contact Number</label>
                                    <input
                                        type="tel"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">Complete Office Address</label>
                                    <textarea
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold h-24 resize-none"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Street, City, State, ZIP..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">Business Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="shop@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-widest text-[10px]">GSTIN (Tax ID)</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold uppercase"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-3 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-100 active:scale-95"
                                >
                                    {isEditMode ? 'Update Business' : 'Launch Business'}
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
