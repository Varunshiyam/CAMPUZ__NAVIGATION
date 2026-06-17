// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMapAutoRotate } from './useMapAutoRotate';

describe('useMapAutoRotate Hook', () => {
  let mockMap;
  let mockMapContainer;
  let eventListeners;

  beforeEach(() => {
    eventListeners = {};
    mockMapContainer = {
      style: {
        transform: '',
        setProperty: vi.fn(),
        removeProperty: vi.fn()
      },
      querySelectorAll: vi.fn().mockReturnValue([])
    };

    mockMap = {
      getContainer: vi.fn(() => mockMapContainer),
      on: vi.fn((event, callback) => {
        eventListeners[event] = callback;
      }),
      off: vi.fn((event, callback) => {
        delete eventListeners[event];
      }),
      setView: vi.fn(),
      panTo: vi.fn(),
      getZoom: vi.fn(() => 18)
    };

    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 16));
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('binds interaction event listeners on map mount and cleans them up', () => {
    const { unmount } = renderHook(() => useMapAutoRotate(mockMap, null, null));

    expect(mockMap.on).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('zoomstart', expect.any(Function));

    unmount();
    expect(mockMap.off).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(mockMap.off).toHaveBeenCalledWith('zoomstart', expect.any(Function));
  });

  it('disables autoFollow mode on manual user drag', () => {
    const onManualInteractionMock = vi.fn();
    const { result } = renderHook(() => 
      useMapAutoRotate(mockMap, null, null, { onManualInteraction: onManualInteractionMock })
    );

    expect(result.current.isAutoFollow).toBe(true);

    act(() => {
      eventListeners['dragstart']();
    });

    expect(result.current.isAutoFollow).toBe(false);
    expect(onManualInteractionMock).toHaveBeenCalled();
  });

  it('recenters and re-enables auto-follow mode', () => {
    const userCoords = { lat: 10.87, lon: 77.02 };
    const { result } = renderHook(() => useMapAutoRotate(mockMap, userCoords, null));

    act(() => {
      eventListeners['dragstart']();
    });
    expect(result.current.isAutoFollow).toBe(false);

    act(() => {
      result.current.recenter();
    });

    expect(result.current.isAutoFollow).toBe(true);
    expect(mockMap.setView).toHaveBeenCalledWith([10.87, 77.02], 18, { animate: true, duration: 0.5 });
  });

  it('resets north and disables auto-follow', () => {
    const { result } = renderHook(() => useMapAutoRotate(mockMap, null, null));

    act(() => {
      result.current.resetNorth();
    });

    expect(result.current.isAutoFollow).toBe(false);
  });

  it('interpolates coordinates and updates map and user marker smoothly', async () => {
    vi.useFakeTimers();
    const userCoords = { lat: 10.0, lon: 20.0 };
    const mockMarker = {
      setLatLng: vi.fn(),
      getElement: vi.fn()
    };
    
    const { rerender } = renderHook(
      ({ coords }) => useMapAutoRotate(mockMap, coords, null, { userMarker: mockMarker }),
      { initialProps: { coords: userCoords } }
    );

    // Rerender with new coordinates
    const newCoords = { lat: 11.0, lon: 21.0 };
    rerender({ coords: newCoords });
    
    // Advance timers to trigger requestAnimationFrame ticks
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Verify marker and map setView were called with interpolated coordinates
    expect(mockMarker.setLatLng).toHaveBeenCalled();
    expect(mockMap.setView).toHaveBeenCalled();
    
    // Clean up
    vi.useRealTimers();
  });
});
