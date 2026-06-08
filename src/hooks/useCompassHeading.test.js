// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCompassHeading } from './useCompassHeading';

describe('useCompassHeading Hook', () => {
  beforeEach(() => {
    vi.stubGlobal('DeviceOrientationEvent', undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects unsupported device orientation status', () => {
    const { result } = renderHook(() => useCompassHeading());
    expect(result.current.permissionStatus).toBe('unsupported');
  });

  it('requests permission and updates permissionStatus on iOS devices', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('DeviceOrientationEvent', {
      requestPermission: requestPermissionMock
    });

    const { result } = renderHook(() => useCompassHeading());
    expect(result.current.permissionStatus).toBe('prompt');

    let success;
    await act(async () => {
      success = await result.current.requestPermission();
    });

    expect(requestPermissionMock).toHaveBeenCalled();
    expect(result.current.permissionStatus).toBe('granted');
    expect(success).toBe(true);
  });

  it('updates heading and applies smoothing', async () => {
    vi.stubGlobal('ondeviceorientation', {});
    
    let eventCallback;
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'deviceorientation' || event === 'deviceorientationabsolute') {
        eventCallback = callback;
      }
    });

    const { result } = renderHook(() => useCompassHeading());
    expect(result.current.permissionStatus).toBe('granted');

    await act(async () => {
      eventCallback({ webkitCompassHeading: 100 });
    });
    expect(result.current.heading).toBe(100);

    await act(async () => {
      eventCallback({ webkitCompassHeading: 200 });
    });
    // smoothed value = 100 + (200 - 100) * 0.15 = 115
    expect(result.current.heading).toBe(115);
  });

  it('correctly handles heading wrap-around smoothing', async () => {
    vi.stubGlobal('ondeviceorientation', {});
    let eventCallback;
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'deviceorientation' || event === 'deviceorientationabsolute') {
        eventCallback = callback;
      }
    });

    const { result } = renderHook(() => useCompassHeading());

    await act(async () => {
      eventCallback({ webkitCompassHeading: 359 });
    });
    expect(result.current.heading).toBe(359);

    await act(async () => {
      eventCallback({ webkitCompassHeading: 2 });
    });
    // diff = 2 - 359 = -357. wrapped diff = 3.
    // smoothed value = 359 + 3 * 0.15 = 359.45
    expect(result.current.heading).toBeCloseTo(359.45, 2);
  });
});
