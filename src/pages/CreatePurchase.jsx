import { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createPurchase, updatePurchase } from '../redux/slices/purchaseSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import { fetchCustomers } from '../redux/slices/customerSlice';
import { recordStockMovement } from '../redux/slices/inventorySlice';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Plus, Trash2, Save, ClipboardList,
    Pencil, Printer, User, Phone, Calendar,
    Hash, Tag
} from 'lucide-react';

const CreatePurchase = ({ onClose, purchaseData = null, isViewing = false, onEdit }) => {
    const dispatch = useDispatch();
    const { products } = useSelector(state => state);
    const { items: allCustomers } = useSelector(state => state.customers);
    const { items: allPurchases } = useSelector(state => state.purchases);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    // Only Supplier-type contacts
    // Only Supplier-type contacts (including those who might not have a type set if they were added as Suppliers)
    const suppliers = allCustomers.filter(c =>
        (c.type === 'Supplier') &&
        c.businessId === activeBusiness?.id
    );

    // Auto-generate bill no: PO-YYYYMMDD-N
    const generateBillNo = () => {
        const today = new Date();
        const datePart = today.toISOString().split('T')[0].replace(/-/g, '');
        const businessPurchases = allPurchases.filter(p => p.businessId === activeBusiness?.id);
        const todayPurchases = businessPurchases.filter(p => {
            const d = new Date(p.createdAt).toISOString().split('T')[0].replace(/-/g, '');
            return d === datePart;
        });
        const seq = todayPurchases.length + 1;
        return `PO-${datePart}-${String(seq).padStart(3, '0')}`;
    };

    const [supplierName, setSupplierName] = useState(purchaseData?.supplierName || '');
    const [supplierPhone, setSupplierPhone] = useState(purchaseData?.supplierPhone || '');
    const [billNo, setBillNo] = useState(purchaseData?.billNo || '');
    const [purchaseDate, setPurchaseDate] = useState(
        purchaseData?.purchaseDate || new Date().toISOString().split('T')[0]
    );
    const [paymentMethod, setPaymentMethod] = useState(purchaseData?.paymentMethod || 'Cash');
    const [discount, setDiscount] = useState(purchaseData?.discount || 0);
    const [notes, setNotes] = useState(purchaseData?.notes || '');
    const [amountPaidInput, setAmountPaidInput] = useState(purchaseData ? (purchaseData.amountPaid || 0) : '');

    const [items, setItems] = useState(
        purchaseData?.items || [{ id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]
    );
    const [saving, setSaving] = useState(false);

    // Auto-generate bill no on mount (only for new purchases)
    useEffect(() => {
        if (!purchaseData?.id && !billNo) {
            setBillNo(generateBillNo());
        }
    }, [allPurchases]);

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchProducts(activeBusiness.id));
            dispatch(fetchCustomers(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    // Auto-fill phone when supplier is selected from dropdown
    const handleSupplierSelect = (supplierId) => {
        if (!supplierId) {
            setSupplierName('');
            setSupplierPhone('');
            return;
        }
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            setSupplierName(supplier.name);
            setSupplierPhone(supplier.phone || '');
        }
    };

    const selectedSupplierId = suppliers.find(s => s.name === supplierName)?.id || '';

    const handleProductSelect = (index, productId) => {
        const product = products.items.find(p => p.id === productId);
        const newItems = [...items];
        if (product) {
            newItems[index] = {
                ...newItems[index],
                productId: product.id,
                price: Number(product.price) || 0,
                amount: (Number(product.price) || 0) * newItems[index].quantity
            };
        } else {
            newItems[index] = { ...newItems[index], productId: '', price: 0, amount: 0 };
        }
        setItems(newItems);
    };

    const handleQuantityChange = (index, qty) => {
        const newItems = [...items];
        let quantity = parseInt(qty) || 1;
        if (quantity < 1) quantity = 1;
        newItems[index] = {
            ...newItems[index],
            quantity,
            amount: (Number(newItems[index].price) || 0) * quantity
        };
        setItems(newItems);
    };

    const handlePriceChange = (index, price) => {
        const newItems = [...items];
        const p = parseFloat(price) || 0;
        newItems[index] = {
            ...newItems[index],
            price: p,
            amount: p * newItems[index].quantity
        };
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
    const totalAmount = subTotal - Number(discount);

    const actualAmountPaid = amountPaidInput === '' ? totalAmount : Number(amountPaidInput);
    const balanceDue = totalAmount - actualAmountPaid;

    const handleSave = async () => {
        const validItems = items.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) return toast.error('Please add at least one valid product');
        if (!supplierName.trim()) return toast.error('Supplier name is required');

        setSaving(true);
        try {
            const purchasePayload = {
                supplierName: supplierName.trim(),
                supplierPhone,
                billNo,
                purchaseDate,
                paymentMethod,
                paymentStatus: balanceDue <= 0 ? 'Paid' : (actualAmountPaid > 0 ? 'Partial' : 'Credit'),
                amountPaid: Math.max(0, actualAmountPaid),
                balanceDue: Math.max(0, balanceDue),
                items: validItems,
                subTotal,
                discount: Number(discount),
                totalAmount,
                notes,
                createdBy: user.uid,
                creatorName: user.name || user.email,
                businessId: activeBusiness.id,
                createdAt: purchaseData?.createdAt || Date.now(),
            };

            let updatedPaymentHistory = purchaseData?.paymentHistory || [];
            if (!purchaseData?.id && actualAmountPaid > 0) {
                updatedPaymentHistory = [{
                    id: Date.now().toString(),
                    date: Date.now(),
                    amount: actualAmountPaid,
                    method: paymentMethod,
                    notes: 'Advance/Initial Payment'
                }];
            }
            purchasePayload.paymentHistory = updatedPaymentHistory;

            if (purchaseData?.id) {
                await dispatch(updatePurchase({ id: purchaseData.id, oldPurchase: purchaseData, newPurchaseData: purchasePayload })).unwrap();
                toast.success('Purchase order updated!');
            } else {
                const result = await dispatch(createPurchase(purchasePayload)).unwrap();
                // Record each item as a stock IN movement
                for (const item of validItems) {
                    await dispatch(recordStockMovement({
                        productId: item.productId,
                        type: 'IN',
                        quantity: item.quantity,
                        reason: `Purchase Order #${result.id.substring(result.id.length - 6).toUpperCase()}`,
                        user: user.name || user.email,
                        businessId: activeBusiness.id,
                        skipStockUpdate: true
                    }));
                }
                toast.success('Purchase order created!');
            }
            dispatch(fetchProducts(activeBusiness.id));
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to save purchase order');
        } finally {
            setSaving(false);
        }
    };

    const getProductName = (id) => products.items.find(p => p.id === id)?.name || 'Unknown Product';

    // ---- VIEW MODE ----
    if (isViewing) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto pb-12 px-4">
                <style dangerouslySetInnerHTML={{ __html: `@media print { .no-print { display:none!important; } @page { margin: 15mm; } }` }} />

                {/* Header */}
                <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-3 bg-white text-gray-500 hover:text-indigo-600 rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Purchase Order</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                #{purchaseData?.id?.substring(purchaseData.id.length - 6).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 no-print">
                        <button
                            onClick={() => onEdit && onEdit(purchaseData)}
                            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                            <Pencil size={16} /> Edit
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-lg"
                        >
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* Purchase Order Document */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                    {/* Top Section */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-orange-600 p-2 rounded-xl">
                                    <ClipboardList className="text-white" size={20} />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Purchase Order</h1>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {activeBusiness?.name}
                            </p>
                            {activeBusiness?.gstin && <p className="text-[10px] font-bold text-gray-400">GSTIN: {activeBusiness.gstin}</p>}
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex justify-end gap-3 items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PO No:</span>
                                <span className="text-sm font-black text-gray-900">#{purchaseData?.id?.substring(purchaseData.id.length - 6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-3 items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill No:</span>
                                <span className="text-sm font-black text-gray-900">{purchaseData?.billNo || '—'}</span>
                            </div>
                            <div className="flex justify-end gap-3 items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date:</span>
                                <span className="text-sm font-black text-gray-900">{purchaseData?.purchaseDate || new Date(purchaseData?.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Supplier */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Supplier</h3>
                        <p className="text-lg font-black text-gray-900 uppercase">{purchaseData?.supplierName}</p>
                        {purchaseData?.supplierPhone && <p className="text-sm font-bold text-gray-600 mt-1">{purchaseData.supplierPhone}</p>}
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">No</th>
                                <th className="p-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Product</th>
                                <th className="p-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Qty</th>
                                <th className="p-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Rate</th>
                                <th className="p-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseData?.items?.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="p-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                                    <td className="p-4 text-sm font-black text-gray-800 uppercase">{getProductName(item.productId)}</td>
                                    <td className="p-4 text-sm font-black text-gray-800 text-center">{item.quantity}</td>
                                    <td className="p-4 text-sm font-bold text-gray-600 text-right">₹{Number(item.price).toFixed(2)}</td>
                                    <td className="p-4 text-sm font-black text-gray-900 text-right">₹{Number(item.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{Number(purchaseData?.subTotal).toFixed(2)}</span>
                            </div>
                            {purchaseData?.discount > 0 && (
                                <div className="flex justify-between text-sm font-black text-red-600">
                                    <span>Discount</span>
                                    <span>- ₹{Number(purchaseData.discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end border-t-2 border-gray-900 pt-3">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-gray-900">
                                    ₹{Number(purchaseData?.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-gray-400 uppercase">Payment Status</span>
                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${purchaseData?.paymentStatus === 'Credit' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {purchaseData?.paymentStatus || 'Paid'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {purchaseData?.notes && (
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-sm text-gray-600 font-medium">{purchaseData.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ---- CREATE / EDIT MODE ----
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 bg-white text-gray-500 hover:text-indigo-600 rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {purchaseData?.id ? 'Edit Purchase Order' : 'New Purchase Order'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {activeBusiness?.name}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 disabled:opacity-60"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {saving ? 'Saving...' : 'Save Order'}
                </button>
            </div>

            {/* Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Supplier Info */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Supplier Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <User size={10} className="inline mr-1" />Supplier *
                            </label>
                            {suppliers.length > 0 ? (
                                <select
                                    value={selectedSupplierId}
                                    onChange={e => handleSupplierSelect(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
                                    No suppliers found. <a href="/customers" className="underline font-black">Add a Supplier</a> first.
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Phone size={10} className="inline mr-1" />Phone
                            </label>
                            <input
                                type="tel"
                                value={supplierPhone}
                                onChange={e => setSupplierPhone(e.target.value)}
                                placeholder="Auto-filled from supplier"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Hash size={10} className="inline mr-1" />Bill No
                            </label>
                            <input
                                type="text"
                                value={billNo}
                                onChange={e => setBillNo(e.target.value)}
                                placeholder="Auto-generated"
                                className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm font-black placeholder:text-gray-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-orange-700"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Calendar size={10} className="inline mr-1" />Purchase Date
                            </label>
                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={e => setPurchaseDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Tag size={10} className="inline mr-1" />Payment Method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Online">Online / UPI</option>
                                <option value="Card">Card</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</h3>
                        <button
                            onClick={handleAddItem}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 hover:text-white transition-all"
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Column Headers */}
                        <div className="hidden md:grid grid-cols-12 gap-3 px-2">
                            <div className="col-span-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Rate (₹)</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</div>
                            <div className="col-span-1"></div>
                        </div>

                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-2xl p-3">
                                <div className="col-span-12 md:col-span-5">
                                    <select
                                        value={item.productId}
                                        onChange={e => handleProductSelect(index, e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">-- Select Product --</option>
                                        {products.items.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => handleQuantityChange(index, e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-center focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.price}
                                        onChange={e => handlePriceChange(index, e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-right focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right">
                                    <span className="text-sm font-black text-gray-900">
                                        ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={items.length === 1}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between gap-6">
                        {/* Notes */}
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Any additional notes..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Totals */}
                        <div className="w-full md:w-72 space-y-3">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-500">Discount (₹)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                    className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-right focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-between items-end border-t-2 border-gray-900 pt-3">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-gray-900">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-sm font-bold text-gray-500">Amount Paid (₹)</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder={totalAmount.toFixed(0)}
                                    value={amountPaidInput}
                                    onChange={e => setAmountPaidInput(e.target.value)}
                                    className="w-28 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-black text-right focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                            {balanceDue > 0 && (
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-bold text-red-500">Balance Due</span>
                                    <span className="text-sm font-black text-red-600">₹{balanceDue.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePurchase;
