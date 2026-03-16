import { useSelector } from 'react-redux';
import { Package, TrendingUp, AlertTriangle, IndianRupee } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
    // Select data safely with fallbacks
    const { user } = useSelector(state => state.auth);
    const products = useSelector(state => state.products?.items || []);
    const sales = useSelector(state => state.sales?.items || []);
    const { activeBusiness } = useSelector(state => state.business);

    // Perform calculations safely
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => Number(p.stock) < (Number(p.minStock) || 5)).length;

    const totalSales = sales.reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const dailyRevenue = sales
        .filter(sale => Number(sale.createdAt) >= todayTimestamp)
        .reduce((acc, sale) => acc + Number(sale.totalAmount || 0), 0);

    const StatCard = ({ title, value, icon: Icon, colorClass }) => (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Live Context: {activeBusiness.name}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Products" value={totalProducts} icon={Package} colorClass="bg-blue-500" />
                <StatCard title="Total Sales" value={`₹${totalSales.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-500" />
                <StatCard title="Daily Revenue" value={`₹${dailyRevenue.toLocaleString()}`} icon={IndianRupee} colorClass="bg-indigo-500" />
                <StatCard title="Low Stock Alerts" value={lowStockProducts} icon={AlertTriangle} colorClass="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Sales Trend</h3>
                    <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-dashed border-gray-200">
                        <div className="text-center">
                            <TrendingUp size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Graph will populate as you add sales</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Low Stock Items</h3>
                    <div className="space-y-4">
                        {products.filter(p => Number(p.stock) < (Number(p.minStock) || 5)).slice(0, 5).map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                                <div>
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <p className="text-xs text-red-600 font-bold">In Stock: {product.stock}</p>
                                </div>
                                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded uppercase">Urgent</span>
                            </div>
                        ))}
                        {lowStockProducts === 0 && (
                            <div className="text-center py-10">
                                <Package size={32} className="mx-auto mb-2 text-green-200" />
                                <p className="text-gray-400 text-sm italic">All products are well stocked.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* No Active Business Overlay */}
            {!activeBusiness && (
                <div className="fixed inset-0 z-[60] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
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
