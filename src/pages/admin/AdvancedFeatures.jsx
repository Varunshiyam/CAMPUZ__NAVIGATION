import { useState } from 'react';
import { PlaceholderMessage } from '../../components/PlaceholderMessage';
import './AdvancedFeatures.css';

export default function AdvancedFeatures() {
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const features = [
        {
            icon: '🌐',
            title: 'Website Integration',
            description: 'Connect campus website, events calendar, and announcements',
            color: '#4facfe',
            items: ['Live Events Feed', 'News Updates', 'Academic Calendar', 'Notice Board']
        },
        {
            icon: '🤖',
            title: 'AI Assistant',
            description: 'Smart chatbot for campus navigation and information',
            color: '#f093fb',
            items: ['Natural Language Queries', 'Route Suggestions', 'Building Info', 'FAQs']
        },
        {
            icon: '📊',
            title: 'Analytics Dashboard',
            description: 'Real-time insights on user behavior and popular routes',
            color: '#ffd700',
            items: ['User Heatmaps', 'Popular Destinations', 'Peak Hours', 'Search Trends']
        },
        {
            icon: '🔔',
            title: 'Push Notifications',
            description: 'Send alerts for events, emergencies, and updates',
            color: '#00f2fe',
            items: ['Event Reminders', 'Emergency Alerts', 'Maintenance Notices', 'Custom Messages']
        },
        {
            icon: '🎯',
            title: 'AR Navigation',
            description: 'Augmented reality wayfinding using device camera',
            color: '#667eea',
            items: ['AR Arrows', 'Point of Interest', 'Indoor Navigation', 'Live Directions']
        },
        {
            icon: '📱',
            title: 'Mobile App',
            description: 'Native iOS and Android applications',
            color: '#f5576c',
            items: ['Offline Maps', 'GPS Tracking', 'Push Notifications', 'Dark Mode']
        },
        {
            icon: '🗺️',
            title: 'Indoor Maps',
            description: 'Detailed floor plans with room-level navigation',
            color: '#4ade80',
            items: ['Floor Plans', 'Room Finder', 'Accessibility Routes', '3D Views']
        },
        {
            icon: '👥',
            title: 'Social Features',
            description: 'Share locations, meet friends, and collaborate',
            color: '#fb923c',
            items: ['Location Sharing', 'Meet Points', 'Group Navigation', 'Reviews & Ratings']
        },
        {
            icon: '🎓',
            title: 'Student Portal',
            description: 'Integration with student information system',
            color: '#a78bfa',
            items: ['Class Schedules', 'Exam Halls', 'Faculty Locations', 'Library Seats']
        },
        {
            icon: '🚗',
            title: 'Parking Assistant',
            description: 'Find and reserve parking spots',
            color: '#22d3ee',
            items: ['Available Spots', 'Reservations', 'Parking Maps', 'Payment Integration']
        },
        {
            icon: '🍔',
            title: 'Food Court Menu',
            description: 'View menus, prices, and place orders',
            color: '#fbbf24',
            items: ['Daily Menus', 'Prices', 'Pre-ordering', 'Dietary Info']
        },
        {
            icon: '🏃',
            title: 'Fitness Tracker',
            description: 'Track walking routes and campus fitness activities',
            color: '#f472b6',
            items: ['Step Counter', 'Route History', 'Leaderboards', 'Challenges']
        }
    ];

    return (
        <div className="advanced-features">
            <div className="features-header">
                <h2>🚀 Advanced Features</h2>
                <p>Explore upcoming enhancements for Campuz Navigation</p>
            </div>

            <div className="features-grid">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="feature-card"
                        style={{ '--feature-color': feature.color }}
                        onClick={() => setShowPlaceholder(true)}
                    >
                        <div className="feature-icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                        <ul className="feature-items">
                            {feature.items.map((item, i) => (
                                <li key={i}>✓ {item}</li>
                            ))}
                        </ul>
                        <button className="explore-button">
                            Explore Feature
                        </button>
                    </div>
                ))}
            </div>

            <div className="cta-section">
                <h3>💡 Have a Feature Request?</h3>
                <p>We're always looking to improve! Share your ideas with us.</p>
                <button className="cta-button" onClick={() => setShowPlaceholder(true)}>
                    Submit Feedback
                </button>
            </div>

            <PlaceholderMessage
                isOpen={showPlaceholder}
                onClose={() => setShowPlaceholder(false)}
            />
        </div>
    );
}
