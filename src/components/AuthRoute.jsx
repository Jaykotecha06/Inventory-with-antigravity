import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const { activeBusiness } = useSelector((state) => state.business);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    let effectiveRole = user?.role;
    if (activeBusiness && user) {
        if (activeBusiness.ownerId === user.uid) {
            effectiveRole = 'Admin';
        } else if (activeBusiness.users && activeBusiness.users[user.uid]) {
            effectiveRole = activeBusiness.users[user.uid].role;
        }
    }

    if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
        return <Navigate to="/" replace />; // Redirect to dashboard if not authorized
    }

    return children;
};

export default AuthRoute;
