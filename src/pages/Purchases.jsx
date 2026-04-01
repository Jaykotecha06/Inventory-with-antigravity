import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Plus, Search, Edit, Trash2, Eye,
    ChevronLeft, ChevronRight, Filter, ClipboardList, IndianRupee, X
} from 'lucide-react';
import CreatePurchase from './CreatePurchase';
import { fetchPurchases, deletePurchase, updatePurchase } from '../redux/slices/purchaseSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import toast from 'react-hot-toast';

const Purchases = () => {
    const dispatch = useDispatch();
    const { items: purchases, loading } = useSelector(state => state.purchases);
    const { activeBusiness } = useSelector(state => state.business);

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingPurchase, setViewingPurchase] = useState(null);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, purchase: null, amount: '', method: 'Cash' });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        if (activeBusiness?.id) dispatch(fetchPurchases(activeBusiness.id));
    }, [dispatch, activeBusiness]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFilter, customDateRange, itemsPerPage]);

    const getFiltered = () => {
        let result = purchases.filter(p => p.businessId === activeBusiness?.id);

        if (searchTerm) {
            result = result.filter(p =>
                p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter !== 'all') {
            result = result.filter(p => {
                const d = p.createdAt;
                if (!d) return true;
                switch (dateFilter) {
                    case 'today': return d >= todayStart;
                    case 'yesterday': return d >= (todayStart - 86400000) && d < todayStart;
                    case 'this_week': return d >= (todayStart - now.getDay() * 86400000);
                    case 'this_month': return d >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                    case 'last_month': {
                        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                        const e = new Date(now.getFullYear(), now.getMonth(), 0).getTime() + 86399999;
                        return d >= s && d <= e;
                    }
                    case 'custom':
                        if (customDateRange.from && customDateRange.to) {
                            return d >= new Date(customDateRange.from).getTime() &&
                                d <= new Date(customDateRange.to).getTime() + 86399999;
                        }
                        return true;
                    default: return true;
                }
            });
        }

        return result.sort((a, b) => b.createdAt - a.createdAt);
    };

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleDelete = async (purchase) => {
        if (window.confirm(`Delete Purchase Order? This will reverse the stock.`)) {
            try {
                await dispatch(deletePurchase(purchase)).unwrap();
                dispatch(fetchProducts(activeBusiness.id));
                toast.success('Purchase deleted and stock reversed');
            } catch (error) {
                toast.error(error.message || 'Failed to delete');
            }
        }
    };

    if (isCreateOpen) return <CreatePurchase key="create" onClose={() => setIsCreateOpen(false)} />;
    if (viewingPurchase) return (
        <CreatePurchase
            key={`view-${viewingPurchase.id}`}
            onClose={() => setViewingPurchase(null)}
            purchaseData={viewingPurchase}
            isViewing={true}
            onEdit={(p) => { setViewingPurchase(null); setEditingPurchase(p); }}
        />
    );
    if (editingPurchase) return (
        <CreatePurchase
            key={`edit-${editingPurchase.id}`}
            onClose={() => setEditingPurchase(null)}
            purchaseData={editingPurchase}
            isViewing={false}
        />
    );

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const { purchase, amount, method } = paymentModal;
        const paidAmount = Number(amount);
        if (paidAmount <= 0 || paidAmount > purchase.balanceDue) {
            return toast.error("Invalid payment amount");
        }

        try {
            const newAmountPaid = (purchase.amountPaid || 0) + paidAmount;
            const newBalanceDue = purchase.totalAmount - newAmountPaid;
            const newPaymentStatus = newBalanceDue <= 0 ? 'Paid' : 'Partial';

            const newPaymentRecord = {
                id: Date.now().toString(),
                date: Date.now(),
                amount: paidAmount,
                method: method,
                notes: 'Subsequent Payment'
            };

            const updatedPurchase = {
                ...purchase,
                amountPaid: newAmountPaid,
                balanceDue: newBalanceDue,
                paymentStatus: newPaymentStatus,
                paymentHistory: [...(purchase.paymentHistory || []), newPaymentRecord]
            };

            await dispatch(updatePurchase({ id: purchase.id, oldPurchase: purchase, newPurchaseData: updatedPurchase })).unwrap();
            toast.success("Payment recorded successfully");
            setPaymentModal({ isOpen: false, purchase: null, amount: '', method: 'Cash' });
        } catch (error) {
            toast.error(error.message || "Failed to record payment");
        }
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    disabled={!activeBusiness}
                    className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition font-semibold ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                    <Plus size={18} className="mr-2" /> New Purchase Order
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
                    {/* Search */}
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!activeBusiness}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-gray-50"
                            placeholder="Search supplier or bill no..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500"
                                    value={customDateRange.from}
                                    onChange={e => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                                />
                                <span className="text-gray-400 text-xs">to</span>
                                <input
                                    type="date"
                                    className="border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500"
                                    value={customDateRange.to}
                                    onChange={e => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <select
                                className="bg-white border border-gray-300 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider text-gray-700 outline-none focus:ring-1 focus:ring-orange-500 appearance-none pr-8"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Show</span>
                            <select
                                className="bg-white border border-gray-300 px-2 py-1 rounded text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-orange-500"
                                value={itemsPerPage}
                                onChange={e => setItemsPerPage(Number(e.target.value))}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {displayed.length > 0 ? displayed.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Sr No */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>

                                    {/* Supplier */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                                    {p.supplierName?.charAt(0)?.toUpperCase() || <ClipboardList size={16} />}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{p.supplierName || '—'}</div>
                                                {p.supplierPhone && (
                                                    <div className="text-xs text-gray-500">{p.supplierPhone}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Bill No */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-orange-600">{p.billNo || '—'}</span>
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {p.purchaseDate || new Date(p.createdAt).toLocaleDateString('en-IN')}
                                    </td>

                                    {/* Items count */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                                            {p.items?.length || 0} item{p.items?.length !== 1 ? 's' : ''}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-black rounded-full uppercase tracking-widest ${p.paymentStatus === 'Credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {p.paymentStatus || 'Paid'}
                                        </span>
                                    </td>

                                    {/* Amount */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                        ₹{Number(p.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>

                                    {/* Balance */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-red-600 tracking-tight">
                                        {p.balanceDue > 0 ? `₹${Number(p.balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setPaymentModal({ isOpen: true, purchase: p, amount: p.balanceDue, method: 'Cash' })}
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm ${p.balanceDue > 0 ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white' : 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400'}`}
                                                title="Record Payment"
                                                disabled={!p.balanceDue || p.balanceDue <= 0}
                                            >
                                                <IndianRupee size={14} />
                                            </button>
                                            <button
                                                onClick={() => setViewingPurchase(p)}
                                                className="text-orange-600 hover:text-orange-900 bg-orange-50 p-1.5 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingPurchase(p)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 italic">
                                        {loading
                                            ? 'Loading purchases...'
                                            : searchTerm
                                                ? `No results for "${searchTerm}"`
                                                : 'No purchase orders found. Create your first one!'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Page {currentPage} of {totalPages || 1}
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
                        <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-orange-600 rotate-45" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">You need to select a business profile before managing purchases.</p>
                        <a href="/businesses" className="block w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition shadow-lg">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200 border border-gray-100">
                        <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest">Pay Supplier</h3>
                                <p className="text-orange-200 text-xs font-bold mt-1 uppercase tracking-wider">PO #{paymentModal.purchase?.id.substring(paymentModal.purchase.id.length - 6).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setPaymentModal({ isOpen: false, purchase: null, amount: '', method: 'Cash' })} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-6 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Amount to Pay (₹)</label>
                                <input
                                    type="number"
                                    max={paymentModal.purchase?.balanceDue}
                                    min="1"
                                    step="0.01"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                    value={paymentModal.amount}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                />
                                <p className="text-[10px] font-bold text-orange-500 mt-2 uppercase tracking-wide">Pending Balance: ₹{paymentModal.purchase?.balanceDue?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
                                    value={paymentModal.method}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online / UPI</option>
                                    <option value="Card">Card / Bank</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition shadow-xl shadow-orange-100 active:scale-95">
                                Record Payment to Supplier
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
