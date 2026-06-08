// Convert longitude to tile X
export const lon2tile = (lon, zoom) => {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
};

// Convert latitude to tile Y
export const lat2tile = (lat, zoom) => {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
};

// Generate list of tile URLs for bounds and zoom levels
const generateTileUrls = (bounds, minZoom, maxZoom) => {
    const urls = [];
    const subdomains = ['a', 'b', 'c'];

    for (let z = minZoom; z <= maxZoom; z++) {
        // bounds structure: [[south, west], [north, east]]
        const south = bounds[0][0];
        const west = bounds[0][1];
        const north = bounds[1][0];
        const east = bounds[1][1];

        // Tile coordinates at this zoom
        const xMin = lon2tile(west, z);
        const xMax = lon2tile(east, z);
        // Note: Y coordinates go from top to bottom (north to south)
        const yMin = lat2tile(north, z);
        const yMax = lat2tile(south, z);

        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                const s = subdomains[(x + y) % subdomains.length];
                urls.push(`https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
            }
        }
    }
    return urls;
};

// Preload tiles slowly to avoid hammering OSM
export const preloadTiles = async () => {
    const HAS_PRELOADED_KEY = 'map_tiles_preloaded_v1';
    
    // Check if we already preloaded
    if (localStorage.getItem(HAS_PRELOADED_KEY)) {
        console.log('✅ Map tiles already preloaded');
        return;
    }

    const bounds = [
        [10.8725, 77.0160], // SOUTH WEST
        [10.8845, 77.0265]  // NORTH EAST
    ];
    
    const tileUrls = generateTileUrls(bounds, 17, 19);
    console.log(`🗺️ Starting background preload of ${tileUrls.length} map tiles...`);

    // Fetch them in small batches with delays
    const BATCH_SIZE = 5;
    const DELAY_MS = 500; // 500ms between batches to be respectful to OSM
    
    for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
        const batch = tileUrls.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(url => 
            fetch(url, { mode: 'cors' })
                .catch(err => console.warn('Failed to preload tile:', url, err))
        ));

        // Wait before next batch
        if (i + BATCH_SIZE < tileUrls.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    console.log('✅ All map tiles preloaded successfully!');
    localStorage.setItem(HAS_PRELOADED_KEY, 'true');
};
