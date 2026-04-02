import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoute = ({ children, requiredPermission, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const { activeBusiness } = useSelector((state) => state.business);
    const { permissions: rolePermissions } = useSelector((state) => state.roles);

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

    if (effectiveRole === 'Admin') return children;

    const currentPermissions = rolePermissions?.[effectiveRole] || {};

    // Check for explicit allowedRoles (backward compatibility or super-special cases)
    if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
        return <Navigate to="/" replace />;
    }

    // Dynamic Permission check
    if (requiredPermission) {
        if (currentPermissions.all) return children;
        if (!currentPermissions[requiredPermission]) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default AuthRoute;
