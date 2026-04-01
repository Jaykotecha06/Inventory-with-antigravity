import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Book, Search, FileText, Calendar, IndianRupee, Receipt, ArrowLeft, Download, Plus, AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateSale } from '../redux/slices/salesSlice';
import { updatePurchase } from '../redux/slices/purchaseSlice';

const Ledger = () => {
    const { items: sales } = useSelector(state => state.sales);
    const { items: purchases } = useSelector(state => state.purchases);
    const { activeBusiness } = useSelector(state => state.business);

    const location = useLocation();
    const navigate = useNavigate();

    const [partyDetails, setPartyDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCustomer, setIsCustomer] = useState(true);
    const dispatch = useDispatch();

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Cash',
        notes: ''
    });

    // Initialize from location state
    useEffect(() => {
        if (!location.state?.openParty) {
            // Unintended access without state, navigate back or show empty
            return;
        }

        const tab = location.state.tab || 'receivables';
        const partyName = location.state.openParty;
        const _isCustomer = tab === 'receivables';
        setIsCustomer(_isCustomer);

        let records = [];
        let phone = '';
        let totalBilled = 0;
        let totalPaid = 0;
        let totalDue = 0;

        if (_isCustomer) {
            const customerSales = sales.filter(s => s.businessId === activeBusiness?.id && (s.customerName || 'Walk-in Customer') === partyName);
            records = customerSales;
            if (customerSales.length > 0) phone = customerSales[0].customerPhone;
        } else {
            const supplierPurchases = purchases.filter(p => p.businessId === activeBusiness?.id && (p.supplierName || 'Unknown Supplier') === partyName);
            records = supplierPurchases;
            if (supplierPurchases.length > 0) phone = supplierPurchases[0].supplierPhone;
        }

        records.forEach(r => {
            totalBilled += (r.totalAmount || 0);
            totalPaid += (r.amountPaid || 0);
            totalDue += (r.balanceDue || 0);
        });

        setPartyDetails({
            name: partyName,
            phone,
            totalBilled,
            totalPaid,
            totalDue,
            records
        });

    }, [location.state, sales, purchases, activeBusiness]);

    // --- LEDGER TIMELINE LOGIC ---
    const getTransactions = () => {
        if (!partyDetails) return [];
        let txns = [];

        partyDetails.records.forEach(record => {
            // 1. Bill Entry
            txns.push({
                type: 'BILL',
                id: record.id,
                ref: record.billNo || `INV-${record.id.substring(record.id.length - 6).toUpperCase()}`,
                date: record.createdAt,
                amount: record.totalAmount,
                method: '-'
            });

            // 2. Payments parsing
            let historyPaid = 0;
            if (record.paymentHistory && record.paymentHistory.length > 0) {
                record.paymentHistory.forEach(pay => {
                    historyPaid += Number(pay.amount);
                    txns.push({
                        type: 'PAYMENT',
                        id: pay.id,
                        ref: pay.notes || 'Payment Recorded',
                        date: pay.date || record.createdAt,
                        amount: Number(pay.amount),
                        method: pay.method || 'Cash'
                    });
                });
            }

            // 3. Infer Initial Advance Payment
            const initialPayment = (record.amountPaid || 0) - historyPaid;
            if (initialPayment > 0.01) {
                txns.push({
                    type: 'PAYMENT',
                    id: record.id + '-init',
                    ref: 'Advance / Down Payment',
                    date: record.createdAt, // Same as bill
                    amount: initialPayment,
                    method: 'Mixed'
                });
            }
        });

        // Filter by searchTerm (e.g., ref or amount)
        if (searchTerm) {
            txns = txns.filter(t =>
                t.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort transactions chronologically, but group by local calendar day.
        txns.sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();

            // Check if they are on the exact same calendar day
            const dateStrA = new Date(timeA).toLocaleDateString('en-IN');
            const dateStrB = new Date(timeB).toLocaleDateString('en-IN');

            if (dateStrA !== dateStrB) {
                return timeA - timeB; // Different days: Strict Chronological
            }

            // SAME CALENDAR DAY:
            // Force BILLs to process before PAYMENTs of the same day. 
            // (fixes issue where modal payments at Midnight sort before intraday Bills)
            if (a.type === 'BILL' && b.type === 'PAYMENT') return -1;
            if (a.type === 'PAYMENT' && b.type === 'BILL') return 1;

            // If both are same type on same day, keep exact chronological order
            return timeA - timeB;
        });

        // Compute running balance
        let balance = 0;
        return txns.map(t => {
            if (t.type === 'BILL') {
                balance += t.amount;
            } else {
                balance -= t.amount;
            }
            return { ...t, balance };
        }).reverse(); // Reverse to show latest first
    };

    // --- EXPORT FUNCTIONALITY ---
    const handleExportExcel = () => {
        if (!partyDetails) return;

        const txnsToExport = getTransactions();
        const headers = ['No', 'Issued Date', 'Invoice ID / Ref', 'Description', 'Payment Mode', 'Debit', 'Credit', 'Balance'];
        let csvContent = headers.join(',') + '\n';

        const rows = txnsToExport.map((txn, i) => {
            const debitAmt = (isCustomer && txn.type === 'BILL') || (!isCustomer && txn.type === 'PAYMENT') ? txn.amount : '-';
            const creditAmt = (isCustomer && txn.type === 'PAYMENT') || (!isCustomer && txn.type === 'BILL') ? txn.amount : '-';
            return [
                txnsToExport.length - i,
                new Date(txn.date).toLocaleDateString('en-IN').replace(/,/g, ''),
                txn.ref.replace(/,/g, ''),
                txn.type,
                txn.method,
                debitAmt,
                creditAmt,
                txn.balance
            ].join(',');
        });

        csvContent += rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Ledger_${partyDetails.name}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    // --- PAYMENT PROCESSING ---
    const handleSavePayment = async (e) => {
        e.preventDefault();
        try {
            const amount = Number(paymentData.amount);
            if (!amount || amount <= 0) {
                toast.error("Please enter a valid positive amount.");
                return;
            }

            let remainingAmount = amount;

            // Apportion payment to oldest pending invoices first
            const pendingRecords = [...partyDetails.records]
                .filter(r => r.balanceDue > 0)
                .sort((a, b) => a.createdAt - b.createdAt);

            if (pendingRecords.length === 0) {
                toast.error("No pending true/valid invoices found to apply payment to.");
                setIsPaymentModalOpen(false);
                return;
            }

            // Distribute the amount
            for (const record of pendingRecords) {
                if (remainingAmount <= 0) break;

                const amountToApply = Math.min(remainingAmount, record.balanceDue);

                const newPayment = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    date: new Date(paymentData.date).getTime(),
                    amount: amountToApply,
                    method: paymentData.method,
                    notes: paymentData.notes || `Ledger Bulk Payment`
                };

                const newAmountPaid = (record.amountPaid || 0) + amountToApply;
                const newBalanceDue = record.totalAmount - newAmountPaid;

                const updatedRecord = {
                    ...record,
                    amountPaid: newAmountPaid,
                    balanceDue: newBalanceDue,
                    paymentStatus: newBalanceDue <= 0 ? (isCustomer ? 'Paid' : 'Paid') : 'Partial',
                    paymentHistory: [...(record.paymentHistory || []), newPayment]
                };

                if (isCustomer) {
                    await dispatch(updateSale({ id: record.id, oldSale: record, newSaleData: updatedRecord })).unwrap();
                } else {
                    await dispatch(updatePurchase({ id: record.id, oldPurchase: record, newPurchaseData: updatedRecord })).unwrap();
                }

                remainingAmount -= amountToApply;
            }

            if (remainingAmount > 0) {
                toast.success(`Payment recorded! ₹${remainingAmount} was left over (Advance/Excess).`);
            } else {
                toast.success('Payment successfully recorded and apportioned!');
            }

            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Cash', notes: '' });
        } catch (err) {
            toast.error(err.message || 'Error processing payment.');
        }
    };

    if (!partyDetails) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[60vh]">
                <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <Book size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">No Ledger Selected</h2>
                <p className="text-gray-500 font-bold mb-6 text-center max-w-md">Please navigate to the Customers or Suppliers list and click the Ledger button to view a statement.</p>
                <button
                    onClick={() => navigate('/customers')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition"
                >
                    Go to Customers
                </button>
            </div>
        );
    }

    const txns = getTransactions();

    return (
        <div className="space-y-6 pb-12 w-full min-w-0 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 font-bold mb-2 transition">
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </button>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        Ledger Report - <span className={isCustomer ? 'text-indigo-600' : 'text-orange-600'}>{partyDetails.name}</span>
                    </h1>
                </div>

                {/* Summary Cards directly in header area */}
                <div className="flex gap-4">
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Billed</span>
                        <span className="text-lg font-black text-gray-900">₹{partyDetails.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</span>
                        <span className="text-lg font-black text-emerald-600">₹{partyDetails.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className={`px-5 py-3 rounded-2xl shadow-sm border flex flex-col justify-center ${isCustomer ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCustomer ? 'text-indigo-600' : 'text-orange-600'}`}>Balance Due</span>
                        <span className={`text-xl font-black ${isCustomer ? 'text-indigo-600' : 'text-orange-600'}`}>₹{partyDetails.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Table Area (Hidden on Print) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden print:hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 print:hidden">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-emerald-100 text-emerald-600 bg-emerald-50 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all">
                            <Download size={14} /> Export Excel
                        </button>
                        <button onClick={handleExportPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-100 text-red-600 bg-red-50 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all">
                            <FileText size={14} /> Export PDF
                        </button>
                        <button onClick={() => setIsPaymentModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">
                            <Plus size={14} /> Add Payment
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">No</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Issued Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Mode</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Debit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {txns.length > 0 ? txns.map((txn, i) => {
                                const debitAmt = (isCustomer && txn.type === 'BILL') || (!isCustomer && txn.type === 'PAYMENT') ? txn.amount : null;
                                const creditAmt = (isCustomer && txn.type === 'PAYMENT') || (!isCustomer && txn.type === 'BILL') ? txn.amount : null;

                                return (
                                    <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-400">
                                            {txns.length - i}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap flex items-center gap-2 text-sm font-bold text-gray-600">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(txn.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-indigo-600">
                                            {txn.type === 'BILL' ? txn.ref : ''}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-600">
                                            {txn.type === 'PAYMENT' ? txn.method : ''}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-600">
                                            {txn.type === 'PAYMENT' ? txn.ref : 'Generated Bill'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-gray-800">
                                            {debitAmt ? `₹${debitAmt.toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-emerald-600">
                                            {creditAmt ? `₹${creditAmt.toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-gray-900 bg-gray-50/30">
                                            ₹{txn.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                            <AlertCircle size={24} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">No Transactions</h3>
                                        <p className="text-xs font-bold text-gray-400 mt-1">Sab hisab clear hai! No history found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- PRINT ONLY VIEW --- */}
            <div className="hidden print:block w-full max-w-full">
                <h1 className="text-2xl font-normal text-black mb-8 px-2 tracking-tight">
                    {isCustomer ? 'Customer' : 'Supplier'} Ledger Report
                </h1>

                <table className="w-full text-sm text-left font-sans border-collapse">
                    <thead className="bg-[#e2e2e2] text-white">
                        <tr>
                            <th className="px-4 py-3 font-bold">No</th>
                            <th className="px-4 py-3 font-bold">Issued Date</th>
                            <th className="px-4 py-3 font-bold">Invoice ID</th>
                            <th className="px-4 py-3 font-bold">Payment Mode</th>
                            <th className="px-4 py-3 font-bold">Description</th>
                            <th className="px-4 py-3 font-bold">Debit</th>
                            <th className="px-4 py-3 font-bold">Credit</th>
                            <th className="px-4 py-3 font-bold">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {txns.length > 0 ? txns.map((txn, i) => {
                            const debitAmt = (isCustomer && txn.type === 'BILL') || (!isCustomer && txn.type === 'PAYMENT') ? txn.amount : null;
                            const creditAmt = (isCustomer && txn.type === 'PAYMENT') || (!isCustomer && txn.type === 'BILL') ? txn.amount : null;

                            return (
                                <tr key={i} className="text-gray-800 bg-white">
                                    <td className="px-4 py-3">{txns.length - i}</td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(txn.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).replace(/,/g, '')}</td>
                                    <td className="px-4 py-3 text-gray-700">{txn.type === 'BILL' ? txn.ref : ''}</td>
                                    <td className="px-4 py-3 text-gray-600">{txn.type === 'PAYMENT' ? (txn.method || '-') : ''}</td>
                                    <td className="px-4 py-3 text-gray-600">{txn.type === 'PAYMENT' ? (txn.ref || '-') : 'Generated Bill'}</td>
                                    <td className="px-4 py-3 text-gray-700">{debitAmt ? debitAmt : '-'}</td>
                                    <td className="px-4 py-3 text-gray-700">{creditAmt ? creditAmt : '-'}</td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{txn.balance}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="8" className="px-4 py-6 text-center text-gray-500">No Transactions</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ADd Payment POP-UP MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 animate-in fade-in duration-200 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-gray-100">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                    Add Payment for <br />
                                    <span className={isCustomer ? "text-indigo-600" : "text-orange-600"}>{partyDetails.name}</span>
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                    Pending Balance: ₹{partyDetails.totalDue.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSavePayment} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Paid Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        autoFocus
                                        min="1"
                                        placeholder="Enter Amount"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-gray-900"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
                                    value={paymentData.date}
                                    onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Payment Mode <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
                                    value={paymentData.method}
                                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Notes
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Optional remarks..."
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 resize-none"
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex gap-3 border-t border-gray-100 mt-6 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1 py-3.5 bg-gray-500 text-white rounded-xl font-black tracking-widest hover:bg-gray-600 transition-all shadow-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ledger;
