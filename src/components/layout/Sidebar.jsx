import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileText,
    Archive,
    Building2,
    ClipboardList,
    FileSpreadsheet,
    X,
    Book
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useSelector((state) => state.auth);
    const { activeBusiness } = useSelector((state) => state.business);
    const location = useLocation();

    let effectiveRole = user?.role;
    if (activeBusiness && user) {
        if (activeBusiness.ownerId === user.uid) {
            effectiveRole = 'Admin';
        } else if (activeBusiness.users && activeBusiness.users[user.uid]) {
            effectiveRole = activeBusiness.users[user.uid].role;
        }
    }

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['Admin', 'Manager'] },
        { path: '/businesses', icon: <Building2 size={20} />, label: 'My Businesses', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/products', icon: <Package size={20} />, label: 'Products', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/customers', icon: <Users size={20} />, label: 'Customers', roles: ['Admin', 'Manager'] },
        { path: '/inventory', icon: <Archive size={20} />, label: 'Inventory', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/purchases', icon: <ClipboardList size={20} />, label: 'Purchases', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/sales', icon: <ShoppingCart size={20} />, label: 'Sales', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/quotations', icon: <FileSpreadsheet size={20} />, label: 'Quotations', roles: ['Admin', 'Manager', 'Staff'] },
        { path: '/reports', icon: <FileText size={20} />, label: 'Reports', roles: ['Admin', 'Manager'] },
        { path: '/team', icon: <Users size={20} />, label: 'Team', roles: ['Admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(effectiveRole));

    const sidebarClasses = `
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1a2e18] text-white flex flex-col transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex
    `;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`${sidebarClasses} sidebar-no-scrollbar`}>
                <div className="p-6 border-b border-white/10 flex items-start justify-between">
                    <div className="w-full flex pr-2 flex-col">
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-forest-green" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                                    Vyapar Ledger
                                </h1>
                                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1 font-bold mb-4">Workspace • {effectiveRole}</p>
                            </div>
                            <button onClick={onClose} className="md:hidden text-white/70 hover:text-white mb-auto ml-2">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 w-full mt-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeBusiness ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="text-xs text-white/90 font-bold truncate">
                                {activeBusiness?.name || 'No Business Selected'}
                            </span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredMenu.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                                className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative group ${isActive
                                    ? 'text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-forest-green shadow-[0_0_15px_rgba(74,124,68,0.5)]"></div>
                                )}
                                <span className={`mr-3 transition-transform duration-200 ${isActive ? 'text-forest-green scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/10">
                    <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-forest-green flex items-center justify-center text-white font-bold shadow-lg shadow-forest-green/20">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-white/40 truncate font-medium">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
