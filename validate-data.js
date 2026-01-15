// Quick data validation script
// Run this in browser console to check data integrity

console.log('=== Data Validation ===');

// Import the data
import { nodes, adjacency, locationData } from './data.js';

// Check each locationData entry
const missingInNodes = [];
const missingInAdjacency = [];

Object.keys(locationData).forEach(id => {
    if (!nodes[id]) {
        missingInNodes.push(id);
    }
    if (!adjacency[id]) {
        missingInAdjacency.push(id);
    }
});

console.log('Missing in nodes:', missingInNodes);
console.log('Missing in adjacency:', missingInAdjacency);

console.log('\n=== Sample Test ===');
console.log('Testing "ABlock":');
console.log('  - In locationData:', !!locationData['ABlock']);
console.log('  - In nodes:', !!nodes['ABlock']);
console.log('  - In adjacency:', !!adjacency['ABlock']);

if (missingInNodes.length === 0 && missingInAdjacency.length === 0) {
    console.log('\n✅ All locationData entries have corresponding nodes and adjacency data!');
} else {
    console.error('\n❌ Data issues found!');
}
