import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProduct, updateProduct, deleteProduct } from '../redux/slices/productSlice';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const Products = () => {
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector(state => state.products);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', sku: '', price: '', stock: '', category: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Pagination & Filter States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

    // Reset pagination on search, filter, or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, customDateRange, itemsPerPage]);

    const getFilteredProducts = () => {
        let result = products.filter(p => p.businessId === activeBusiness?.id);

        if (searchTerm) {
            result = result.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter !== 'all') {
            result = result.filter(p => {
                const pDate = p.createdAt;
                if (!pDate) return dateFilter === 'all';

                switch (dateFilter) {
                    case 'today':
                        return pDate >= todayStart;
                    case 'yesterday':
                        return pDate >= (todayStart - 86400000) && pDate < todayStart;
                    case 'this_week':
                        const weekStart = todayStart - now.getDay() * 86400000;
                        return pDate >= weekStart;
                    case 'this_month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                        return pDate >= monthStart;
                    case 'last_month':
                        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
                        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime() + 86399999;
                        return pDate >= lastMonthStart && pDate <= lastMonthEnd;
                    case 'custom':
                        if (customDateRange.from && customDateRange.to) {
                            const from = new Date(customDateRange.from).getTime();
                            const to = new Date(customDateRange.to).getTime() + 86399999;
                            return pDate >= from && pDate <= to;
                        }
                        return true;
                    default:
                        return true;
                }
            });
        }
        return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    };

    const finalFiltered = getFilteredProducts();
    const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);
    const paginatedProducts = finalFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setIsEditing(true);
        } else {
            setCurrentProduct({ name: '', sku: '', price: '', stock: '', category: '' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct({ name: '', sku: '', price: '', stock: '', category: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await dispatch(updateProduct(currentProduct)).unwrap();
                toast.success('Product updated!');
            } else {
                await dispatch(addProduct({ ...currentProduct, businessId: activeBusiness.id })).unwrap();
                toast.success('Product added!');
            }
            handleCloseModal();
        } catch (error) {
            toast.error(error || 'Action failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await dispatch(deleteProduct(id)).unwrap();
                toast.success('Product deleted!');
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    }

    const canManage = ['Admin', 'Manager'].includes(user?.role);

    return (
        <div className="space-y-6 relative min-h-[400px]">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                {canManage && (
                    <button
                        disabled={!activeBusiness}
                        onClick={() => handleOpenModal()}
                        className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition ${!activeBusiness ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <Plus size={18} className="mr-2" /> Add Product
                    </button>
                )}
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
                            placeholder="Search by name or SKU..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedProducts.map((product, index) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                                        {((currentPage - 1) * itemsPerPage) + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold uppercase">{product.category}</span></td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-black ${Number(product.stock) < 10 ? 'text-red-600' : 'text-green-600'}`}>{product.stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">₹{product.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {canManage && (
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-lg transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {paginatedProducts.length === 0 && activeBusiness && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No products found for this business.</td>
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
                <div className="absolute inset-0 z-10 bg-gray-50/50 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">Select a business profile to manage products and stock levels.</p>
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
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Product Name *</label>
                                <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentProduct.name} onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Sales Price (₹) *</label>
                                    <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentProduct.price} onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Initial Stock *</label>
                                    <input type="number" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold" value={currentProduct.stock} onChange={(e) => setCurrentProduct({ ...currentProduct, stock: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-3.5 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-2 bg-indigo-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                    {isEditing ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
