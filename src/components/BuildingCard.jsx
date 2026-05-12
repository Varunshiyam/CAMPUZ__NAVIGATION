import { useNavigate } from 'react-router-dom';
import { FaDirections, FaShare, FaTimes, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './BuildingCard.css';

const BuildingCard = ({ building, onClose, userLocation }) => {
    const navigate = useNavigate();

    if (!building) return null;

    // Calculate distance from user location
    const calculateDistance = () => {
        if (!userLocation || !building.lat || !building.lon) return null;

        const R = 6371e3; // Earth radius in meters
        const φ1 = userLocation.lat * Math.PI / 180;
        const φ2 = building.lat * Math.PI / 180;
        const Δφ = (building.lat - userLocation.lat) * Math.PI / 180;
        const Δλ = (building.lon - userLocation.lon) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
    };

    // Check if building is open
    const getStatus = () => {
        if (!building.opens || !building.closes) return { text: '24/7', color: '#34C759' };

        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour >= building.opens && currentHour < building.closes) {
            const closingIn = building.closes - currentHour;
            if (closingIn <= 1) {
                return { text: 'Closing Soon', color: '#FF9500' };
            }
            return { text: 'Open', color: '#34C759' };
        }
        return { text: 'Closed', color: '#FF3B30' };
    };

    const status = getStatus();
    const distance = calculateDistance();

    const handleDirections = () => {
        navigate('/map', {
            state: {
                destination: building.id,
                userLocation: userLocation
            }
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: building.name,
                text: `Check out ${building.name} on campus!`,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${building.name} - ${window.location.href}`);
            alert('Location link copied to clipboard!');
        }
    };

    const handleIndoorLocationClick = (locationId) => {
        // Navigate to BuildingsPage and scroll to this building
        navigate('/buildings', {
            state: {
                scrollTo: building.id,
                highlightRoom: locationId
            }
        });
    };

    // Get indoor locations for this building
    const getIndoorLocations = () => {
        if (!building.indoorLocations || building.indoorLocations.length === 0) {
            return [];
        }
        return building.indoorLocations.slice(0, 5); // Show first 5
    };

    const indoorLocations = getIndoorLocations();

    return (
        <>
            <div className="building-card-overlay" onClick={onClose} />
            <div className="building-card">
                <button className="close-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                {/* TODO: Photo Gallery - Future Enhancement */}
                <div className="photo-gallery-placeholder">
                    <div className="placeholder-text">📸 Photo Gallery Coming Soon</div>
                </div>

                <div className="building-info">
                    <div className="building-header">
                        <h2>{building.name}</h2>
                        <span className="category-badge">{building.category}</span>
                    </div>

                    <div className="status-row">
                        <div className="status-badge" style={{ color: status.color }}>
                            <span className="status-dot" style={{ backgroundColor: status.color }}></span>
                            {status.text}
                        </div>
                        {distance && (
                            <div className="distance">
                                <FaMapMarkerAlt /> {distance}
                            </div>
                        )}
                    </div>

                    {building.opens && building.closes && (
                        <div className="hours">
                            <FaClock /> {building.opens}:00 AM - {building.closes > 12 ? building.closes - 12 : building.closes}:00 {building.closes >= 12 ? 'PM' : 'AM'}
                        </div>
                    )}

                    {building.description && (
                        <div className="description">
                            <h3>About</h3>
                            <p>{building.description}</p>
                        </div>
                    )}

                    {building.facilities && building.facilities.length > 0 && (
                        <div className="facilities">
                            <h3>Facilities</h3>
                            <div className="facility-tags">
                                {building.facilities.map((facility, idx) => (
                                    <span key={idx} className="facility-tag">{facility}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {building.departments && building.departments.length > 0 && (
                        <div className="departments">
                            <h3>Departments</h3>
                            <p>{building.departments.join(', ')}</p>
                        </div>
                    )}

                    {indoorLocations.length > 0 && (
                        <div className="indoor-locations">
                            <h3>Indoor Locations</h3>
                            <div className="location-list">
                                {indoorLocations.map((locId) => (
                                    <div
                                        key={locId}
                                        className="location-item"
                                        onClick={() => handleIndoorLocationClick(locId)}
                                    >
                                        <span className="location-icon">📍</span>
                                        <span className="location-name">{locId}</span>
                                        <span className="location-arrow">›</span>
                                    </div>
                                ))}
                            </div>
                            {building.indoorLocations.length > 5 && (
                                <div className="view-all" onClick={() => navigate('/buildings', { state: { scrollTo: building.id } })}>
                                    View all {building.indoorLocations.length} locations →
                                </div>
                            )}
                        </div>
                    )}

                    <div className="action-buttons">
                        <button className="primary-btn" onClick={handleDirections}>
                            <FaDirections /> Directions
                        </button>
                        <button className="secondary-btn" onClick={handleShare}>
                            <FaShare /> Share
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BuildingCard;
