import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productSlice';
import { fetchInventoryLogs } from '../../redux/slices/inventorySlice';
import { fetchSales } from '../../redux/slices/salesSlice';
import { fetchBusinesses } from '../../redux/slices/businessSlice';
import { fetchCustomers } from '../../redux/slices/customerSlice';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const { activeBusiness } = useSelector(state => state.business);

    useEffect(() => {
        if (isAuthenticated && user?.uid) {
            dispatch(fetchBusinesses(user.uid));
        }
    }, [dispatch, isAuthenticated, user]);

    useEffect(() => {
        if (isAuthenticated && activeBusiness?.id) {
            dispatch(fetchProducts(activeBusiness.id));
            dispatch(fetchInventoryLogs(activeBusiness.id));
            dispatch(fetchSales(activeBusiness.id));
            dispatch(fetchCustomers(activeBusiness.id));
        }
    }, [dispatch, isAuthenticated, activeBusiness]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-800 bg-opacity-75 transition-opacity md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            <div className="flex flex-col flex-1 w-full relative">
                <Header onMenuClick={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
                    {/* Ensure we have user data before rendering the dashboard content to prevent calculation crashes */}
                    {user?.role ? <Outlet /> : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Loading profile...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Layout;
