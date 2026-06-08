// @vitest-environment jsdom
import React, { useEffect, useRef } from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MapProvider, useMap } from './MapProvider';

// Mock Leaflet as it relies heavily on the DOM
vi.mock('leaflet', () => {
    const mockMap = {
        setView: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        invalidateSize: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
        getZoom: vi.fn(() => 18),
    };
    
    const mockTileLayer = {
        addTo: vi.fn().mockReturnThis(),
    };

    return {
        default: {
            map: vi.fn(() => mockMap),
            tileLayer: vi.fn(() => mockTileLayer),
            latLngBounds: vi.fn(() => ({})),
        }
    };
});

// Polyfill ResizeObserver for jsdom
class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
}

describe('MapProvider', () => {
    beforeEach(() => {
        globalThis.ResizeObserver = ResizeObserverPolyfill;
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    const TestComponent = ({ onInit }) => {
        const { isInitialized, attachMap, detachMap, map } = useMap();
        const containerRef = useRef(null);

        useEffect(() => {
            if (isInitialized && containerRef.current) {
                attachMap(containerRef.current);
                if (onInit) onInit({ map, containerRef });
            }
            return () => {
                detachMap();
            };
        }, [isInitialized, attachMap, detachMap, map, onInit]);

        return <div data-testid="map-container" ref={containerRef} />;
    };

    it('initializes the map and creates the global map element', () => {
        render(
            <MapProvider>
                <div data-testid="child-element">Child</div>
            </MapProvider>
        );

        expect(screen.getByTestId('child-element')).toBeTruthy();
        
        const globalContainer = document.getElementById('global-leaflet-map');
        expect(globalContainer).toBeTruthy();
    });

    it('attaches map to container and calls invalidateSize', async () => {
        let capturedMap = null;
        
        await act(async () => {
            render(
                <MapProvider>
                    <TestComponent onInit={({ map }) => { capturedMap = map; }} />
                </MapProvider>
            );
        });

        const container = screen.getByTestId('map-container');
        const mapElement = document.getElementById('global-leaflet-map');
        
        expect(container.contains(mapElement)).toBe(true);
        expect(capturedMap).not.toBeNull();
        
        // invalidateSize should have been called immediately
        expect(capturedMap.invalidateSize).toHaveBeenCalledTimes(1);

        // Advance timers to trigger the staggered timeouts
        await act(async () => {
            vi.advanceTimersByTime(50);
        });
        expect(capturedMap.invalidateSize).toHaveBeenCalledTimes(2);

        await act(async () => {
            vi.advanceTimersByTime(300); // reaches 350ms total
        });
        expect(capturedMap.invalidateSize).toHaveBeenCalledTimes(3);
    });

    it('detaches map back to hidden container on unmount', async () => {
        const Wrapper = () => {
            const [show, setShow] = React.useState(true);
            return (
                <MapProvider>
                    {show && <TestComponent />}
                    <button onClick={() => setShow(false)}>Hide</button>
                </MapProvider>
            );
        };

        render(<Wrapper />);

        let mapElement = document.getElementById('global-leaflet-map');
        expect(mapElement.parentNode.style.display).not.toBe('none');

        await act(async () => {
            screen.getByText('Hide').click();
        });

        // After unmount, the mapElement should be back in the hidden container
        expect(mapElement.parentNode.style.display).toBe('none');
    });
});
