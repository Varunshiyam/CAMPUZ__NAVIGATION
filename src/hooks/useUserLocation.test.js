// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserLocation } from './useUserLocation';

describe('useUserLocation Hook', () => {
  let watchPositionMock;
  let clearWatchMock;
  let successCallback;
  let errorCallback;

  beforeEach(() => {
    watchPositionMock = vi.fn((success, error) => {
      successCallback = success;
      errorCallback = error;
      return 999;
    });
    clearWatchMock = vi.fn();

    vi.stubGlobal('navigator', {
      geolocation: {
        watchPosition: watchPositionMock,
        clearWatch: clearWatchMock
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts watching location and cleans up on unmount', () => {
    const { unmount } = renderHook(() => useUserLocation());
    expect(watchPositionMock).toHaveBeenCalled();
    
    unmount();
    expect(clearWatchMock).toHaveBeenCalledWith(999);
  });

  it('updates state on successful location watch', () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.loading).toBe(true);

    act(() => {
      successCallback({
        coords: {
          latitude: 12.34,
          longitude: 56.78,
          accuracy: 10,
          speed: 1.5,
          heading: 90
        }
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.location).toEqual({
      lat: 12.34,
      lon: 56.78,
      accuracy: 10,
      speed: 1.5,
      heading: 90
    });
  });

  it('throttles updates based on throttleMs option', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUserLocation({ throttleMs: 1000 }));

    act(() => {
      successCallback({ coords: { latitude: 10, longitude: 20, accuracy: 5 } });
    });
    expect(result.current.location.lat).toBe(10);

    act(() => {
      successCallback({ coords: { latitude: 11, longitude: 21, accuracy: 5 } });
    });
    expect(result.current.location.lat).toBe(10);

    vi.advanceTimersByTime(1001);

    act(() => {
      successCallback({ coords: { latitude: 12, longitude: 22, accuracy: 5 } });
    });
    expect(result.current.location.lat).toBe(12);

    vi.useRealTimers();
  });
});
