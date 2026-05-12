import { useState, useMemo } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { locationData, nodes } from '../data';
import './SearchPanel.css';
import { useSearchPlaceholder } from '../hooks/useSearchPlaceholder';

const SearchPanel = ({ onSelectLocation, userLocation }) => {
    const searchPlaceholder = useSearchPlaceholder();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All', icon: '🏛️' },
        { id: 'block', label: 'Blocks', icon: '🏢' },
        { id: 'food', label: 'Food', icon: '🍽️' },
        { id: 'library', label: 'Library', icon: '📚' },
        { id: 'sport', label: 'Sports', icon: '⚽' },
        { id: 'hostel', label: 'Hostels', icon: '🛏️' },
        { id: 'lab', label: 'Labs', icon: '⚗️' },
    ];

    // Calculate nearby places
    const nearbyPlaces = useMemo(() => {
        if (!userLocation) return [];

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3;
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        return Object.entries(locationData)
            .filter(([id, loc]) => loc.type === 'destination' && nodes[id])
            .map(([id, loc]) => ({
                id,
                ...loc,
                distance: calculateDistance(
                    userLocation.lat,
                    userLocation.lon,
                    nodes[id].lat,
                    nodes[id].lon
                )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);
    }, [userLocation]);

    // Filter locations based on search and category
    const filteredLocations = useMemo(() => {
        let filtered = Object.entries(locationData)
            .filter(([, loc]) => loc.type === 'destination');

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(([, loc]) => loc.category === selectedCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(([id, loc]) =>
                loc.name.toLowerCase().includes(query) ||
                id.toLowerCase().includes(query)
            );
        }

        return filtered.slice(0, 10);
    }, [searchQuery, selectedCategory]);

    const formatDistance = (meters) => {
        return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
    };

    return (
        <div className="search-panel">
            <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="clear-btn" onClick={() => setSearchQuery('')}>
                        <FaTimes />
                    </button>
                )}
            </div>

            <div className="category-filters">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            {searchQuery && filteredLocations.length > 0 && (
                <div className="search-results">
                    <h3>Search Results</h3>
                    {filteredLocations.map(([id, loc]) => (
                        <div
                            key={id}
                            className="result-item"
                            onClick={() => {
                                onSelectLocation(id, loc);
                                setSearchQuery('');
                            }}
                        >
                            <div className="result-icon">{categories.find(c => c.id === loc.category)?.icon || '📍'}</div>
                            <div className="result-info">
                                <div className="result-name">{loc.name}</div>
                                <div className="result-category">{loc.category}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!searchQuery && nearbyPlaces.length > 0 && (
                <div className="nearby-places">
                    <h3>Nearby Places</h3>
                    {nearbyPlaces.map(place => (
                        <div
                            key={place.id}
                            className="nearby-item"
                            onClick={() => onSelectLocation(place.id, place)}
                        >
                            <div className="nearby-icon">{categories.find(c => c.id === place.category)?.icon || '📍'}</div>
                            <div className="nearby-info">
                                <div className="nearby-name">{place.name}</div>
                                <div className="nearby-distance">{formatDistance(place.distance)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchPanel;
