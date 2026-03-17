import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer } from '../redux/slices/customerSlice';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const Customers = () => {
    const dispatch = useDispatch();
    const { items: customers, loading } = useSelector(state => state.customers);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState({ name: '', phone: '', email: '', address: '', type: 'Customer' });

    // Pagination & Filter States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

    // Reset pagination on search, filter, or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, customDateRange, itemsPerPage]);

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchCustomers(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    const getFilteredCustomers = () => {
        let result = customers;

        if (searchTerm) {
            result = result.filter(c =>
                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone?.includes(searchTerm)
            );
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter !== 'all') {
            result = result.filter(c => {
                const cDate = c.createdAt;
                if (!cDate) return dateFilter === 'all';

                switch (dateFilter) {
                    case 'today':
                        return cDate >= todayStart;
                    case 'yesterday':
                        return cDate >= (todayStart - 86400000) && cDate < todayStart;
                    case 'this_week':
                        const weekStart = todayStart - now.getDay() * 86400000;
                        return cDate >= weekStart;
                    case 'this_month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                        return cDate >= monthStart;
                    case 'last_month':
                        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime() + 86399999;
                        return cDate >= lastMonthStart && cDate <= lastMonthEnd;
                    case 'custom':
                        if (customDateRange.from && customDateRange.to) {
                            const from = new Date(customDateRange.from).getTime();
                            const to = new Date(customDateRange.to).getTime() + 86399999;
                            return cDate >= from && cDate <= to;
                        }
                        return true;
                    default:
                        return true;
                }
            });
        }
        return [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    };

    const finalFiltered = getFilteredCustomers();
    const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);
    const paginatedCustomers = finalFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setCurrentCustomer(customer);
            setIsEditing(true);
        } else {
            setCurrentCustomer({ name: '', phone: '', email: '', address: '', type: 'Customer' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCustomer({ name: '', phone: '', email: '', address: '', type: 'Customer' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await dispatch(updateCustomer(currentCustomer)).unwrap();
                toast.success('Customer updated!');
            } else {
                await dispatch(addCustomer({ ...currentCustomer, businessId: activeBusiness.id })).unwrap();
                toast.success('Customer added!');
            }
            handleCloseModal();
        } catch (error) {
            toast.error(error || 'Failed to save customer');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await dispatch(deleteCustomer(id)).unwrap();
                toast.success('Customer deleted!');
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    const canManage = ['Admin', 'Manager'].includes(user?.role);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition">
                    <Plus size={18} className="mr-2" /> Add Customer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!activeBusiness}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search by name or phone..."
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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedCustomers.length > 0 ? paginatedCustomers.map((customer, index) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                                        {((currentPage - 1) * itemsPerPage) + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${customer.type === 'Supplier' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    {customer.name?.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${customer.type === 'Supplier' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {customer.type || 'Customer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]">{customer.address || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleOpenModal(customer)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">
                                        {loading ? 'Loading customers...' : 'No customers found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="fixed inset-0 z-[60] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-indigo-600 rotate-45" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">You need to select a business profile before managing customers.</p>
                        <a href="/businesses" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Type *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Customer', 'Supplier'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setCurrentCustomer({ ...currentCustomer, type: t })}
                                            className={`py-3 rounded-xl font-black uppercase tracking-widest text-xs border-2 transition-all ${currentCustomer.type === t
                                                    ? t === 'Supplier' ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">{currentCustomer.type === 'Supplier' ? 'Supplier' : 'Customer'} Name *</label>
                                <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentCustomer.name} onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                    <input type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentCustomer.phone} onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                    <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentCustomer.email} onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                                <textarea rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentCustomer.address} onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })} />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-2 bg-indigo-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                    {isEditing ? 'Update Customer' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
