import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />; // Or to a 'Not Authorized' page
    }

    return children;
};

export default AuthRoute;
