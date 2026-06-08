// @vitest-environment jsdom
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CampusMap from './CampusMap';
import * as MapProviderModule from './components/MapProvider';
import L from 'leaflet';

const mockNavigate = vi.fn();
let mockLocationState = { destination: 'ABlock' };

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: mockLocationState }),
    };
});

// Mock Leaflet
vi.mock('leaflet', () => {
    const mockMarkerInstance = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis(),
        getElement: vi.fn(() => document.createElement('div')),
    };
    const mockPolylineInstance = {
        addTo: vi.fn().mockReturnThis(),
        setLatLngs: vi.fn().mockReturnThis(),
    };
    return {
        default: {
            map: vi.fn(() => ({
                hasLayer: vi.fn().mockReturnValue(false),
                removeLayer: vi.fn(),
            })),
            marker: vi.fn(() => mockMarkerInstance),
            polyline: vi.fn(() => mockPolylineInstance),
            divIcon: vi.fn(() => ({})),
            Icon: {
                Default: {
                    prototype: { _getIconUrl: vi.fn() },
                    mergeOptions: vi.fn(),
                }
            }
        }
    };
});

describe('CampusMap Component', () => {
    let watchSuccessCallback = null;

    beforeEach(() => {
        mockNavigate.mockClear();
        vi.useFakeTimers();

        // Mock Geolocation
        globalThis.navigator = {
            geolocation: {
                watchPosition: vi.fn((success) => {
                    watchSuccessCallback = success;
                    return 123; // watchId
                }),
                clearWatch: vi.fn()
            }
        };

        // Mock Map Provider Context
        vi.spyOn(MapProviderModule, 'useMap').mockReturnValue({
            map: {
                hasLayer: vi.fn().mockReturnValue(false),
                removeLayer: vi.fn(),
            },
            attachMap: vi.fn(),
            detachMap: vi.fn(),
            isInitialized: true,
        });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('renders loader while finding location and calculating route', async () => {
        mockLocationState = { destination: 'ABlock' };
        render(
            <BrowserRouter>
                <CampusMap />
            </BrowserRouter>
        );

        // Fast-forward initial setTimeout(..., 300)
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        expect(screen.getByText('Calculating Route...')).toBeTruthy();
    });

    it('calculates and displays route when geolocation success is triggered', async () => {
        mockLocationState = { destination: 'ABlock' };
        render(
            <BrowserRouter>
                <CampusMap />
            </BrowserRouter>
        );

        // Fast-forward initial delay
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        // Trigger user position callback (near ABlock coordinates)
        await act(async () => {
            watchSuccessCallback({
                coords: {
                    latitude: 10.8772,
                    longitude: 77.0218
                }
            });
        });

        // Loader should be hidden now
        expect(screen.queryByText('Calculating Route...')).toBeNull();

        // Destination marker should be drawn
        expect(L.marker).toHaveBeenCalled();
        // Polyline should be drawn
        expect(L.polyline).toHaveBeenCalled();
    });

    it('displays error message if destination is invalid', async () => {
        mockLocationState = { destination: 'InvalidGoal' };
        render(
            <BrowserRouter>
                <CampusMap />
            </BrowserRouter>
        );

        // Fast-forward
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        expect(screen.getByText('Invalid destination')).toBeTruthy();
    });
});
