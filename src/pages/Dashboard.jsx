import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Wallet, Star } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchPurchases } from '../redux/slices/purchaseSlice';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const products = useSelector(state => state.products?.items || []);
    const sales = useSelector(state => state.sales?.items || []);
    const purchases = useSelector(state => state.purchases?.items || []);
    const { activeBusiness } = useSelector(state => state.business);

    useEffect(() => {
        if (activeBusiness?.id) {
            dispatch(fetchPurchases(activeBusiness.id));
        }
    }, [activeBusiness, dispatch]);

    // Perform calculations safely
    const totalProducts = products.length;
    const lowStockProductsList = products.filter(p => Number(p.stock) < (Number(p.minStock) || 5));
    const lowStockCount = lowStockProductsList.length;

    const totalSales = sales.reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0);
    const totalPurchases = purchases.reduce((acc, purchase) => acc + Number(purchase.totalAmount || 0), 0);
    const netProfit = totalSales - totalPurchases;

    // --- Chart Data Preparation (Last 7 Days) ---
    const chartData = useMemo(() => {
        const labels = [];
        const salesData = [];
        const purchasesData = [];

        // Generate last 7 days including today
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const startOfDay = d.getTime();
            const endOfDay = startOfDay + 86399999;

            labels.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));

            const daySales = sales
                .filter(s => s.createdAt >= startOfDay && s.createdAt <= endOfDay)
                .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

            const dayPurchases = purchases
                .filter(p => p.createdAt >= startOfDay && p.createdAt <= endOfDay)
                .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

            salesData.push(daySales);
            purchasesData.push(dayPurchases);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Sales (₹)',
                    data: salesData,
                    backgroundColor: 'rgba(52, 211, 153, 0.9)', // Emerald 400
                    borderRadius: 4,
                },
                {
                    label: 'Purchases (₹)',
                    data: purchasesData,
                    backgroundColor: 'rgba(248, 113, 113, 0.9)', // Red 400
                    borderRadius: 4,
                }
            ],
        };
    }, [sales, purchases]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    // --- Top Selling Products ---
    const topSellingProducts = useMemo(() => {
        const salesCount = {};
        sales.forEach(sale => {
            (sale.items || []).forEach(item => {
                const pid = item.productId || item.id;
                if (!salesCount[pid]) salesCount[pid] = 0;
                salesCount[pid] += Number(item.quantity || 0);
            });
        });

        const aggregated = Object.keys(salesCount).map(pid => {
            const product = products.find(p => p.id === pid);
            return {
                id: pid,
                name: product ? product.name : 'Unknown Product',
                quantity: salesCount[pid]
            };
        });

        return aggregated.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [sales, products]);

    const StatCard = ({ title, value, icon: Icon, colorClass, isNegative }) => (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                <p className={`text-2xl font-bold ${isNegative ? 'text-red-500' : 'text-gray-800'}`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {activeBusiness ? activeBusiness.name : 'Welcome back'}, {user?.name || 'User'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {activeBusiness
                            ? `Viewing analytics for ${activeBusiness.category} operations.`
                            : "Select a business to view your inventory and sales data."}
                    </p>
                </div>
                {activeBusiness && (
                    <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Live Context: {activeBusiness.name}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Inventory" value={totalProducts} icon={Package} colorClass="bg-blue-500" />
                <StatCard title="Total Sales" value={`₹${totalSales.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-500" />
                <StatCard title="Net Profit/Loss" value={`₹${Math.abs(netProfit).toLocaleString()}`} icon={Wallet} colorClass={netProfit >= 0 ? "bg-indigo-500" : "bg-red-500"} isNegative={netProfit < 0} />
                <StatCard title="Low Stock Alerts" value={lowStockCount} icon={AlertTriangle} colorClass={lowStockCount > 0 ? "bg-red-500" : "bg-gray-400"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Financial Overview (Last 7 Days)</h3>
                    <div className="flex-grow min-h-[300px] bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Right Column: Top Products & Alerts */}
                <div className="space-y-6">
                    {/* Top Selling Products */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight flex items-center gap-2">
                            <Star size={18} className="text-yellow-500" /> Top Selling Items
                        </h3>
                        <div className="space-y-3">
                            {topSellingProducts.length > 0 ? (
                                topSellingProducts.map((product, idx) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-black">
                                                #{idx + 1}
                                            </div>
                                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{product.name}</p>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                                            {product.quantity} sold
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-400 text-sm italic">No sales data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" /> Low Stock Alerts
                        </h3>
                        <div className="space-y-3">
                            {lowStockProductsList.length > 0 ? (
                                lowStockProductsList.slice(0, 5).map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">{product.name}</p>
                                            <p className="text-xs text-red-600 font-bold">In Stock: {product.stock}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-white bg-red-500 px-2 py-1 rounded uppercase tracking-wider">Urgent</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <Package size={24} className="mx-auto mb-2 text-green-200" />
                                    <p className="text-gray-400 text-sm italic">Inventory levels are healthy.</p>
                                </div>
                            )}
                        </div>
                        {lowStockCount > 5 && (
                            <div className="mt-3 text-center">
                                <a href="/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">+ {lowStockCount - 5} More Alerts</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="absolute inset-0 z-[60] bg-gray-900/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center p-4 min-h-[600px]">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
                        <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 rotate-3">
                            <Package className="text-white" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Business Required</h2>
                        <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                            To view dashboard analytics and manage your stock, you must first select an active business profile.
                        </p>
                        <a
                            href="/businesses"
                            className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-200 active:scale-95"
                        >
                            Select or Create Business
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
