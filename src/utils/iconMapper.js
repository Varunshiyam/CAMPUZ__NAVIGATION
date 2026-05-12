// Icon mapper utility for building categories
// Maps categories to custom uploaded icons

// Custom icon paths from /public/map-icons/
const iconMap = {
    'block': '/map-icons/Block.png',
    'library': '/map-icons/Block.png', // Using Block icon for library
    'food': '/map-icons/FoodCourt.png',
    'lab': '/map-icons/Computer_Lab.png',
    'hostel': '/map-icons/Hostel.png',
    'snacks': '/map-icons/SnacksBox.png',
    'store': '/map-icons/Store.png',
    'parking': '/map-icons/Parking.png',
    'hall': '/map-icons/Block.png', // Using Block icon for halls
    'sport': '/map-icons/Block.png', // Using Block icon for sports
    'office': '/map-icons/Block.png', // Using Block icon for offices
    'print': '/map-icons/Print.png',
    'other': '/map-icons/Block.png', // Default to Block icon
};

// Fallback icon
const DefaultIcon = '/map-icons/Block.png';

/**
 * Get icon URL for a specific category
 * @param {string} category - The category name
 * @returns {string} Icon URL
 */
export const getIconForCategory = (category) => {
    return iconMap[category?.toLowerCase()] || DefaultIcon;
};

/**
 * Get icon URL for a specific location
 * Intelligently selects icon based on location name and category
 * @param {string} locationId - The location ID
 * @param {object} locationData - The location data object
 * @returns {string} Icon URL
 */
export const getIconForLocation = (locationId, locationData) => {
    const location = locationData[locationId];
    if (!location) return DefaultIcon;

    // Check location name for specific keywords
    const name = location.name?.toLowerCase() || '';
    const id = locationId?.toLowerCase() || '';

    // Priority matching based on name/id keywords
    if (name.includes('food') || name.includes('canteen') || name.includes('mess') || id.includes('food')) {
        return iconMap['food'];
    }
    if (name.includes('lab') || name.includes('computer') || id.includes('lab')) {
        return iconMap['lab'];
    }
    if (name.includes('hostel') || id.includes('hostel')) {
        return iconMap['hostel'];
    }
    if (name.includes('snack') || name.includes('cafe') || id.includes('snack')) {
        return iconMap['snacks'];
    }
    if (name.includes('store') || name.includes('shop') || id.includes('store')) {
        return iconMap['store'];
    }
    if (name.includes('parking') || id.includes('parking')) {
        return iconMap['parking'];
    }
    if (name.includes('print') || id.includes('print')) {
        return iconMap['print'];
    }

    // Fall back to category-based mapping
    if (location.category) {
        return getIconForCategory(location.category);
    }

    // Final fallback
    return DefaultIcon;
};

export { DefaultIcon };
