import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Plus, Search, FileSpreadsheet, ChevronLeft, ChevronRight,
    Calendar, Eye, Edit, Trash2
} from 'lucide-react';
import CreateQuotation from './CreateQuotation';
import { fetchQuotations, deleteQuotation } from '../redux/slices/quotationSlice';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    Draft: 'bg-gray-100 text-gray-600',
    Sent: 'bg-blue-100 text-blue-700',
    Accepted: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Converted: 'bg-purple-100 text-purple-700',
};

const STATUS_FILTERS = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'];

const Quotations = () => {
    const dispatch = useDispatch();
    const { items: quotations, loading } = useSelector(state => state.quotations);
    const { activeBusiness } = useSelector(state => state.business);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingQuotation, setViewingQuotation] = useState(null);
    const [editingQuotation, setEditingQuotation] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (activeBusiness?.id) dispatch(fetchQuotations(activeBusiness.id));
    }, [dispatch, activeBusiness]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const filtered = quotations
        .filter(q => q.businessId === activeBusiness?.id)
        .filter(q => statusFilter === 'All' || q.status === statusFilter)
        .filter(q =>
            q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.createdAt - a.createdAt);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleDelete = async (quotation) => {
        if (window.confirm(`Delete Quotation #${quotation.id.substring(quotation.id.length - 6).toUpperCase()}?`)) {
            try {
                await dispatch(deleteQuotation(quotation.id)).unwrap();
                toast.success('Quotation deleted');
            } catch (error) {
                toast.error(error.message || 'Failed to delete');
            }
        }
    };

    if (isCreateOpen) return <CreateQuotation key="create" onClose={() => setIsCreateOpen(false)} />;
    if (viewingQuotation) return (
        <CreateQuotation
            key={`view-${viewingQuotation.id}`}
            onClose={() => setViewingQuotation(null)}
            quotationData={viewingQuotation}
            isViewing={true}
            onEdit={(q) => { setViewingQuotation(null); setEditingQuotation(q); }}
        />
    );
    if (editingQuotation) return (
        <CreateQuotation
            key={`edit-${editingQuotation.id}`}
            onClose={() => setEditingQuotation(null)}
            quotationData={editingQuotation}
            isViewing={false}
        />
    );

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {/* Page Header */}
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
                        <FileSpreadsheet className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Quotations</h1>
                </div>
                <button
                    disabled={!activeBusiness}
                    onClick={() => setIsCreateOpen(true)}
                    className={`flex items-center px-6 py-3 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-0.5'}`}
                >
                    <Plus size={18} className="mr-2" /> New Quotation
                </button>
            </div>

            {/* Status Filter Chips */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${statusFilter === s
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!activeBusiness}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Search customer or quote number..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Show</span>
                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-black text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                            value={itemsPerPage}
                            onChange={e => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sr No</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Quote #</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Valid Until</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {displayed.map((q, index) => (
                                <tr key={q.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-300" />
                                            {q.quotationDate || new Date(q.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 tracking-tight">
                                        #{q.id.substring(q.id.length - 6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{q.customerName || '—'}</div>
                                        {q.customerPhone && <div className="text-[11px] font-semibold text-gray-400">{q.customerPhone}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-500">
                                        {q.validUntil || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black rounded-full uppercase tracking-widest ${STATUS_COLORS[q.status] || STATUS_COLORS.Draft}`}>
                                            {q.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 tracking-tight">
                                        ₹{Number(q.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setViewingQuotation(q)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="View"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingQuotation(q)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(q)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Delete"
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

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {displayed.map((q, index) => (
                        <div key={q.id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            #{(currentPage - 1) * itemsPerPage + index + 1}
                                        </span>
                                        <span className="text-sm font-black text-indigo-600 tracking-tight">
                                            QT-{q.id.substring(q.id.length - 6).toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest ${STATUS_COLORS[q.status] || STATUS_COLORS.Draft}`}>
                                            {q.status || 'Draft'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-gray-900">{q.customerName || '—'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setViewingQuotation(q)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-all shadow-sm"><Eye size={18} /></button>
                                    <button onClick={() => setEditingQuotation(q)} className="p-2 bg-green-50 text-green-600 rounded-lg active:scale-95 transition-all shadow-sm"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(q)} className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-95 transition-all shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                                    <Calendar size={12} />
                                    {q.quotationDate || new Date(q.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</div>
                                    <div className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{Number(q.totalAmount).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filtered.length === 0 && activeBusiness && (
                    <div className="px-6 py-16 text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                            <FileSpreadsheet size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No Quotations Found</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Create your first quotation to get started.'}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
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
                        <p className="text-gray-500 mb-8 font-medium leading-relaxed">Please select a business profile to manage your quotations.</p>
                        <a href="/businesses" className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-[0.98]">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;
