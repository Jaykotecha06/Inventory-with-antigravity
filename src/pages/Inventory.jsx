import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { recordStockMovement } from '../redux/slices/inventorySlice';
import toast from 'react-hot-toast';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const Inventory = () => {
    const dispatch = useDispatch();
    const { products } = useSelector(state => state);
    const { logs } = useSelector(state => state.inventory);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    const [modalType, setModalType] = useState(null); // 'IN' or 'OUT'
    const [formData, setFormData] = useState({ productId: '', quantity: '', reason: '' });

    const sortedLogs = [...logs].sort((a, b) => b.date - a.date);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productId || !formData.quantity) return toast.error("Please fill required fields");

        try {
            await dispatch(recordStockMovement({
                ...formData,
                type: modalType,
                user: user.name || user.email,
                quantity: Number(formData.quantity),
                businessId: activeBusiness.id
            })).unwrap();
            toast.success(`Stock ${modalType === 'IN' ? 'added' : 'removed'} successfully`);
            setModalType(null);
            setFormData({ productId: '', quantity: '', reason: '' });
        } catch (error) {
            toast.error(error);
        }
    };

    const getProductName = (id) => {
        const p = products.items.find(p => p.id === id);
        return p ? p.name : 'Unknown Product';
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <div className="flex gap-3">
                    <button onClick={() => setModalType('IN')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition">
                        <ArrowUpCircle size={18} className="mr-2" /> Stock IN
                    </button>
                    <button onClick={() => setModalType('OUT')} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition">
                        <ArrowDownCircle size={18} className="mr-2" /> Stock OUT
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">Recent Movements</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference/Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getProductName(log.productId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{log.type === 'IN' ? '+' : '-'}{log.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.reason || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No inventory movements recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="fixed inset-0 z-[60] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ArrowUpCircle className="text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">You need to select a business profile before tracking stock movements.</p>
                        <a href="/businesses" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className={`text-lg font-bold ${modalType === 'IN' ? 'text-green-600' : 'text-red-600'}`}>Stock {modalType}</h3>
                            <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 shadow-lg drop-shadow">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product</label>
                                <select required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
                                    <option value="">Select Product...</option>
                                    {products.items.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Cur: {p.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input type="number" required min="1" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks / Reason</label>
                                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder={modalType === 'IN' ? 'Purchase bill # / Return' : 'Damage / Expiry / Usage'} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className={`px-4 py-2 text-white rounded-md ${modalType === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
