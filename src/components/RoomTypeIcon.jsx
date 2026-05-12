import React from 'react';
import { FaFlask, FaChalkboard, FaUserTie, FaTheaterMasks, FaBriefcase, FaBuilding, FaRestroom, FaMapMarkerAlt } from 'react-icons/fa';
import { getRoomTypeColor } from '../utils/roomUtils';
import './RoomTypeIcon.css';

/**
 * RoomTypeIcon Component
 * Displays an icon for different room types with consistent styling
 */
export default function RoomTypeIcon({ roomType, size = 'medium', showLabel = false }) {
    const colors = getRoomTypeColor(roomType);

    const iconMap = {
        lab: FaFlask,
        classroom: FaChalkboard,
        faculty: FaUserTie,
        hall: FaTheaterMasks,
        office: FaBriefcase,
        cell: FaBuilding,
        restroom: FaRestroom,
        default: FaMapMarkerAlt
    };

    const Icon = iconMap[roomType] || iconMap.default;

    const sizeClass = `room-icon-${size}`;

    return (
        <div className={`room-type-icon ${sizeClass}`}>
            <div
                className="icon-wrapper"
                style={{ background: colors.gradient }}
            >
                <Icon className="icon" />
            </div>
            {showLabel && (
                <span className="icon-label">{colors.icon}</span>
            )}
        </div>
    );
}
