/**
 * Script to add shortName and blockName fields to all indoor locations
 * Run with: node add-short-names.js
 */

const fs = require('fs');
const path = require('path');

// Import the name utility functions (simplified for Node.js)
function getShortName(fullName, roomType, roomId) {
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
            'IQAC': 'IQAC',
            'ELECTRIC CIRCUITS': 'EC',
            'MICROPROCESSORS AND MICROCONTROLLERS': 'MPC',
            'ELECTRONIC DEVICES AND CIRCUITS': 'EDC',
            'PROJECT / RESEARCH': 'Research',
            'NETWORKS': 'Networks',
            'MICROWAVE / OPTICAL': 'M/O',
            'COMMUNICATION': 'Comm'
        };

        for (const [full, short] of Object.entries(knownAcronyms)) {
            if (cleanName.toUpperCase().includes(full)) {
                return `${short}-Lab`;
            }
        }

        // Create acronym from significant words
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
        if (fullName.length <= 20) {
            return fullName;
        }
        return fullName.substring(0, 17) + '...';
    }

    // For halls and other types
    if (fullName.length <= 20) {
        return fullName;
    }
    return fullName.substring(0, 17) + '...';
}

function getBlockName(parentBuilding) {
    if (!parentBuilding) return 'Unknown Block';

    // Already hyphenated
    if (parentBuilding.includes('-')) {
        return parentBuilding;
    }

    // Extract letter prefix
    const match = parentBuilding.match(/^([A-Z])/i);
    if (match) {
        return `${match[1].toUpperCase()}-Block`;
    }

    return parentBuilding;
}

// Read the indoor location data file
const dataFilePath = path.join(__dirname, 'src', 'indoorLocationData.js');
const fileContent = fs.readFileSync(dataFilePath, 'utf8');

// Parse the export statement to get the data
const dataMatch = fileContent.match(/export const indoorLocationData = ({[\s\S]*});/);
if (!dataMatch) {
    console.error('Could not find indoorLocationData export');
    process.exit(1);
}

// Parse the JSON data
const dataString = dataMatch[1];
let data;
try {
    // Use eval in a safe context (we control the file)
    data = eval(`(${dataString})`);
} catch (e) {
    console.error('Error parsing data:', e);
    process.exit(1);
}

// Add shortName and blockName to each entry
let updated = 0;
for (const [id, entry] of Object.entries(data)) {
    entry.shortName = getShortName(entry.name, entry.roomType, entry.id);
    entry.blockName = getBlockName(entry.parentBuilding);
    updated++;

    // Log a few examples
    if (updated <= 10) {
        console.log(`${id}: "${entry.name}" -> "${entry.shortName}" (${entry.blockName})`);
    }
}

console.log(`\nUpdated ${updated} entries with shortName and blockName fields`);

// Convert back to formatted JavaScript
const outputLines = ['// Indoor Location Data - Auto-generated', `// Total entries: ${updated}`, '', 'export const indoorLocationData = {'];

for (const [id, entry] of Object.entries(data)) {
    outputLines.push(`  "${id}": {`);
    for (const [key, value] of Object.entries(entry)) {
        if (typeof value === 'string') {
            outputLines.push(`    "${key}": "${value}",`);
        } else if (typeof value === 'number') {
            outputLines.push(`    "${key}": ${value},`);
        }
    }
    // Remove trailing comma from last property
    const lastLine = outputLines[outputLines.length - 1];
    outputLines[outputLines.length - 1] = lastLine.replace(/,$/, '');
    outputLines.push('  },');
}

outputLines.push('};');

// Write back to file
const newContent = outputLines.join('\n');
fs.writeFileSync(dataFilePath, newContent, 'utf8');

console.log(`\n✅ Successfully updated ${dataFilePath}`);
console.log('Sample entries:');
console.log(JSON.stringify(Object.values(data).slice(0, 3), null, 2));
