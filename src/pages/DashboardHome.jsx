import './DashboardHome.css';

export default function DashboardHome() {
    const stats = [
        { icon: '🏢', label: 'Total Buildings', value: '45', color: '#4facfe' },
        { icon: '🚪', label: 'Indoor Locations', value: '123', color: '#f093fb' },
        { icon: '📍', label: 'Navigation Nodes', value: '158', color: '#ffd700' },
        { icon: '👥', label: 'Active Users', value: '1.2K', color: '#00f2fe' },
    ];

    return (
        <div className="dashboard-home">
            <div className="welcome-section">
                <h2>Welcome to Admin Dashboard</h2>
                <p>Manage your campus navigation system</p>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="stat-card"
                        style={{ '--accent-color': stat.color }}
                    >
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-info">
                            <p className="stat-label">{stat.label}</p>
                            <h3 className="stat-value">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="info-cards">
                <div className="info-card">
                    <h3>🎯 Quick Actions</h3>
                    <ul>
                        <li>✅ View all buildings and locations</li>
                        <li>✅ Monitor system performance</li>
                        <li>✅ Check user analytics</li>
                        <li>📋 Manage building data (Coming Soon)</li>
                        <li>📋 Update indoor locations (Coming Soon)</li>
                    </ul>
                </div>

                <div className="info-card">
                    <h3>📊 System Status</h3>
                    <div className="status-item">
                        <span className="status-dot active"></span>
                        <span>Firebase Hosting: Active</span>
                    </div>
                    <div className="status-item">
                        <span className="status-dot active"></span>
                        <span>Authentication: Active</span>
                    </div>
                    <div className="status-item">
                        <span className="status-dot pending"></span>
                        <span>Firestore Database: Pending</span>
                    </div>
                    <div className="status-item">
                        <span className="status-dot active"></span>
                        <span>Map Services: Active</span>
                    </div>
                </div>
            </div>

            <div className="future-features">
                <h3>🚀 Future Extensions</h3>
                <p>The following features are planned for future releases:</p>
                <div className="feature-grid">
                    <div className="feature-item">
                        <span className="feature-icon">🏢</span>
                        <span>Building Management</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🚪</span>
                        <span>Room Management</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>Analytics Dashboard</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🔔</span>
                        <span>Push Notifications</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">👥</span>
                        <span>User Management</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">⚙️</span>
                        <span>Advanced Settings</span>
                    </div>
                </div>
                <p className="follow-message">Follow us 💕 for updates!</p>
            </div>
        </div>
    );
}
