import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './ProtectedRoute.css';

export function ProtectedRoute({ children }) {
    const { user, loading, isAdminUser } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (!isAdminUser) {
        return (
            <div className="access-denied">
                <h1>🚫 Access Denied</h1>
                <p>You don't have permission to access the admin panel.</p>
                <p>Contact the administrator for access.</p>
            </div>
        );
    }

    return children;
}
