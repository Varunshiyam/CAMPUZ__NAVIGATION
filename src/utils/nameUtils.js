/**
 * Utility functions for generating short names and display names
 * for indoor locations (labs, classrooms, faculty rooms, etc.)
 */

/**
 * Abbreviates lab names to short forms
 * @param {string} fullName - Full lab name
 * @param {string} roomType - Type of room (lab, classroom, faculty, etc.)
 * @param {string} roomId - Room ID (e.g., "A414")
 * @returns {string} Abbreviated name
 */
export function getShortName(fullName, roomType, roomId) {
    if (!fullName || !roomType) return roomId || 'Unknown';

    // For classrooms and faculty rooms, just return the room number
    if (roomType === 'classroom' || roomType === 'faculty') {
        return roomId;
    }

    // For labs, create intelligent abbreviations
    if (roomType === 'lab') {
        // Remove common suffixes and prefixes
        let cleanName = fullName
            .replace(/\s*Lab(oratory)?\s*/gi, '')
            .replace(/\s*Room\s*/gi, '')
            .replace(new RegExp(`\\s*${roomId}\\s*`, 'gi'), '')
            .trim();

        // Check if it's already an acronym (all caps)
        const words = cleanName.split(/\s+/);
        const isAcronym = words.length === 1 && words[0] === words[0].toUpperCase() && words[0].length <= 6;

        if (isAcronym) {
            return `${words[0]}-Lab`;
        }

        // Check for common known acronyms
        const knownAcronyms = {
            'MATLAB': 'MATLAB',
            'VLSI': 'VLSI',
            'DSP': 'DSP',
            'LIC': 'LIC',
            'COE': 'COE',
            'AI & DS': 'AI&DS',
            'IQAC': 'IQAC'
        };

        for (const [full, short] of Object.entries(knownAcronyms)) {
            if (cleanName.includes(full)) {
                return `${short}-Lab`;
            }
        }

        // Create acronym from significant words (ignore "and", "the", "of", etc.)
        const significantWords = words.filter(word =>
            word.length > 2 && !['and', 'the', 'of', 'for', 'with'].includes(word.toLowerCase())
        );

        if (significantWords.length === 0) {
            significantWords.push(...words);
        }

        // Create acronym
        if (significantWords.length > 1) {
            const acronym = significantWords
                .map(word => word[0].toUpperCase())
                .join('');
            return `${acronym}-Lab`;
        }

        // Fallback: use first word
        return `${words[0]}-Lab`;
    }

    // For offices, cells, and others
    if (roomType === 'office' || roomType === 'cell') {
        // Keep short names as-is
        if (fullName.length <= 20) {
            return fullName;
        }
        // Truncate long names
        return fullName.substring(0, 17) + '...';
    }

    // For halls and other types
    if (fullName.length <= 20) {
        return fullName;
    }
    return fullName.substring(0, 17) + '...';
}

/**
 * Converts parent building ID to display name
 * @param {string} parentBuilding - Parent building ID (e.g., "ABlock", "E-Block")
 * @returns {string} Block display name (e.g., "A-Block", "E-Block")
 */
export function getBlockName(parentBuilding) {
    if (!parentBuilding) return 'Unknown Block';

    // Already hyphenated
    if (parentBuilding.includes('-')) {
        return parentBuilding;
    }

    // Extract letter prefix (e.g., "ABlock" -> "A")
    const match = parentBuilding.match(/^([A-Z])/i);
    if (match) {
        return `${match[1].toUpperCase()}-Block`;
    }

    return parentBuilding;
}

/**
 * Gets floor display name
 * @param {number} floor - Floor number (0, 1, 2, etc.)
 * @returns {string} Floor display (e.g., "Ground", "First", "Second")
 */
export function getFloorDisplayName(floor) {
    if (floor === undefined || floor === null) return 'Unknown';

    const floorNames = {
        0: 'Ground',
        1: 'First',
        2: 'Second',
        3: 'Third',
        4: 'Fourth',
        5: 'Fifth',
        6: 'Sixth',
        7: 'Seventh',
        8: 'Eighth',
        9: 'Ninth',
        10: 'Tenth'
    };

    return floorNames[floor] || `${floor}th`;
}

/**
 * Gets complete floor display with number
 * @param {number} floor - Floor number
 * @returns {string} Complete floor display (e.g., "Ground (0)", "Third (3)")
 */
export function getFloorDisplayComplete(floor) {
    const name = getFloorDisplayName(floor);
    return `${name} (${floor})`;
}
