/**
 * Utility functions for room and indoor location management
 */

/**
 * Converts floor number to human-readable floor name
 * @param {number} floorNumber - Floor number (0-based)
 * @returns {string} Formatted floor name
 */
export function getFloorName(floorNumber) {
    if (floorNumber === 0) return "Ground Floor";
    if (floorNumber === 1) return "First Floor";
    if (floorNumber === 2) return "Second Floor";
    if (floorNumber === 3) return "Third Floor";
    if (floorNumber === 4) return "Fourth Floor";
    if (floorNumber === 5) return "Fifth Floor";
    return `Floor ${floorNumber}`;
}

/**
 * Returns color scheme for different room types
 * @param {string} roomType - Type of room (lab, classroom, faculty, etc.)
 * @returns {object} Color scheme with primary and secondary colors
 */
export function getRoomTypeColor(roomType) {
    const colors = {
        lab: {
            primary: "#3B82F6",
            secondary: "#60A5FA",
            gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
            icon: "🧪"
        },
        classroom: {
            primary: "#10B981",
            secondary: "#34D399",
            gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
            icon: "📚"
        },
        faculty: {
            primary: "#8B5CF6",
            secondary: "#A78BFA",
            gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
            icon: "👨‍🏫"
        },
        hall: {
            primary: "#F59E0B",
            secondary: "#FBBF24",
            gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
            icon: "🎭"
        },
        office: {
            primary: "#6B7280",
            secondary: "#9CA3AF",
            gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
            icon: "💼"
        },
        cell: {
            primary: "#EC4899",
            secondary: "#F472B6",
            gradient: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
            icon: "🏢"
        },
        restroom: {
            primary: "#64748B",
            secondary: "#94A3B8",
            gradient: "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)",
            icon: "🚻"
        },
        default: {
            primary: "#6B7280",
            secondary: "#9CA3AF",
            gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
            icon: "📍"
        }
    };

    return colors[roomType] || colors.default;
}

/**
 * Groups an array of rooms by floor number
 * @param {Array} rooms - Array of room objects
 * @returns {object} Rooms grouped by floor
 */
export function groupRoomsByFloor(rooms) {
    return rooms.reduce((acc, room) => {
        const floor = room.floor ?? 0;
        if (!acc[floor]) {
            acc[floor] = [];
        }
        acc[floor].push(room);
        return acc;
    }, {});
}

/**
 * Formats room location string
 * @param {object} room - Room object with parentBuilding and floor
 * @param {object} locationData - Location data object for building lookup
 * @returns {string} Formatted location string
 */
export function formatRoomLocation(room, locationData) {
    if (!room.parentBuilding) return "";

    const building = locationData[room.parentBuilding];
    const buildingName = building ? building.name : room.parentBuilding;
    const floorName = getFloorName(room.floor ?? 0);

    return `${buildingName} - ${floorName}`;
}

/**
 * Gets display name for room type
 * @param {string} roomType - Room type
 * @returns {string} Display name
 */
export function getRoomTypeDisplayName(roomType) {
    const names = {
        lab: "Laboratory",
        classroom: "Classroom",
        faculty: "Faculty Room",
        hall: "Hall",
        office: "Office",
        cell: "Cell",
        restroom: "Restroom"
    };

    return names[roomType] || roomType;
}

/**
 * Sorts rooms by floor and then by room number
 * @param {Array} rooms - Array of room objects
 * @returns {Array} Sorted rooms
 */
export function sortRooms(rooms) {
    return [...rooms].sort((a, b) => {
        // First sort by floor
        if (a.floor !== b.floor) {
            return (a.floor ?? 0) - (b.floor ?? 0);
        }
        // Then sort by room ID/number
        return a.id.localeCompare(b.id);
    });
}
