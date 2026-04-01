import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSale, updateSale } from '../redux/slices/salesSlice';
import { recordStockMovement } from '../redux/slices/inventorySlice';
import { fetchCustomers } from '../redux/slices/customerSlice';
import { fetchProducts } from '../redux/slices/productSlice';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Printer, Save, FileText, CreditCard, ShoppingBag, User, Phone, CheckCircle2, IndianRupee, Tag, Download, Share2, MessageCircle, PenTool, X, Upload, Palette, Mail, Smartphone, Pencil, Globe, MapPin, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

// --- TEMPLATES ---
const TemplateStandard = ({
    activeBusiness,
    invoiceData,
    customerName,
    customerPhone,
    items,
    getProductName,
    subTotal,
    discount,
    totalAmount,
    signature
}) => {
    const qrCodeUrl = activeBusiness?.upiId
        ? `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(`upi://pay?pa=${activeBusiness.upiId}&pn=${activeBusiness.name}&am=${totalAmount}&cu=INR`)}&choe=UTF-8`
        : null;

    return (
        <div className="bg-white">
            <div className="flex justify-between items-center mb-12 border-b-2 border-gray-900 pb-6">
                <h1 className="text-4xl font-black tracking-tighter uppercase text-gray-900">INVOICE</h1>
            </div>

            <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                        {activeBusiness?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase text-gray-900">{activeBusiness?.name}</h2>
                        {activeBusiness?.gstin && <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">GSTIN: {activeBusiness.gstin}</p>}
                        <p className="text-xs font-bold text-gray-600 mt-1 max-w-[250px]">{activeBusiness?.address}</p>
                        <p className="text-xs font-bold text-gray-600">{activeBusiness?.phone}</p>
                    </div>
                </div>
                <div className="text-right space-y-1">
                    <div className="flex justify-end gap-3 items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice No:</span>
                        <span className="text-sm font-black text-gray-900">#{(invoiceData?.id || 'TEMP').substring((invoiceData?.id || 'TEMP').length - 6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-end gap-3 items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billed Date:</span>
                        <span className="text-sm font-black text-gray-900">{new Date(invoiceData?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="mb-12 bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block min-w-[300px]">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Bill To</h3>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight">{customerName || 'Walk-in Customer'}</p>
                </div>
                {customerPhone && <p className="text-sm font-bold text-gray-600 mt-1 ml-4">{customerPhone}</p>}
            </div>

            <div className="mb-12">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100">No</th>
                            <th className="p-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100">Item Description</th>
                            <th className="p-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100">Qty</th>
                            <th className="p-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100">Unit Price</th>
                            <th className="p-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="p-4 text-sm font-bold text-gray-500 border border-gray-100">{idx + 1}</td>
                                <td className="p-4 text-sm font-black text-gray-800 uppercase border border-gray-100">{getProductName(item.productId)}</td>
                                <td className="p-4 text-sm font-black text-gray-800 text-center border border-gray-100">{item.quantity}</td>
                                <td className="p-4 text-sm font-bold text-gray-600 text-right border border-gray-100">₹{Number(item.price).toFixed(2)}</td>
                                <td className="p-4 text-sm font-black text-gray-900 text-right border border-gray-100">₹{Number(item.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-start gap-12 pt-8 border-t border-gray-100">
                <div className="flex-1">
                    <div className="flex items-start gap-8">
                        {qrCodeUrl && (
                            <div className="text-center">
                                <img src={qrCodeUrl} alt="Payment QR" className="w-32 h-32 border border-gray-100 rounded-xl mb-2" />
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Scan to Pay via UPI</p>
                                <p className="text-[10px] font-black text-indigo-600 mt-1">{activeBusiness.upiId}</p>
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</h4>
                            <ul className="text-[10px] font-bold text-gray-500 space-y-1 list-disc ml-4">
                                <li>Goods once sold will not be taken back or exchanged.</li>
                                <li>Payments are due immediately upon receipt of goods.</li>
                                <li>Subject to Local Jurisdiction only.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="w-72 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                        <span>Sub Total</span>
                        <span>₹{subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-red-600 uppercase tracking-tight">
                        <span>Discount</span>
                        <span>- ₹{Number(discount).toFixed(2)}</span>
                    </div>
                    <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Amount</span>
                        <span className="text-2xl font-black text-gray-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="mt-24 flex justify-end items-end">
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">For {activeBusiness?.name}</p>
                    {signature ? (
                        <div className="mb-2">
                            <img src={signature} alt="Signature" className="h-16 ml-auto object-contain" />
                        </div>
                    ) : (
                        <div className="w-56 h-16 border-b border-gray-300 mb-2 ml-auto"></div>
                    )}
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
};

const TemplateModern = (props) => {
    const { activeBusiness, invoiceData, customerName, customerPhone, items, getProductName, totalAmount } = props;
    return (
        <div className="bg-white">
            <div className="bg-indigo-600 -mx-12 -mt-12 p-12 text-white mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">INVOICE</h1>
                    <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs">Invoice #{(invoiceData?.id || 'TEMP').substring((invoiceData?.id || 'TEMP').length - 6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black uppercase">{activeBusiness?.name}</h2>
                    <p className="text-indigo-200 text-sm font-bold">{activeBusiness?.phone}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Billed To</h3>
                    <p className="text-xl font-black text-gray-900 uppercase">{customerName || 'Walk-in Customer'}</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">{customerPhone}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Invoice Details</h3>
                    <p className="text-sm font-bold text-gray-600">Date: {new Date(invoiceData?.createdAt || Date.now()).toLocaleDateString()}</p>
                    <p className="text-2xl font-black text-indigo-600 mt-2">₹{totalAmount.toLocaleString()}</p>
                </div>
            </div>

            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b-2 border-indigo-600">
                        <th className="py-4 text-left text-xs font-black uppercase text-indigo-600">Item</th>
                        <th className="py-4 text-center text-xs font-black uppercase text-indigo-600">Qty</th>
                        <th className="py-4 text-right text-xs font-black uppercase text-indigo-600">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-6 font-black text-gray-800 uppercase">{getProductName(item.productId)}</td>
                            <td className="py-6 text-center font-bold text-gray-600">{item.quantity}</td>
                            <td className="py-6 text-right font-black text-gray-900">₹{Number(item.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-center bg-gray-50 -mx-12 p-12 mt-auto">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                    <p className="text-sm font-black text-gray-900 uppercase">{invoiceData?.paymentMethod || 'Cash'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authorized Signatory</p>
                    <div className="h-12 w-48 border-b-2 border-gray-200 ml-auto"></div>
                </div>
            </div>
        </div>
    );
};

const TemplateMinimal = (props) => {
    const { activeBusiness, invoiceData, customerName, items, getProductName, totalAmount } = props;
    return (
        <div className="bg-white font-sans">
            <div className="flex justify-between items-start mb-24">
                <h1 className="text-3xl font-light tracking-widest text-gray-300 uppercase">Invoice</h1>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900">{activeBusiness?.name}</h2>
                    <p className="text-xs text-gray-500">{activeBusiness?.address}</p>
                </div>
            </div>

            <div className="mb-24">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Subject</p>
                <p className="text-lg font-medium text-gray-800">Provision of Services / Goods for {customerName || 'Customer'}</p>
            </div>

            <table className="w-full mb-24">
                <thead className="border-b border-gray-100">
                    <tr>
                        <th className="py-4 text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest">Description</th>
                        <th className="py-4 text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-6 text-sm text-gray-700">{getProductName(item.productId)} (x{item.quantity})</td>
                            <td className="py-6 text-right text-sm font-medium text-gray-900">₹{Number(item.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-gray-900">
                        <td className="py-6 text-sm font-bold uppercase tracking-widest">Total</td>
                        <td className="py-6 text-right text-xl font-bold">₹{totalAmount.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="text-[10px] text-gray-400 leading-relaxed max-w-sm">
                Thank you for your business. Please make payments within 15 days of invoice date.
            </div>
        </div>
    );
};

const TemplateCompact = (props) => {
    const { activeBusiness, invoiceData, customerName, items, getProductName, totalAmount } = props;
    return (
        <div className="bg-white text-[11px]">
            <div className="text-center border-b-2 border-dotted border-gray-300 pb-4 mb-4">
                <h2 className="text-lg font-black uppercase">{activeBusiness?.name}</h2>
                <p className="font-bold">{activeBusiness?.address}</p>
                <p>Tel: {activeBusiness?.phone}</p>
            </div>

            <div className="flex justify-between mb-4 border-b border-gray-100 pb-2">
                <span>Inv: #{(invoiceData?.id || '000').slice(-4)}</span>
                <span>{new Date(invoiceData?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>

            <div className="mb-4">
                <p className="font-black uppercase">Customer: {customerName}</p>
            </div>

            <table className="w-full mb-4">
                <thead className="border-b border-gray-900">
                    <tr>
                        <th className="text-left py-1">Item</th>
                        <th className="text-center py-1">Qty</th>
                        <th className="text-right py-1">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-dotted border-gray-100">
                            <td className="py-2">{getProductName(item.productId)}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">₹{Number(item.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between font-black text-sm border-t-2 border-gray-900 pt-2">
                <span>TOTAL</span>
                <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="mt-8 text-center text-[9px] uppercase tracking-widest">
                *** THANK YOU ***
            </div>
        </div>
    );
};

const CreateInvoice = ({ onClose, invoiceData = null, isViewing = false, onEdit }) => {
    const dispatch = useDispatch();
    const { products } = useSelector(state => state);
    const { items: customers } = useSelector(state => state.customers);
    const { user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    const [customerName, setCustomerName] = useState(invoiceData?.customerName || '');
    const [customerPhone, setCustomerPhone] = useState(invoiceData?.customerPhone || '');
    const [paymentMethod, setPaymentMethod] = useState(invoiceData?.paymentMethod || 'Cash');
    const [discount, setDiscount] = useState(invoiceData?.discount || 0);

    const [items, setItems] = useState(invoiceData?.items || [{ id: Date.now(), productId: '', quantity: 1, price: 0, amount: 0 }]);
    const [amountPaidInput, setAmountPaidInput] = useState(invoiceData ? (invoiceData.amountPaid || 0) : '');
    const [signature, setSignature] = useState(invoiceData?.signature || null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState(invoiceData?.template || 'standard');

    // For Drawing Signature
    const canvasRef = useRef(null);

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchCustomers(activeBusiness.id));
            dispatch(fetchProducts(activeBusiness.id));
        }
    }, [dispatch, activeBusiness]);

    const availableProducts = products.items;

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
            amount: (Number(newItems[index].price) || 0) * quantity
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
    const taxAndCharges = 0;
    const totalAmount = subTotal - Number(discount) + taxAndCharges;

    const actualAmountPaid = amountPaidInput === '' ? totalAmount : Number(amountPaidInput);
    const balanceDue = totalAmount - actualAmountPaid;

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
                discount: Number(discount),
                taxAndCharges,
                totalAmount,
                amountPaid: Math.max(0, actualAmountPaid),
                balanceDue: Math.max(0, balanceDue),
                paymentMethod,
                paymentStatus: balanceDue <= 0 ? 'Paid' : (actualAmountPaid > 0 ? 'Partial' : 'Unpaid'),
                createdBy: user.uid,
                creatorName: user.name || user.email,
                businessId: activeBusiness.id,
                createdAt: invoiceData?.createdAt || Date.now(),
                signature,
                template: activeTemplate
            };

            let updatedPaymentHistory = invoiceData?.paymentHistory || [];
            if (!invoiceData?.id && actualAmountPaid > 0) {
                updatedPaymentHistory = [{
                    id: Date.now().toString(),
                    date: Date.now(),
                    amount: actualAmountPaid,
                    method: paymentMethod,
                    notes: 'Advance/Initial Payment'
                }];
            }
            saleData.paymentHistory = updatedPaymentHistory;

            if (invoiceData?.id) {
                await dispatch(updateSale({ id: invoiceData.id, oldSale: invoiceData, newSaleData: saleData })).unwrap();
                toast.success("Invoice updated successfully!");
            } else {
                const resultAction = await dispatch(createSale(saleData)).unwrap();
                for (const item of validItems) {
                    await dispatch(recordStockMovement({
                        productId: item.productId,
                        type: 'OUT',
                        quantity: item.quantity,
                        reason: `Sale Invoice #${resultAction.id.substring(resultAction.id.length - 6).toUpperCase()}`,
                        user: user.name || user.email,
                        businessId: activeBusiness.id,
                        skipStockUpdate: true
                    }));
                }
                toast.success("Invoice created successfully!");
            }
            dispatch(fetchProducts(activeBusiness.id));
            onClose();
        } catch (error) {
            toast.error(error.message || "Failed to save invoice");
        }
    };

    const getProductName = (id) => {
        return products.items.find(p => p.id === id)?.name || 'Unknown Product';
    };

    // Signature Canvas Logic
    const isDrawingRef = useRef(false);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const setupCtx = (canvas) => {
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1a1a2e';
        return ctx;
    };

    // Attach non-passive touch listeners when signature modal opens
    useEffect(() => {
        if (!isSignatureModalOpen || !canvasRef.current) return;
        const canvas = canvasRef.current;

        const onTouchStart = (e) => {
            e.preventDefault();
            const { x, y } = getPos(e, canvas);
            const ctx = setupCtx(canvas);
            ctx.beginPath();
            ctx.moveTo(x, y);
            isDrawingRef.current = true;
        };
        const onTouchMove = (e) => {
            if (!isDrawingRef.current) return;
            e.preventDefault();
            const { x, y } = getPos(e, canvas);
            const ctx = setupCtx(canvas);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        };
        const onTouchEnd = () => { isDrawingRef.current = false; };

        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        return () => {
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
        };
    }, [isSignatureModalOpen]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const { x, y } = getPos(e, canvas);
        const ctx = setupCtx(canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawingRef.current = true;
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        const { x, y } = getPos(e, canvas);
        const ctx = setupCtx(canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const endDrawing = () => {
        isDrawingRef.current = false;
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL();
        setSignature(dataUrl);
        setIsSignatureModalOpen(false);
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignature(reader.result);
                setIsSignatureModalOpen(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWhatsAppShare = () => {
        const message = `Hello, here is your invoice from ${activeBusiness?.name}. Total Amount: ₹${totalAmount.toFixed(2)}.`;
        const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleGeneralShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice from ${activeBusiness?.name}`,
                    text: `Invoice #${(invoiceData?.id || '').slice(-6)} - ₹${totalAmount}`,
                    url: window.location.href
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            toast.error("Sharing not supported on this browser");
        }
    };

    const SignatureModal = () => (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest">Digital Signature</h3>
                        <p className="text-indigo-300 text-xs font-bold mt-1 uppercase tracking-tight">Draw or Upload your signature</p>
                    </div>
                    <button onClick={() => setIsSignatureModalOpen(false)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Draw Below</label>
                        <canvas
                            ref={canvasRef}
                            width={448}
                            height={200}
                            style={{ touchAction: 'none' }}
                            className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={clearSignature}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                        >
                            Clear
                        </button>
                        <label className="flex-1 py-4 bg-green-50 text-green-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-100 transition-all text-center cursor-pointer flex items-center justify-center gap-2">
                            <Upload size={14} /> Upload
                            <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                        </label>
                    </div>

                    <button
                        onClick={saveSignature}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                    >
                        Save Signature
                    </button>
                </div>
            </div>
        </div>
    );

    const ActionSidebar = () => (
        <div className="w-full lg:w-64 space-y-4 sticky top-6">
            <button
                onClick={() => {
                    if (onEdit) {
                        onEdit(invoiceData);
                    } else {
                        onClose();
                    }
                }}
                className="w-full flex items-center justify-between px-6 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-100 group"
            >
                <div className="flex items-center gap-3">
                    <Pencil size={18} /> Edit
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
            <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-between px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-100 group"
            >
                <div className="flex items-center gap-3">
                    <Printer size={18} /> Print
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
            <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-between px-6 py-4 bg-yellow-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-600 transition-all shadow-xl shadow-yellow-100 group"
            >
                <div className="flex items-center gap-3">
                    <Download size={18} /> Download
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
            <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-between px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 group"
            >
                <div className="flex items-center gap-3">
                    <MessageCircle size={18} /> WhatsApp
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
            <button
                onClick={handleGeneralShare}
                className="w-full flex items-center justify-between px-6 py-4 bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-100 group"
            >
                <div className="flex items-center gap-3">
                    <Share2 size={18} /> Share
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
            <button
                onClick={() => setIsSignatureModalOpen(true)}
                className="w-full flex items-center justify-between px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group"
            >
                <div className="flex items-center gap-3">
                    <PenTool size={18} /> Signature
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
        </div>
    );

    const TemplateSwitcher = () => (
        <div className="flex flex-col gap-3 w-40 sticky top-6 no-print">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template</h3>
            {[
                { id: 'standard', label: 'Standard', color: 'bg-gray-900' },
                { id: 'modern', label: 'Modern', color: 'bg-indigo-600' },
                { id: 'minimal', label: 'Minimal', color: 'bg-gray-100' },
                { id: 'compact', label: 'Compact', color: 'bg-amber-500' },
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t.id)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${activeTemplate === t.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                >
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 ${t.color}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${activeTemplate === t.id ? 'text-indigo-600' : 'text-gray-500'
                        }`}>{t.label}</span>
                    {activeTemplate === t.id && (
                        <CheckCircle2 size={12} className="absolute right-3 text-indigo-600" />
                    )}
                </button>
            ))}
        </div>
    );

    // Horizontal template chooser bar for create/edit mode
    const TemplateBar = () => (
        <div className="flex flex-wrap gap-3 no-print">
            {[
                { id: 'standard', label: 'Standard', color: 'bg-gray-900', desc: 'Professional' },
                { id: 'modern', label: 'Modern', color: 'bg-indigo-600', desc: 'Bold & Colorful' },
                { id: 'minimal', label: 'Minimal', color: 'bg-gray-300', desc: 'Clean & Simple' },
                { id: 'compact', label: 'Compact', color: 'bg-amber-500', desc: 'Receipt Style' },
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t.id)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${activeTemplate === t.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                        : 'border-gray-100 bg-white hover:border-gray-300'
                        }`}
                >
                    <div className={`w-4 h-4 rounded-md flex-shrink-0 ${t.color}`}></div>
                    <div className="text-left">
                        <p className={`text-xs font-black uppercase tracking-wider ${activeTemplate === t.id ? 'text-indigo-600' : 'text-gray-700'
                            }`}>{t.label}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t.desc}</p>
                    </div>
                    {activeTemplate === t.id && <CheckCircle2 size={14} className="text-indigo-600 ml-1" />}
                </button>
            ))}
        </div>
    );

    if (products.loading || !activeBusiness) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading invoice data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4">
            {isSignatureModalOpen && <SignatureModal />}

            {/* Print Only Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; background: white !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .invoice-container { 
                        width: 210mm; 
                        min-height: 297mm; 
                        padding: 15mm; 
                        margin: 0 auto;
                        background: white !important;
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                    }
                }
                .print-only { display: none; }
            `}} />

            {/* Default UI remains for editing */}
            <div className={`no-print space-y-6 ${isViewing ? 'mt-8' : ''}`}>
                {/* Action Bar (Only for non-viewing or mobile) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-3 bg-white text-gray-500 hover:text-indigo-600 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-indigo-100 active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
                                {isViewing ? 'Invoice View' : (invoiceData ? 'Edit Invoice' : 'Create Invoice')}
                            </h1>
                        </div>
                    </div>
                    {!isViewing && (
                        <button
                            onClick={handleSaveInvoice}
                            className="flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5"
                        >
                            <Save size={16} className="mr-2" /> Save Invoice
                        </button>
                    )}
                    {isViewing && (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all hover:-translate-y-0.5"
                        >
                            <ArrowLeft size={16} className="mr-2" /> Back
                        </button>
                    )}
                </div>

                {!isViewing && <TemplateBar />}

                <div className={`flex flex-col lg:flex-row gap-8 items-start justify-center`}>
                    {isViewing && <TemplateSwitcher />}

                    {/* Main Content Area */}
                    <div className={`${isViewing ? 'max-w-4xl w-full' : 'flex-1'} space-y-6`}>
                        {isViewing ? (
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-gray-100 p-4 lg:p-12 overflow-hidden">
                                {activeTemplate === 'standard' && (
                                    <TemplateStandard
                                        activeBusiness={activeBusiness}
                                        invoiceData={invoiceData}
                                        customerName={customerName}
                                        customerPhone={customerPhone}
                                        items={items}
                                        getProductName={getProductName}
                                        subTotal={subTotal}
                                        discount={discount}
                                        totalAmount={totalAmount}
                                        signature={signature}
                                    />
                                )}
                                {activeTemplate === 'modern' && (
                                    <TemplateModern
                                        activeBusiness={activeBusiness}
                                        invoiceData={invoiceData}
                                        customerName={customerName}
                                        customerPhone={customerPhone}
                                        items={items}
                                        getProductName={getProductName}
                                        subTotal={subTotal}
                                        discount={discount}
                                        totalAmount={totalAmount}
                                        signature={signature}
                                    />
                                )}
                                {activeTemplate === 'minimal' && (
                                    <TemplateMinimal
                                        activeBusiness={activeBusiness}
                                        invoiceData={invoiceData}
                                        customerName={customerName}
                                        customerPhone={customerPhone}
                                        items={items}
                                        getProductName={getProductName}
                                        subTotal={subTotal}
                                        discount={discount}
                                        totalAmount={totalAmount}
                                        signature={signature}
                                    />
                                )}
                                {activeTemplate === 'compact' && (
                                    <TemplateCompact
                                        activeBusiness={activeBusiness}
                                        invoiceData={invoiceData}
                                        customerName={customerName}
                                        customerPhone={customerPhone}
                                        items={items}
                                        getProductName={getProductName}
                                        subTotal={subTotal}
                                        discount={discount}
                                        totalAmount={totalAmount}
                                        signature={signature}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Customer & Billing Info */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <User className="text-indigo-600" size={18} />
                                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Customer Information</h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label>
                                            <select
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                value={customerName}
                                                onChange={(e) => handleCustomerSelect(e.target.value)}
                                            >
                                                <option value="">Walk-in Customer</option>
                                                {customers.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone size={14} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    readOnly
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-500 outline-none"
                                                    placeholder="Not Available"
                                                    value={customerPhone}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products/Items Table */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="text-indigo-600" size={18} />
                                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Billing Items</h2>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead>
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</th>
                                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Qty</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Rate</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Amount</th>
                                                    <th className="px-6 py-4 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {items.map((item, index) => (
                                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <select
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                                                value={item.productId}
                                                                onChange={(e) => handleProductSelect(index, e.target.value)}
                                                            >
                                                                <option value="">Select Product...</option>
                                                                {availableProducts.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                disabled={!item.productId}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-black text-center focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-600 text-sm">₹{(Number(item.price) || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">₹{(Number(item.amount) || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all disabled:opacity-0"
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

                                    <div className="p-4 bg-gray-50/30">
                                        <button
                                            onClick={handleAddItem}
                                            className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-all ml-2"
                                        >
                                            <div className="bg-indigo-600 text-white p-1 rounded-md shadow-sm">
                                                <Plus size={12} />
                                            </div>
                                            Add Another Product
                                        </button>
                                    </div>
                                </div>

                                {/* Sidebar Summary (Moved into main scrollable area for mobile/form view) */}
                                <div className="bg-indigo-900 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 p-8 text-white relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <CreditCard size={20} className="text-indigo-200" />
                                        <h2 className="text-lg font-black uppercase tracking-widest">Payment Summary</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-200 font-bold uppercase tracking-widest text-[10px]">Method</span>
                                            <select
                                                className="bg-white/10 text-white border border-white/10 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest outline-none"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            >
                                                <option value="Cash" className="text-indigo-900">Cash</option>
                                                <option value="Online/UPI" className="text-indigo-900">Online / UPI</option>
                                                <option value="Card" className="text-indigo-900">Card Payment</option>
                                                <option value="Credit" className="text-indigo-900">On Credit</option>
                                            </select>
                                        </div>
                                        <div className="pt-6 border-t border-white/10 space-y-4">
                                            <div className="flex justify-between text-indigo-300 font-bold text-sm uppercase">
                                                <span>Sub Total</span>
                                                <span>₹{subTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-indigo-300 font-bold text-sm uppercase">Discount</span>
                                                <div className="relative w-28">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-black">₹</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/10 border border-white/10 rounded-xl pl-6 pr-3 py-2 text-xs font-black text-right outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                                                        value={discount}
                                                        onChange={(e) => setDiscount(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center group mt-4 border-t border-white/10 pt-4">
                                                <span className="text-indigo-300 font-bold text-sm uppercase">Amount Received</span>
                                                <div className="relative w-28">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-black">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder={totalAmount.toFixed(0)}
                                                        className="w-full bg-white/10 border border-white/10 rounded-xl pl-6 pr-3 py-2 text-xs font-black text-right outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                                                        value={amountPaidInput}
                                                        onChange={(e) => setAmountPaidInput(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {balanceDue > 0 && (
                                                <div className="flex justify-between items-center text-orange-300 font-bold text-sm uppercase mt-2">
                                                    <span>Balance Due</span>
                                                    <span>₹{balanceDue.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-indigo-300 font-black uppercase tracking-[0.2em] text-[10px]">Final Total</div>
                                                <div className="text-3xl font-black tracking-tight">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
                                                <IndianRupee size={24} className="text-indigo-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isViewing && <ActionSidebar />}
                </div>
            </div>

            {/* Print Specific Layout */}
            <div className="print-only invoice-container">
                <TemplateStandard
                    activeBusiness={activeBusiness}
                    invoiceData={invoiceData}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    items={items}
                    getProductName={getProductName}
                    subTotal={subTotal}
                    discount={discount}
                    totalAmount={totalAmount}
                    signature={signature}
                />
            </div>
        </div>
    );
};

export default CreateInvoice;

