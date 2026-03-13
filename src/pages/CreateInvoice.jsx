import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSale } from '../redux/slices/salesSlice';
import { recordStockMovement } from '../redux/slices/inventorySlice';
import { fetchCustomers } from '../redux/slices/customerSlice';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Printer, Save, FileText, CreditCard } from 'lucide-react';

const CreateInvoice = ({ onClose }) => {
    const dispatch = useDispatch();
    const { products } = useSelector(state => state);
    const { items: customers } = useSelector(state => state.customers);
    const { user } = useSelector(state => state.auth);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Added payment method state

    const [items, setItems] = useState([{ id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]);

    useEffect(() => {
        dispatch(fetchCustomers());
    }, [dispatch]);

    const availableProducts = products.items.filter(p => p.stock > 0);

    const handleCustomerSelect = (name) => {
        setCustomerName(name);
        const customer = customers.find(c => c.name === name);
        if (customer) {
            setCustomerPhone(customer.phone || '');
        } else {
            setCustomerPhone('');
        }
    };

    const handleProductSelect = (index, productId) => {
        const product = products.items.find(p => p.id === productId);
        const newItems = [...items];
        if (product) {
            newItems[index] = {
                ...newItems[index],
                productId: product.id,
                price: product.price,
                amount: product.price * newItems[index].quantity
            };
        } else {
            newItems[index] = { ...newItems[index], productId: '', price: 0, amount: 0 };
        }
        setItems(newItems);
    };

    const handleQuantityChange = (index, qty) => {
        const newItems = [...items];
        const product = products.items.find(p => p.id === newItems[index].productId);

        let quantity = parseInt(qty) || 0;
        if (quantity < 1) quantity = 1;

        if (product && quantity > product.stock) {
            toast.error(`Only ${product.stock} units available in stock`);
            quantity = product.stock;
        }

        newItems[index] = {
            ...newItems[index],
            quantity: quantity,
            amount: newItems[index].price * quantity
        };
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
    const taxAndCharges = 0; // Simplified for MVP
    const totalAmount = subTotal + taxAndCharges;

    const handleSaveInvoice = async () => {
        const validItems = items.filter(item => item.productId && item.quantity > 0);

        if (validItems.length === 0) {
            return toast.error("Please add at least one valid product");
        }

        try {
            const saleData = {
                customerName: customerName || 'Walk-in Customer',
                customerPhone,
                items: validItems,
                subTotal,
                taxAndCharges,
                totalAmount,
                paymentMethod, // Added to sale data
                paymentStatus: 'Paid',
                createdBy: user.uid,
                creatorName: user.name || user.email,
                createdAt: Date.now()
            };

            const resultAction = await dispatch(createSale(saleData)).unwrap();

            // Record stock OUT movements for inventory logs
            for (const item of validItems) {
                await dispatch(recordStockMovement({
                    productId: item.productId,
                    type: 'OUT',
                    quantity: item.quantity,
                    reason: `Sale Invoice #${resultAction.id.substring(resultAction.id.length - 6).toUpperCase()}`,
                    user: user.name || user.email
                }));
            }

            toast.success("Invoice created successfully!");
            onClose();
        } catch (error) {
            toast.error(error.message || "Failed to create invoice");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 shadow-sm border border-gray-100 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 shadow-sm transition" onClick={() => window.print()}>
                        <Printer size={18} className="mr-2" /> Print
                    </button>
                    <button onClick={handleSaveInvoice} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition">
                        <Save size={18} className="mr-2" /> Save Invoice
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Customer & Payment Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Customer & Payment</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={customerName}
                                    onChange={(e) => handleCustomerSelect(e.target.value)}
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-300 rounded-md p-2 bg-gray-50"
                                    placeholder="+91"
                                    value={customerPhone}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online/UPI">Online / UPI</option>
                                    <option value="Card">Card Payment</option>
                                    <option value="Credit">On Credit</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm">
                                        <th className="p-3 w-1/2">Product</th>
                                        <th className="p-3 w-24">Price</th>
                                        <th className="p-3 w-24">Qty</th>
                                        <th className="p-3 w-32 text-right">Amount</th>
                                        <th className="p-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="p-3">
                                                <select
                                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                                    value={item.productId}
                                                    onChange={(e) => handleProductSelect(index, e.target.value)}
                                                >
                                                    <option value="">Select Product</option>
                                                    {availableProducts.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-3 text-sm">₹{item.price}</td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    disabled={!item.productId}
                                                    className="w-full border border-gray-300 rounded p-2 text-sm text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3 text-right text-sm font-medium">₹{item.amount.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-400 hover:text-red-600 disabled:opacity-50"
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={handleAddItem}
                            className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            <Plus size={16} className="mr-1" /> Add New Row
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="md:col-span-1 border-gray-100 h-fit">
                    <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-xl shadow-lg p-6 text-white sticky top-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center"><FileText className="mr-2" /> Invoice Summary</h2>

                        <div className="space-y-4 mb-6 text-indigo-100">
                            <div className="flex justify-between">
                                <span>Sub Total</span>
                                <span>₹{subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center"><CreditCard size={14} className="mr-1" /> Method</span>
                                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-800 pb-4">
                                <span>Tax & Charges</span>
                                <span>₹{taxAndCharges.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl text-white pt-4">
                                <span>Total Amount</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveInvoice}
                            className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-gray-100 transition shadow-md"
                        >
                            Save & Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
