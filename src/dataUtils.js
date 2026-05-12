import { locationData, nodes, adjacency } from './data';

// Helper function to get location data with coordinates
export const getLocationWithCoords = (id) => {
    const location = locationData[id];
    const coords = nodes[id];

    if (!location || !coords) return null;

    return {
        ...location,
        lat: coords.lat,
        lon: coords.lon
    };
};

// Get all destinations with coordinates
export const getAllDestinations = () => {
    return Object.keys(locationData)
        .map(id => getLocationWithCoords(id))
        .filter(Boolean);
};

// Validate that all locationData entries have corresponding nodes
export const validateData = () => {
    const missingNodes = [];
    const missingLocations = [];

    Object.keys(locationData).forEach(id => {
        if (!nodes[id]) {
            missingNodes.push(id);
        }
    });

    Object.keys(nodes).forEach(id => {
        if (locationData[id] && !adjacency[id]) {
            console.warn(`Node ${id} has no adjacency data`);
        }
    });

    if (missingNodes.length > 0) {
        console.error('Missing nodes for locations:', missingNodes);
    }

    return { missingNodes, missingLocations };
};
