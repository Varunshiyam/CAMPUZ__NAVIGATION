/**
 * Building Data Parser
 * Parses building text files into structured JSON for indoor navigation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Building ID mapping
const BUILDING_MAP = {
    'ABLOCK': 'ABlock',
    'DBLOCK': 'DBlock',
    'EBLOCK': 'E-Block'
};

// Room type mapping based on section headers
const ROOM_TYPE_MAP = {
    'Laboratory': 'lab',
    'FacultyRoom': 'faculty',
    'OfficeRooms': 'office',
    'Officerooms': 'office',
    'HALLS': 'hall',
    'RESTROOMS': 'restroom',
    'CLASSROOMS': 'classroom',
    'Cells': 'cell'
};

/**
 * Extract floor number from text
 */
function extractFloor(text) {
    const floorMatch = text.match(/(\d+)[-\s]?[Ff]loor/);
    if (floorMatch) return parseInt(floorMatch[1]);

    if (text.includes('0th') || text.includes('0-')) return 0;
    if (text.includes('Ground')) return 0;

    return 0; // Default to ground floor
}

/**
 * Extract room numbers from text
 */
function extractRoomNumbers(text) {
    // Match patterns like A107, E204, D101, etc.
    const roomPattern = /([A-Z]\d{3}(?:[A-Z]|-[A-Z])?)/g;
    const matches = text.match(roomPattern);
    return matches || [];
}

/**
 * Extract room name/description
 */
function extractRoomName(text) {
    // Remove room numbers and floor info
    let name = text
        .replace(/[A-Z]\d{3}(?:[A-Z]|-[A-Z])?/g, '')
        .replace(/\d+[-\s]?[Ff]loor:?/g, '')
        .replace(/Laboratory\s*-\s*/g, '')
        .replace(/Class\s*Rooms?\s*:?\s*-?\s*/gi, '')
        .replace(/Faculty\s*Rooms?\s*:?\s*-?\s*/gi, '')
        .replace(/Departments?\s*-\s*/gi, '')
        .trim();

    // Clean up parentheses and brackets
    name = name.replace(/^\(|\)$/g, '').replace(/^\[|\]$/g, '');

    return name || 'Room';
}

/**
 * Parse a single building file
 */
function parseBuildingFile(filePath, buildingId) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    const rooms = [];
    let currentSection = null;
    let currentFloor = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Check for section headers
        const sectionMatch = Object.keys(ROOM_TYPE_MAP).find(key =>
            line.startsWith(key + ':')
        );

        if (sectionMatch) {
            currentSection = ROOM_TYPE_MAP[sectionMatch];
            continue;
        }

        // Skip building name lines
        if (line.match(/^[A-Z]+BLOCK:$/i)) continue;

        // Check for floor information
        const floorInfo = extractFloor(line);
        if (line.match(/\d+[-\s]?[Ff]loor:?/) && !line.match(/[A-Z]\d{3}/)) {
            currentFloor = floorInfo;
            continue;
        }

        // Extract room information
        const roomNumbers = extractRoomNumbers(line);
        if (roomNumbers.length > 0 && currentSection) {
            const roomName = extractRoomName(line);
            const floor = extractFloor(line) || currentFloor;

            // Handle multiple rooms on same line (e.g., "A101.A102.A112")
            roomNumbers.forEach((roomId, index) => {
                let finalName = roomName;

                // If multiple rooms and generic name, use room number
                if (roomNumbers.length > 1 && (roomName === 'Room' || roomName.length < 3)) {
                    finalName = `${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} ${roomId}`;
                } else if (roomNumbers.length > 1 && index > 0) {
                    // For additional rooms with same description
                    finalName = `${roomName} ${roomId}`;
                }

                rooms.push({
                    id: roomId,
                    name: finalName,
                    parentBuilding: buildingId,
                    floor: floor,
                    roomType: currentSection,
                    category: currentSection === 'classroom' ? 'block' : currentSection,
                    type: 'indoor',
                    opens: currentSection === 'restroom' ? 0 : 9,
                    closes: currentSection === 'restroom' ? 24 : 17
                });
            });
        }
    }

    return rooms;
}

/**
 * Main parsing function
 */
function parseAllBuildings() {
    const buildingsDir = path.join(__dirname, '../Buildings');
    const files = {
        'A_Block.txt': 'ABlock',
        'D_Block.txt': 'DBlock',
        'E_Block.txt': 'E-Block'
    };

    let allRooms = [];

    for (const [filename, buildingId] of Object.entries(files)) {
        const filePath = path.join(buildingsDir, filename);
        if (fs.existsSync(filePath)) {
            console.log(`Parsing ${filename}...`);
            const rooms = parseBuildingFile(filePath, buildingId);
            console.log(`  Found ${rooms.length} rooms`);
            allRooms = allRooms.concat(rooms);
        }
    }

    console.log(`\nTotal rooms parsed: ${allRooms.length}`);

    // Generate JavaScript object format
    let output = '// Indoor Location Data - Auto-generated\n';
    output += '// Total entries: ' + allRooms.length + '\n\n';
    output += 'export const indoorLocationData = {\n';

    allRooms.forEach((room, index) => {
        output += `  "${room.id}": ${JSON.stringify(room, null, 2).replace(/\n/g, '\n  ')}`;
        if (index < allRooms.length - 1) output += ',';
        output += '\n';
    });

    output += '};\n';

    // Write to file
    const outputPath = path.join(__dirname, '../src/indoorLocationData.js');
    fs.writeFileSync(outputPath, output);
    console.log(`\nGenerated: ${outputPath}`);

    // Also generate a summary
    const summary = {
        totalRooms: allRooms.length,
        byBuilding: {},
        byType: {},
        byFloor: {}
    };

    allRooms.forEach(room => {
        // By building
        summary.byBuilding[room.parentBuilding] = (summary.byBuilding[room.parentBuilding] || 0) + 1;

        // By type
        summary.byType[room.roomType] = (summary.byType[room.roomType] || 0) + 1;

        // By floor
        const floorKey = `Floor ${room.floor}`;
        summary.byFloor[floorKey] = (summary.byFloor[floorKey] || 0) + 1;
    });

    console.log('\n=== Summary ===');
    console.log('By Building:', summary.byBuilding);
    console.log('By Type:', summary.byType);
    console.log('By Floor:', summary.byFloor);

    return allRooms;
}

// Run parser
parseAllBuildings();

export { parseAllBuildings };
