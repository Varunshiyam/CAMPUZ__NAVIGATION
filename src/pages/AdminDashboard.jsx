import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useAuth } from '../hooks/useAuth';
import { PlaceholderMessage } from '../components/PlaceholderMessage';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/admin/dashboard' },
        { id: 'features', icon: '🚀', label: 'Advanced Features', path: '/admin/features' },
        { id: 'buildings', icon: '🏢', label: 'Buildings', path: '/admin/buildings', placeholder: true },
        { id: 'rooms', icon: '🚪', label: 'Indoor Locations', path: '/admin/rooms', placeholder: true },
        { id: 'settings', icon: '⚙️', label: 'Settings', path: '/admin/settings', placeholder: true },
    ];

    const handleMenuClick = (item) => {
        if (item.placeholder) {
            setShowPlaceholder(true);
        } else {
            navigate(item.path);
        }
    };

    return (
        <div className="admin-dashboard">
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2>🔐 Admin</h2>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                            {item.placeholder && sidebarOpen && (
                                <span className="coming-soon-badge">Soon</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-button" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Campuz Navigation Admin</h1>
                    </div>
                    <div className="header-right">
                        <div className="user-profile">
                            <div className="user-avatar">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <p className="user-name">{user?.email?.split('@')[0]}</p>
                                <p className="user-email">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-area">
                    <Outlet />
                </div>
            </main>

            <PlaceholderMessage
                isOpen={showPlaceholder}
                onClose={() => setShowPlaceholder(false)}
            />
        </div>
    );
}
