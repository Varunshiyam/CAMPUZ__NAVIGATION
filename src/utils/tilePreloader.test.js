import { describe, it, expect } from 'vitest';
import { lon2tile, lat2tile } from './tilePreloader';

describe('Tile Preloader Utilities', () => {
  it('should correctly convert longitude to tile X for zoom 17', () => {
    // Expected logic from OSM standards
    const lon = 77.0160;
    const zoom = 17;
    const expectedX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    expect(lon2tile(lon, zoom)).toBe(expectedX);
  });

  it('should correctly convert latitude to tile Y for zoom 17', () => {
    const lat = 10.8725;
    const zoom = 17;
    const expectedY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    expect(lat2tile(lat, zoom)).toBe(expectedY);
  });

  it('should return valid tile coordinates for campus bounds at zoom 19', () => {
    const minLon = 77.0160;
    const maxLon = 77.0265;
    const minLat = 10.8725; // south
    const maxLat = 10.8845; // north
    const zoom = 19;
    
    const xMin = lon2tile(minLon, zoom);
    const xMax = lon2tile(maxLon, zoom);
    // Y coordinates go from north (min Y) to south (max Y)
    const yMin = lat2tile(maxLat, zoom);
    const yMax = lat2tile(minLat, zoom);

    expect(xMin).toBeLessThanOrEqual(xMax);
    expect(yMin).toBeLessThanOrEqual(yMax);
    expect(xMax - xMin).toBeGreaterThan(0);
    expect(yMax - yMin).toBeGreaterThan(0);
  });
});
