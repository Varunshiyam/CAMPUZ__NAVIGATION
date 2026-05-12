import React from 'react';
import { getFloorName } from '../utils/roomUtils';
import './FloorBadge.css';

/**
 * FloorBadge Component
 * Displays floor information in a premium glassmorphism badge
 */
export default function FloorBadge({ floor, size = 'medium', variant = 'default' }) {
    const floorName = getFloorName(floor);
    const sizeClass = `floor-badge-${size}`;
    const variantClass = `floor-badge-${variant}`;

    return (
        <div className={`floor-badge ${sizeClass} ${variantClass}`}>
            <span className="floor-text">{floorName}</span>
        </div>
    );
}
