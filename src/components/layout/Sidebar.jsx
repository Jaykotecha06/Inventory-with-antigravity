import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileText,
    Settings,
    LogOut,
    Archive,
    Building2
} from 'lucide-react';
import { logoutUser } from '../../redux/slices/authSlice';

const Sidebar = () => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/businesses', icon: <Building2 size={20} />, label: 'My Businesses', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/products', icon: <Package size={20} />, label: 'Products', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/inventory', icon: <Archive size={20} />, label: 'Inventory', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/sales', icon: <ShoppingCart size={20} />, label: 'Sales', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/customers', icon: <Users size={20} />, label: 'Customers', roles: ['Admin', 'Manager'] },
        { path: '/reports', icon: <FileText size={20} />, label: 'Reports', roles: ['Admin', 'Manager'] },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings', roles: ['Admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 hidden md:flex">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold tracking-wider text-indigo-400">VyaparClone</h1>
                <p className="text-xs text-gray-400 mt-1">Role: {user?.role}</p>
            </div>

            <nav className="flex-1 py-4 space-y-1">
                {filteredMenu.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${location.pathname === item.path
                            ? 'bg-gray-800 text-indigo-400 border-r-4 border-indigo-500'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center px-4 py-2 mb-2 bg-gray-800 rounded-md">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3">{user?.name?.charAt(0) || 'U'}</div>
                    <div className="flex-1 truncate">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-md transition-colors"
                >
                    <LogOut size={20} className="mr-3" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
