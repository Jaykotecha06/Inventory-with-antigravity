import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../redux/slices/userSlice';
import { FileDown, Calendar, ArrowRight, TrendingUp, ShoppingBag, Package, User, Store, Printer, CreditCard } from 'lucide-react';

const Reports = () => {
    const dispatch = useDispatch();
    const { items: sales } = useSelector(state => state.sales);
    const { items: products } = useSelector(state => state.products);
    const { items: allUsers } = useSelector(state => state.users);
    const { logs: inventoryLogs } = useSelector(state => state.inventory);
    const { activeBusiness } = useSelector(state => state.business);

    const [dateRange, setDateRange] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState('all');

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    // 1. Filter Sales by Date and Staff
    const filteredSales = useMemo(() => {
        const now = Date.now();
        const limits = {
            '7d': now - 7 * 24 * 60 * 60 * 1000,
            '30d': now - 30 * 24 * 60 * 60 * 1000,
            'all': 0
        };

        return sales.filter(s => {
            const dateMatch = s.createdAt >= limits[dateRange];
            const staffMatch = selectedStaff === 'all' || s.createdBy === selectedStaff;
            return dateMatch && staffMatch;
        });
    }, [sales, dateRange, selectedStaff]);

    // 2. Advanced Metrics
    const metrics = useMemo(() => {
        const totalRev = filteredSales.reduce((acc, s) => acc + Number(s.totalAmount), 0);

        // Product Sales Breakdown
        const productMap = {};
        // Customer (Shop) Sales Breakdown
        const customerMap = {};

        filteredSales.forEach(sale => {
            // Track Customers/Shops
            const cName = sale.customerName || 'Walk-in';
            customerMap[cName] = (customerMap[cName] || 0) + Number(sale.totalAmount);

            // Track Products
            sale.items?.forEach(item => {
                const p = products.find(p => p.id === item.productId);
                const pName = p ? p.name : 'Unknown Product';
                if (!productMap[pName]) productMap[pName] = { qty: 0, revenue: 0 };
                productMap[pName].qty += Number(item.quantity);
                productMap[pName].revenue += Number(item.price) * Number(item.quantity);
            });
        });

        return {
            revenue: totalRev,
            count: filteredSales.length,
            customers: Object.entries(customerMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
            productRank: Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
        };
    }, [filteredSales, products]);

    const handleDownload = () => {
        const data = filteredSales.map(s => ({
            Date: new Date(s.createdAt).toLocaleDateString(),
            InvoiceID: s.id,
            Customer: s.customerName,
            Staff: s.creatorName,
            Total: s.totalAmount,
            Method: s.paymentMethod || 'N/A'
        }));

        const csvRows = [
            ["Date", "Invoice ID", "Customer", "Staff", "Amount", "Payment Method"],
            ...data.map(row => Object.values(row))
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${selectedStaff}_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header / Toolbar */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-wrap justify-between items-center gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales Analytics</h1>
                    <p className="text-sm text-gray-500">Filter and view detailed performance reports</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <User size={16} className="text-gray-400" />
                        <select
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                        >
                            <option value="all">All Staff</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Calendar size={16} className="text-gray-400" />
                        <select
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        <FileDown size={18} className="mr-2" /> Download CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
                    >
                        <Printer size={18} className="mr-2" /> Print PDF
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Collected Amount</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{metrics.revenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    {selectedStaff !== 'all' && (
                        <p className="text-xs text-indigo-500 font-bold mt-4">By: {allUsers.find(u => u.id === selectedStaff)?.name}</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Sales</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{metrics.count}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Invoices generated in period</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Avg Ticket Size</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{(metrics.revenue / (metrics.count || 1)).toFixed(0)}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <CreditCard size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Sales Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <Package size={20} className="mr-2 text-indigo-500" /> Top Selling Products
                    </h3>
                    <div className="space-y-4">
                        {metrics.productRank.length > 0 ? metrics.productRank.map(([name, data]) => (
                            <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-800">{name}</p>
                                    <p className="text-xs text-gray-500">Quantity Sold: {data.qty}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600">₹{data.revenue.toLocaleString()}</p>
                                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{ width: `${(data.revenue / metrics.revenue) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center text-gray-400 italic">No product data for this selection</div>
                        )}
                    </div>
                </div>

                {/* Customer/Shop Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <Store size={20} className="mr-2 text-indigo-500" /> Sales by Customer / Shop
                    </h3>
                    <div className="space-y-3">
                        {metrics.customers.length > 0 ? metrics.customers.map(([name, amount]) => (
                            <div key={name} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-700">{name}</span>
                                </div>
                                <span className="font-bold text-gray-800">₹{amount.toLocaleString()}</span>
                            </div>
                        )) : (
                            <div className="py-12 text-center text-gray-400 italic">No shop data for this selection</div>
                        )}
                    </div>
                    {metrics.customers.length > 0 && (
                        <button className="w-full mt-6 flex items-center justify-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                            View Full List <ArrowRight size={16} className="ml-2" />
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Sales for this Filter */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Records</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Staff</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredSales.slice(0, 10).map(sale => (
                                <tr key={sale.id} className="text-sm">
                                    <td className="p-4">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-gray-800">{sale.customerName}</td>
                                    <td className="p-4 text-gray-500">{sale.creatorName}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                                            {sale.paymentMethod || 'Cash'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">₹{sale.totalAmount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="fixed inset-0 z-[60] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                        <p className="text-gray-500 mb-6">You need to select a business profile before viewing detailed reports.</p>
                        <a href="/businesses" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                            Go to My Businesses
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add some CSS to help with printing
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .bg-white { box-shadow: none !important; border: 1px solid #eee !important; }
            aside, header { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; }
        }
    `;
    document.head.appendChild(styleElement);
}

export default Reports;
