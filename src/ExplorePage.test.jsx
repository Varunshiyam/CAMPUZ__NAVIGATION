// @vitest-environment jsdom
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ExplorePage from './ExplorePage';
import * as MapProviderModule from './components/MapProvider';
import L from 'leaflet';

// Mock Leaflet
vi.mock('leaflet', () => {
    const mockMarkerInstance = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        getElement: vi.fn(),
    };
    return {
        default: {
            divIcon: vi.fn((opts) => opts),
            marker: vi.fn(() => mockMarkerInstance),
        }
    };
});

// Mock react-router
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

describe('ExplorePage Zoom Scaling', () => {
    let mockMap;
    let zoomCallbacks = [];

    beforeEach(() => {
        vi.useFakeTimers();
        zoomCallbacks = [];

        globalThis.navigator = {
            geolocation: {
                watchPosition: vi.fn(),
                clearWatch: vi.fn()
            }
        };

        mockMap = {
            getZoom: vi.fn(() => 19),
            on: vi.fn((event, callback) => {
                if (event === 'zoom') zoomCallbacks.push(callback);
            }),
            off: vi.fn(),
            hasLayer: vi.fn(),
            removeLayer: vi.fn(),
            flyTo: vi.fn(),
        };

        vi.spyOn(MapProviderModule, 'useMap').mockReturnValue({
            map: mockMap,
            attachMap: vi.fn(),
            detachMap: vi.fn(),
            isInitialized: true,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('creates markers with iconAnchor [0, 0] to fix shifting', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <ExplorePage />
                </BrowserRouter>
            );
        });

        // Fast-forward setTimeout(renderChunk, 100)
        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(L.divIcon).toHaveBeenCalled();
        const firstDivIconCallOpts = L.divIcon.mock.calls[0][0];

        // Ensure the anchor is [12, 12] to precisely center the marker on the coordinate
        expect(firstDivIconCallOpts.iconAnchor).toEqual([12, 12]);
        // Ensure wrapper class is applied
        expect(firstDivIconCallOpts.className).toBe('minimal-professional-marker');
    });

    it('updates --map-icon-scale CSS variable on zoom', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <ExplorePage />
                </BrowserRouter>
            );
        });

        const mapContainers = document.querySelectorAll('#explore-map-container');
        const mapContainer = mapContainers[mapContainers.length - 1];
        expect(mapContainer).not.toBeNull();

        // Initial zoom is 19. base is 18. Scale = 2^(19-18) = 2.
        expect(mapContainer.style.getPropertyValue('--map-icon-scale')).toBe('2');

        // Simulate zooming out to 17
        mockMap.getZoom.mockReturnValue(17);
        act(() => {
            zoomCallbacks.forEach(cb => cb());
        });

        // 2^(17-18) = 0.5
        expect(mapContainer.style.getPropertyValue('--map-icon-scale')).toBe('0.5');

        // Simulate zooming in to 20
        mockMap.getZoom.mockReturnValue(20);
        act(() => {
            zoomCallbacks.forEach(cb => cb());
        });

        // 2^(20-18) = 4
        expect(mapContainer.style.getPropertyValue('--map-icon-scale')).toBe('4');
    });
});
