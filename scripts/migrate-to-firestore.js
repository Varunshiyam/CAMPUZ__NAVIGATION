/* global process */
// Data Migration Script - Upload to Firestore
// Run this script once to migrate all data from static files to Firestore

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { nodes, adjacency, locationData } from '../src/data.js';
import { indoorLocationData } from '../src/indoorLocationData.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBIeLrtBpvEhULANLO-h67e1Uo-n20d32I",
    authDomain: "campuz-navigation-shanu.firebaseapp.com",
    projectId: "campuz-navigation-shanu",
    storageBucket: "campuz-navigation-shanu.firebasestorage.app",
    messagingSenderId: "363434573221",
    appId: "1:363434573221:web:d1e787bf21c16e05643c4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
    console.log('🚀 Starting data migration to Firestore...\n');

    try {
        // 1. Upload Nodes (navigation points)
        console.log('📍 Uploading navigation nodes...');
        let batch = writeBatch(db);
        let batchCount = 0;
        let nodeCount = 0;

        for (const [nodeId, nodeData] of Object.entries(nodes)) {
            const nodeRef = doc(db, 'nodes', nodeId);
            batch.set(nodeRef, {
                ...nodeData,
                adjacency: adjacency[nodeId] || []
            });

            batchCount++;
            nodeCount++;

            // Firestore batch limit is 500 operations
            if (batchCount === 500) {
                await batch.commit();
                console.log(`  ✓ Committed batch of ${batchCount} nodes`);
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        // Commit remaining nodes
        if (batchCount > 0) {
            await batch.commit();
            console.log(`  ✓ Committed final batch of ${batchCount} nodes`);
        }
        console.log(`✅ Successfully uploaded ${nodeCount} navigation nodes\n`);

        // 2. Upload Buildings (main locations)
        console.log('🏢 Uploading building data...');
        batch = writeBatch(db);
        batchCount = 0;
        let buildingCount = 0;

        for (const [buildingId, buildingData] of Object.entries(locationData)) {
            // Only upload buildings (not indoor locations)
            if (buildingData.type === 'destination') {
                const buildingRef = doc(db, 'buildings', buildingId);
                batch.set(buildingRef, buildingData);

                batchCount++;
                buildingCount++;

                if (batchCount === 500) {
                    await batch.commit();
                    console.log(`  ✓ Committed batch of ${batchCount} buildings`);
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`  ✓ Committed final batch of ${batchCount} buildings`);
        }
        console.log(`✅ Successfully uploaded ${buildingCount} buildings\n`);

        // 3. Upload Indoor Locations (rooms, labs, classrooms)
        console.log('🚪 Uploading indoor locations...');
        batch = writeBatch(db);
        batchCount = 0;
        let indoorCount = 0;

        for (const [roomId, roomData] of Object.entries(indoorLocationData)) {
            const roomRef = doc(db, 'indoor_locations', roomId);
            batch.set(roomRef, roomData);

            batchCount++;
            indoorCount++;

            if (batchCount === 500) {
                await batch.commit();
                console.log(`  ✓ Committed batch of ${batchCount} indoor locations`);
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`  ✓ Committed final batch of ${batchCount} indoor locations`);
        }
        console.log(`✅ Successfully uploaded ${indoorCount} indoor locations\n`);

        // Summary
        console.log('🎉 Migration Complete!\n');
        console.log('Summary:');
        console.log(`  - Navigation Nodes: ${nodeCount}`);
        console.log(`  - Buildings: ${buildingCount}`);
        console.log(`  - Indoor Locations: ${indoorCount}`);
        console.log(`  - Total Documents: ${nodeCount + buildingCount + indoorCount}\n`);
        console.log('✅ All data successfully migrated to Firestore!');
        console.log('🔗 View in Firebase Console: https://console.firebase.google.com/project/campuz-navigation-shanu/firestore');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run migration
migrateData();
