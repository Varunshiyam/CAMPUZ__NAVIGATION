// @vitest-environment jsdom
import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as MapProviderModule from './components/MapProvider';
import ExplorePage from './ExplorePage';
import MapPage from './MapPage';
import L from 'leaflet';

vi.mock('leaflet', () => {
    let layers = [];
    class MockMarkerClass {
        constructor() {
            this.bindPopup = vi.fn().mockReturnThis();
            this.on = vi.fn().mockReturnThis();
            this.__fromExplorePage = document.body.innerHTML.includes('ExplorePage') || document.body.innerHTML.includes('Explore');
        }
        addTo() {
            layers.push(this);
            return this;
        }
    }

    const mockMap = {
        hasLayer: vi.fn(l => layers.includes(l)),
        removeLayer: vi.fn(l => {
            layers = layers.filter(layer => layer !== l);
        }),
        off: vi.fn(),
        on: vi.fn(),
        getZoom: vi.fn(() => 18),
        flyTo: vi.fn(),
        invalidateSize: vi.fn(),
        getCenter: vi.fn(),
        setView: vi.fn(),
        __getLayers: () => layers,
        eachLayer: vi.fn((cb) => {
            layers.forEach(cb);
        }),
    };

    return {
        default: {
            divIcon: vi.fn((opts) => opts),
            Marker: MockMarkerClass,
            marker: vi.fn(() => new MockMarkerClass()),
            icon: vi.fn((opts) => opts),
            Icon: {
                Default: {
                    prototype: {
                        _getIconUrl: vi.fn()
                    },
                    mergeOptions: vi.fn()
                }
            },
            map: vi.fn(() => mockMap),
            latLngBounds: vi.fn(),
            tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
        }
    };
});

Object.defineProperty(globalThis, 'navigator', {
    value: {
        geolocation: {
            watchPosition: vi.fn(),
            clearWatch: vi.fn()
        }
    },
    writable: true
});

describe('Map Marker Leak Issue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('checks if ExplorePage markers leak to MapPage', async () => {
        let mockMap;
        vi.spyOn(MapProviderModule, 'useMap').mockImplementation(() => {
            if (!mockMap) {
                mockMap = L.map();
            }
            return {
                map: mockMap,
                attachMap: vi.fn(),
                detachMap: vi.fn(),
                isInitialized: true,
            };
        });

        // 1. Render ExplorePage
        const { unmount } = render(
            <BrowserRouter>
                <ExplorePage />
            </BrowserRouter>
        );

        // Fast forward so renderChunk adds markers
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        // Verify markers are added
        const initialLayers = mockMap.__getLayers();
        console.log('Markers added by ExplorePage:', initialLayers.length);
        expect(initialLayers.length).toBeGreaterThan(0);

        // 2. Unmount ExplorePage (Simulate navigating away)
        unmount();

        // 3. Fast forward any pending setTimeouts from ExplorePage
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        // 4. Render MapPage
        render(
            <BrowserRouter>
                <MapPage />
            </BrowserRouter>
        );

        // Verify how many markers are left on the shared map
        const remainingLayers = mockMap.__getLayers();
        console.log('Markers remaining on shared map:', remainingLayers.length);
        
        const exploreMarkersRemaining = remainingLayers.filter(m => m.__fromExplorePage);
        console.log('ExplorePage markers remaining:', exploreMarkersRemaining.length);
    });
});
