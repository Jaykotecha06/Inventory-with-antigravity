import { Menu, Bell, Building2, ChevronDown, Plus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveBusiness } from '../../redux/slices/businessSlice';

const Header = ({ onMenuClick }) => {
    const dispatch = useDispatch();
    const { items: businesses, activeBusiness } = useSelector(state => state.business);
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center flex-1">
                    <button
                        onClick={onMenuClick}
                        className="text-gray-500 focus:outline-none md:hidden mr-4 hover:text-gray-700"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Business Selector Dropdown */}
                    <div className="relative group ml-4 md:ml-0">
                        <div className="flex items-center gap-2.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeBusiness ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
                            <span className="text-xs font-black tracking-tight text-gray-700 truncate max-w-[140px] uppercase mt-0.5">
                                {activeBusiness?.name || "Select Workspace"}
                            </span>
                            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors mt-0.5" />
                        </div>

                        {/* Dropdown menu */}
                        <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] transform group-hover:translate-y-0 translate-y-2">
                            <div className="p-3 space-y-2">
                                <div className="px-4 py-2 border-b border-gray-50 pb-3 mb-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">My Business Units</p>
                                    <p className="text-[11px] text-gray-500 font-medium italic">Switch workspace context</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                    {businesses.map(b => (
                                        <button
                                            key={b.id}
                                            onClick={() => dispatch(setActiveBusiness(b))}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 text-on-surface-variant hover:bg-surface-container-low hover:translate-x-1 ${activeBusiness?.id === b.id ? 'bg-green-50/50 border border-green-100 shadow-sm' : ''}`}
                                        >
                                            <div className="p-2 rounded-xl bg-forest-green/5 text-forest-green">
                                                <Building2 size={16} />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm font-bold truncate uppercase tracking-tight ${activeBusiness?.id === b.id ? 'text-green-800' : ''}`}>{b.name}</span>
                                                <span className="text-[10px] truncate font-medium text-on-surface-variant/70">
                                                    {b.category} • {b.address || 'Global'}
                                                </span>
                                            </div>
                                            {activeBusiness?.id === b.id && (
                                                <div className="ml-auto bg-green-500 h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] border border-green-200"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-outline-variant/30 mt-2">
                                    <a href="/businesses" className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black text-forest-green hover:bg-forest-green/5 rounded-2xl transition-all uppercase tracking-widest">
                                        <Plus size={14} /> Register New Business
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        <Bell size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
