import { useState } from 'react';
import { Menu, Search, Bell } from 'lucide-react';

const Header = ({ onMenuClick }) => {
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

                    <div className="max-w-md w-full ml-4 md:ml-0 relative">
                        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm" placeholder="Search..." /> */}
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
