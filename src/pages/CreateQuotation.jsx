import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createQuotation, updateQuotation, markQuotationConverted } from '../redux/slices/quotationSlice';
import { createSale } from '../redux/slices/salesSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import { fetchCustomers } from '../redux/slices/customerSlice';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Plus, Trash2, Save, FileSpreadsheet, ChevronRight,
    Edit as EditIcon, Printer, User, Phone, Calendar, Tag, RefreshCw
} from 'lucide-react';

const STATUS_COLORS = {
    Draft: 'bg-gray-100 text-gray-600',
    Sent: 'bg-blue-100 text-blue-700',
    Accepted: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Converted: 'bg-purple-100 text-purple-700',
};

const CreateQuotation = ({ onClose, quotationData = null, isViewing = false, onEdit }) => {
    const dispatch = useDispatch();
    const { products } = useSelector(state => state);
    const { items: allCustomers } = useSelector(state => state.customers);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    // Only Customer-type contacts
    // Only Customer-type contacts (or those without a type yet, defaulting to Customer)
    const customers = allCustomers.filter(c =>
        (c.type === 'Customer' || !c.type) &&
        c.businessId === activeBusiness?.id
    );

    const [customerName, setCustomerName] = useState(quotationData?.customerName || '');
    const [customerPhone, setCustomerPhone] = useState(quotationData?.customerPhone || '');
    const [quotationDate, setQuotationDate] = useState(
        quotationData?.quotationDate || new Date().toISOString().split('T')[0]
    );
    const [validUntil, setValidUntil] = useState(quotationData?.validUntil || '');
    const [status] = useState(quotationData?.status || 'Draft');
    const [discount, setDiscount] = useState(quotationData?.discount || 0);
    const [notes, setNotes] = useState(quotationData?.notes || '');
    const [converting, setConverting] = useState(false);
    const [saving, setSaving] = useState(false);

    const [items, setItems] = useState(
        quotationData?.items || [{ id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]
    );

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchProducts(activeBusiness.id));
            dispatch(fetchCustomers(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    // Auto-fill phone when customer is selected from dropdown
    const handleCustomerSelect = (customerId) => {
        if (!customerId) {
            setCustomerName('');
            setCustomerPhone('');
            return;
        }
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setCustomerName(customer.name);
            setCustomerPhone(customer.phone || '');
        }
    };

    const selectedCustomerId = customers.find(c => c.name === customerName)?.id || '';

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
        newItems[index] = { ...newItems[index], price: p, amount: p * newItems[index].quantity };
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]);
    const handleRemoveItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

    const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
    const totalAmount = subTotal - Number(discount);

    const getProductName = (id) => products.items.find(p => p.id === id)?.name || 'Unknown Product';

    const handleSave = async () => {
        const validItems = items.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) return toast.error('Please add at least one valid product');
        if (!customerName.trim()) return toast.error('Customer name is required');

        setSaving(true);
        try {
            const payload = {
                customerName: customerName.trim(),
                customerPhone,
                quotationDate,
                validUntil,
                status,
                items: validItems,
                subTotal,
                discount: Number(discount),
                totalAmount,
                notes,
                createdBy: user.uid,
                creatorName: user.name || user.email,
                businessId: activeBusiness.id,
                createdAt: quotationData?.createdAt || Date.now(),
            };

            if (quotationData?.id) {
                await dispatch(updateQuotation({ id: quotationData.id, quotationData: payload })).unwrap();
                toast.success('Quotation updated!');
            } else {
                await dispatch(createQuotation(payload)).unwrap();
                toast.success('Quotation created!');
            }
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to save quotation');
        } finally {
            setSaving(false);
        }
    };

    const handleConvertToSale = async () => {
        if (quotationData?.status === 'Converted') return toast.error('This quotation has already been converted!');
        if (!window.confirm('Convert this quotation to a Sale Invoice? Stock will be deducted.')) return;

        setConverting(true);
        try {
            const validItems = (quotationData?.items || items).filter(i => i.productId && i.quantity > 0);
            const saleData = {
                customerName: quotationData?.customerName || customerName,
                customerPhone: quotationData?.customerPhone || customerPhone,
                items: validItems,
                subTotal: quotationData?.subTotal || subTotal,
                discount: quotationData?.discount || Number(discount),
                taxAndCharges: 0,
                totalAmount: quotationData?.totalAmount || totalAmount,
                paymentMethod: 'Cash',
                paymentStatus: 'Paid',
                createdBy: user.uid,
                creatorName: user.name || user.email,
                businessId: activeBusiness.id,
                createdAt: Date.now(),
                quotationRef: quotationData?.id,
            };

            const result = await dispatch(createSale(saleData)).unwrap();
            await dispatch(markQuotationConverted({ id: quotationData.id, saleId: result.id })).unwrap();
            toast.success('Quotation converted to Sale Invoice!');
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to convert quotation');
        } finally {
            setConverting(false);
        }
    };

    // ---- VIEW MODE ----
    if (isViewing) {
        const q = quotationData;
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
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quotation</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                #{q?.id?.substring(q.id.length - 6).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 no-print flex-wrap">
                        {q?.status !== 'Converted' && (
                            <button
                                onClick={handleConvertToSale}
                                disabled={converting}
                                className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-60"
                            >
                                {converting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={16} />}
                                Convert to Sale
                            </button>
                        )}
                        <button
                            onClick={() => onEdit && onEdit(q)}
                            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                            <EditIcon size={16} /> Edit
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-lg"
                        >
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* Quotation Document */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                    {/* Top */}
                    <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-indigo-600 p-2 rounded-xl">
                                    <FileSpreadsheet className="text-white" size={20} />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Quotation</h1>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{activeBusiness?.name}</p>
                            {activeBusiness?.gstin && <p className="text-[10px] font-bold text-gray-400">GSTIN: {activeBusiness.gstin}</p>}
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex justify-end gap-3 items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quote No:</span>
                                <span className="text-sm font-black text-gray-900">#{q?.id?.substring(q.id.length - 6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-3 items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date:</span>
                                <span className="text-sm font-black text-gray-900">{q?.quotationDate}</span>
                            </div>
                            {q?.validUntil && (
                                <div className="flex justify-end gap-3 items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valid Until:</span>
                                    <span className="text-sm font-black text-gray-900">{q.validUntil}</span>
                                </div>
                            )}
                            <div className="flex justify-end mt-2">
                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${STATUS_COLORS[q?.status] || STATUS_COLORS.Draft}`}>
                                    {q?.status || 'Draft'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quoted To</h3>
                        <p className="text-lg font-black text-gray-900 uppercase">{q?.customerName || 'Customer'}</p>
                        {q?.customerPhone && <p className="text-sm font-bold text-gray-600 mt-1">{q.customerPhone}</p>}
                    </div>

                    {/* Items */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-indigo-50">
                                <th className="p-4 text-left text-[10px] font-black text-indigo-500 uppercase tracking-widest">No</th>
                                <th className="p-4 text-left text-[10px] font-black text-indigo-500 uppercase tracking-widest">Product</th>
                                <th className="p-4 text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest">Qty</th>
                                <th className="p-4 text-right text-[10px] font-black text-indigo-500 uppercase tracking-widest">Rate</th>
                                <th className="p-4 text-right text-[10px] font-black text-indigo-500 uppercase tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {q?.items?.map((item, idx) => (
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
                                <span>₹{Number(q?.subTotal).toFixed(2)}</span>
                            </div>
                            {q?.discount > 0 && (
                                <div className="flex justify-between text-sm font-black text-red-600">
                                    <span>Discount</span>
                                    <span>- ₹{Number(q.discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end border-t-2 border-indigo-600 pt-3">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-gray-900">
                                    ₹{Number(q?.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {q?.notes && (
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-sm text-gray-600 font-medium">{q.notes}</p>
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
                            {quotationData?.id ? 'Edit Quotation' : 'New Quotation'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeBusiness?.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-60"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Quotation'}
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Customer Info */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <User size={10} className="inline mr-1" />Customer *
                            </label>
                            {customers.length > 0 ? (
                                <select
                                    value={selectedCustomerId}
                                    onChange={e => handleCustomerSelect(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="">-- Select Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
                                    No customers found. <a href="/customers" className="underline font-black">Add a Customer</a> first.
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Phone size={10} className="inline mr-1" />Phone
                            </label>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                placeholder="Auto-filled from customer"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Calendar size={10} className="inline mr-1" />Quotation Date
                            </label>
                            <input
                                type="date"
                                value={quotationDate}
                                onChange={e => setQuotationDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                <Calendar size={10} className="inline mr-1" />Valid Until
                            </label>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</h3>
                        <button
                            onClick={handleAddItem}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
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
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
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
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-center focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.price}
                                        onChange={e => handlePriceChange(index, e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black text-right focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
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
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Terms, conditions, or remarks..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                            />
                        </div>
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
                                    className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-right focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-between items-end border-t-2 border-indigo-600 pt-3">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-gray-900">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateQuotation;
