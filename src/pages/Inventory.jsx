import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { recordStockMovement, updateInventoryLog, deleteInventoryLog, fetchInventoryLogs } from '../redux/slices/inventorySlice';
import { fetchProducts } from '../redux/slices/productSlice';
import toast from 'react-hot-toast';
import { ArrowDownCircle, ArrowUpCircle, Eye, Trash2, Filter, X, ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';

const Inventory = () => {
    const dispatch = useDispatch();
    const { items: products } = useSelector(state => state.products);
    const { logs, loading } = useSelector(state => state.inventory);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    const [modalType, setModalType] = useState(null); // 'IN' or 'OUT'
    const [isViewing, setIsViewing] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(null);
    const [formData, setFormData] = useState({ productId: '', quantity: '', reason: '' });

    // Pagination & Filter States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'IN', 'OUT'
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

    const remarkOptions = {
        IN: ['Purchase', 'Sales Return', 'Stock Correction', 'Other'],
        OUT: ['Sale', 'Purchase Return', 'Damage', 'Expiry', 'Usage', 'Stock Correction', 'Other']
    };

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchInventoryLogs(activeBusiness.id));
            dispatch(fetchProducts(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    // Reset pagination on filter or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, typeFilter, customDateRange, itemsPerPage]);

    const getFilteredLogs = () => {
        let result = logs;

        if (typeFilter !== 'all') {
            result = result.filter(log => log.type === typeFilter);
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter !== 'all') {
            result = result.filter(log => {
                const logDate = log.date;
                if (!logDate) return dateFilter === 'all';

                switch (dateFilter) {
                    case 'today':
                        return logDate >= todayStart;
                    case 'yesterday':
                        return logDate >= (todayStart - 86400000) && logDate < todayStart;
                    case 'this_week':
                        const weekStart = todayStart - now.getDay() * 86400000;
                        return logDate >= weekStart;
                    case 'this_month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                        return logDate >= monthStart;
                    case 'last_month':
                        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime() + 86399999;
                        return logDate >= lastMonthStart && logDate <= lastMonthEnd;
                    case 'custom':
                        if (customDateRange.from && customDateRange.to) {
                            const from = new Date(customDateRange.from).getTime();
                            const to = new Date(customDateRange.to).getTime() + 86399999;
                            return logDate >= from && logDate <= to;
                        }
                        return true;
                    default:
                        return true;
                }
            });
        }
        return [...result].sort((a, b) => b.date - a.date);
    };

    const finalFiltered = getFilteredLogs();
    const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);
    const paginatedLogs = finalFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isViewing) return;
        if (!formData.productId || !formData.quantity || !formData.reason) return toast.error("Please fill required fields");

        try {
            await dispatch(recordStockMovement({
                ...formData,
                type: modalType,
                user: user.name || user.email,
                quantity: Number(formData.quantity),
                businessId: activeBusiness.id
            })).unwrap();
            dispatch(fetchProducts(activeBusiness.id));
            toast.success(`Stock ${modalType === 'IN' ? 'added' : 'removed'} successfully`);
            handleCloseModal();
        } catch (error) {
            toast.error(error || "Action failed");
        }
    };

    const handleDelete = async (log) => {
        if (window.confirm("Are you sure you want to delete this movement? This will reverse the stock change.")) {
            try {
                await dispatch(deleteInventoryLog(log)).unwrap();
                dispatch(fetchProducts(activeBusiness.id));
                toast.success("Movement deleted");
            } catch (error) {
                toast.error(error || "Delete failed");
            }
        }
    };

    const handleView = (log) => {
        setModalType(log.type);
        setFormData({ productId: log.productId, quantity: log.quantity, reason: log.reason || '' });
        setCurrentLogId(log.id);
        setIsViewing(true);
    };

    const handleCloseModal = () => {
        setModalType(null);
        setIsViewing(false);
        setCurrentLogId(null);
        setFormData({ productId: '', quantity: '', reason: '' });
    };

    const getProductName = (id) => {
        const p = products.find(p => p.id === id);
        return p ? p.name : 'Unknown Product';
    }

    const canManage = ['Admin', 'Manager'].includes(user?.role);

    return (
        <div className="space-y-6 relative min-h-[400px]">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Inventory Management</h1>
                <div className="flex gap-3">
                    <button
                        disabled={!activeBusiness}
                        onClick={() => { setModalType('IN'); setIsViewing(false); }}
                        className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        <ArrowUpCircle size={18} className="mr-2" /> Stock IN
                    </button>
                    <button
                        disabled={!activeBusiness}
                        onClick={() => { setModalType('OUT'); setIsViewing(false); }}
                        className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <ArrowDownCircle size={18} className="mr-2" /> Stock OUT
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-48">
                            <select
                                className="bg-white border border-gray-300 w-full px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">Direction: All</option>
                                <option value="IN">Direction: Stock IN</option>
                                <option value="OUT">Direction: Stock OUT</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <Layers size={14} className="text-gray-400" />
                            </div>
                        </div>

                        <div className="relative w-full sm:w-48">
                            <select
                                className="bg-white border border-gray-300 w-full px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="all">Date: All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <Calendar size={14} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
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

                    </div>
                </div>

                {/* Table View Component - Hidden on small screens */}
                <div className="hidden lg:block overflow-x-auto no-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">No</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Product</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Qty</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Remark</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">User</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedLogs.map((log, index) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-bold">
                                        {((currentPage - 1) * itemsPerPage) + index + 1}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-500">
                                        {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 inline-flex text-[9px] font-black rounded uppercase ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900 truncate max-w-[120px]">{getProductName(log.productId)}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-xs font-black ${log.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.type === 'IN' ? '+' : '-'}{log.quantity}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-500 font-medium truncate max-w-[100px]">{log.reason || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-500 truncate max-w-[80px]">{log.user?.split('@')[0]}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleView(log)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-lg transition-colors" title="View"><Eye size={14} /></button>
                                            <button onClick={() => handleDelete(log)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Component - Hidden on large screens */}
                <div className="lg:hidden divide-y divide-gray-100 bg-white">
                    {paginatedLogs.map((log, index) => (
                        <div key={log.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400">#{((currentPage - 1) * itemsPerPage) + index + 1}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {log.type}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleView(log)} className="text-indigo-600 bg-indigo-50 p-2 rounded-lg"><Eye size={16} /></button>
                                    <button onClick={() => handleDelete(log)} className="text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-black text-gray-900">{getProductName(log.productId)}</div>
                                    <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Calendar size={10} /> {new Date(log.date).toLocaleString()}
                                    </div>
                                </div>
                                <div className={`text-lg font-black ${log.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.type === 'IN' ? '+' : '-'}{log.quantity}
                                </div>
                            </div>
                            <div className="pt-1 flex justify-between items-center">
                                <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {log.reason}
                                </div>
                                <div className="text-[11px] text-gray-400">by {log.user}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {paginatedLogs.length === 0 && activeBusiness && (
                    <div className="px-6 py-12 text-center">
                        <div className="text-gray-400 italic mb-2">No inventory movements matching your filters.</div>
                        <button
                            onClick={() => { setTypeFilter('all'); setDateFilter('all'); }}
                            className="text-indigo-600 text-sm font-bold hover:underline"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}

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
                <div className="absolute inset-0 z-10 bg-gray-50/50 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ArrowUpCircle className="text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">Select a business profile to track stock movements.</p>
                        <a href="/businesses" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                            <h3 className={`text-xl font-black uppercase tracking-tight ${modalType === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                {isViewing ? `View Stock ${modalType}` : `Stock ${modalType}`}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 no-scrollbar max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Product *</label>
                                <select
                                    required
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isViewing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                >
                                    <option value="">Select Product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Cur: {p.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Quantity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isViewing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Remark / Reason *</label>
                                <select
                                    required
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold ${isViewing ? 'opacity-70 cursor-not-allowed text-gray-900' : 'text-gray-700'}`}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                >
                                    <option value="">Select Reason...</option>
                                    {remarkOptions[modalType].map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">
                                    {isViewing ? 'Close' : 'Cancel'}
                                </button>
                                {!isViewing && (
                                    <button type="submit" className={`flex-2 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg ${modalType === 'IN' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}>
                                        Confirm Stock {modalType}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
