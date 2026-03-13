import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProduct, updateProduct, deleteProduct } from '../redux/slices/productSlice';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

const Products = () => {
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector(state => state.products);
    const { user } = useSelector(state => state.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', sku: '', price: '', stock: '', category: '' });
    const [isEditing, setIsEditing] = useState(false);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

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
                await dispatch(addProduct(currentProduct)).unwrap();
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
        <div className="space-y-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                {canManage && (
                    <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition">
                        <Plus size={18} className="mr-2" /> Add Product
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{product.category || 'N/A'}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`font-semibold ${product.stock <= (product.minStock || 5) ? 'text-red-600' : 'text-green-600'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{product.price}</td>
                                    {canManage && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                                        {loading ? 'Loading products...' : 'No products found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 shadow-lg drop-shadow">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">SKU / Item Code</label>
                                    <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={currentProduct.sku} onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                    <input type="number" required min="0" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={currentProduct.price} onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Opening Stock</label>
                                    <input type="number" required min="0" className="mt-1 block w-full border border-gray-300 rounded-md p-2" disabled={isEditing} value={currentProduct.stock} onChange={e => setCurrentProduct({ ...currentProduct, stock: e.target.value })} />
                                    {isEditing && <p className="text-xs text-gray-400 mt-1">Use Inventory to adjust stock</p>}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
