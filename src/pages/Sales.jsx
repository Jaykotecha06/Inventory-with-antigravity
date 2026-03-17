import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Calendar, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import CreateInvoice from './CreateInvoice';
import { fetchSales, deleteSale } from '../redux/slices/salesSlice';
import toast from 'react-hot-toast';

const Sales = () => {
    const dispatch = useDispatch();
    const { items: sales, loading } = useSelector(state => state.sales);
    const { activeBusiness } = useSelector(state => state.business);

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [editingInvoice, setEditingInvoice] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchSales(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const businessSales = sales.filter(s => s.businessId === activeBusiness?.id);
    const filteredSales = businessSales.filter(s =>
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);

    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const displayedSales = filteredSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isCreateOpen) {
        return <CreateInvoice key="create" onClose={() => setIsCreateOpen(false)} />;
    }

    if (viewingInvoice) {
        return (
            <CreateInvoice
                key={`view-${viewingInvoice.id}`}
                onClose={() => setViewingInvoice(null)}
                invoiceData={viewingInvoice}
                isViewing={true}
                onEdit={(invoice) => {
                    setViewingInvoice(null);
                    setEditingInvoice(invoice);
                }}
            />
        );
    }

    const handleDeleteInvoice = async (sale) => {
        if (window.confirm(`Are you sure you want to delete Invoice #${sale.id.substring(sale.id.length - 6).toUpperCase()}? This will restore the stock for all items.`)) {
            try {
                await dispatch(deleteSale(sale)).unwrap();
                toast.success("Invoice deleted and stock restored");
            } catch (error) {
                toast.error(error.message || "Failed to delete invoice");
            }
        }
    };

    if (editingInvoice) {
        return <CreateInvoice key={`edit-${editingInvoice.id}`} onClose={() => setEditingInvoice(null)} invoiceData={editingInvoice} isViewing={false} />;
    }

    return (
        <div className="space-y-6 relative min-h-[400px]">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
                        <FileText className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Sales Invoices</h1>
                </div>
                <button
                    disabled={!activeBusiness}
                    onClick={() => setIsCreateOpen(true)}
                    className={`flex items-center px-6 py-3 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-0.5'}`}
                >
                    <Plus size={18} className="mr-2" /> Create Invoice
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!activeBusiness}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Search invoice or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Show</span>
                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sr No</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {displayedSales.map((sale, index) => (
                                <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400">
                                        {((currentPage - 1) * itemsPerPage) + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-300" />
                                            {new Date(sale.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 tracking-tight">
                                        #{sale.id.substring(sale.id.length - 6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{sale.customerName || 'Walk-in Customer'}</div>
                                        {sale.customerPhone && <div className="text-[11px] font-semibold text-gray-400">{sale.customerPhone}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black rounded-full uppercase tracking-widest ${sale.paymentStatus === 'Credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {sale.paymentStatus || 'Paid'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 tracking-tight">
                                        ₹{Number(sale.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setViewingInvoice(sale)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="View Invoice"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingInvoice(sale)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                title="Edit Invoice"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvoice(sale)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {displayedSales.map((sale, index) => (
                        <div key={sale.id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            #{((currentPage - 1) * itemsPerPage) + index + 1}
                                        </span>
                                        <span className="text-sm font-black text-indigo-600 tracking-tight">
                                            INV-{sale.id.substring(sale.id.length - 6).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-gray-900">{sale.customerName || 'Walk-in Customer'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewingInvoice(sale)}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => setEditingInvoice(sale)}
                                        className="p-2 bg-green-50 text-green-600 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteInvoice(sale)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-95 transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                                        <Calendar size={12} />
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                    </div>
                                    <span className={`px-3 py-1 inline-flex text-[9px] font-black rounded-full uppercase tracking-widest ${sale.paymentStatus === 'Credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {sale.paymentStatus || 'Paid'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</div>
                                    <div className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{Number(sale.totalAmount).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredSales.length === 0 && activeBusiness && (
                    <div className="px-6 py-16 text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                            <FileText size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No Invoices Found</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            {searchTerm ? `We couldn't find any invoices matching "${searchTerm}"` : 'Your sales records will appear here once you create your first invoice.'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="p-3 border border-gray-200 rounded-xl bg-white disabled:opacity-50 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="p-3 border border-gray-200 rounded-xl bg-white disabled:opacity-50 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="absolute inset-0 z-10 bg-gray-50/60 backdrop-blur-[4px] flex items-center justify-center p-6 rounded-3xl">
                    <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl shadow-indigo-900/10 border border-gray-100 animate-in zoom-in duration-300">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 animate-bounce">
                            <Plus className="text-white" size={36} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight uppercase">Business Required</h2>
                        <p className="text-gray-500 mb-8 font-medium leading-relaxed">Please select a business profile to manage your sales and invoices.</p>
                        <a href="/businesses" className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-[0.98]">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;

