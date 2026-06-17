// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MapPage from './MapPage';
import { describe, it, vi } from 'vitest';
import * as MapProviderModule from './components/MapProvider';

vi.mock('leaflet', () => {
    class MockMarkerClass {
        addTo() { return this; }
        bindPopup() { return this; }
        on() { return this; }
    }
    return {
        default: {
            divIcon: vi.fn(),
            Marker: MockMarkerClass,
            marker: vi.fn(() => new MockMarkerClass()),
            icon: vi.fn(),
            Icon: {
                Default: {
                    prototype: {
                        _getIconUrl: vi.fn()
                    },
                    mergeOptions: vi.fn()
                }
            }
        }
    };
});

globalThis.navigator = {
    geolocation: {
        watchPosition: vi.fn(),
        clearWatch: vi.fn()
    }
};

describe('MapPage Image Overflow Issue', () => {
    it('checks if building card images are overflowing', () => {
        vi.useFakeTimers();
        vi.spyOn(MapProviderModule, 'useMap').mockReturnValue({
            map: {
                eachLayer: vi.fn(),
                hasLayer: vi.fn(),
                removeLayer: vi.fn(),
            },
            attachMap: vi.fn(),
            detachMap: vi.fn(),
            isInitialized: true,
        });

        render(
            <BrowserRouter>
                <MapPage />
            </BrowserRouter>
        );

        vi.advanceTimersByTime(2000);

        const images = document.querySelectorAll('img');
        console.log('Total images found after advancing timers:', images.length);
        
        images.forEach(img => {
            console.log('Image src:', img.src, 'class:', img.className);
        });
    });
});
