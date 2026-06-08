// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSearchPlaceholder } from './useSearchPlaceholder';

describe('useSearchPlaceholder hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('types out the placeholder character by character', () => {
        const placeholders = ['Test'];
        const { result } = renderHook(() => useSearchPlaceholder(placeholders, 100, 50, 1000));

        // Initially empty
        expect(result.current).toBe('');

        // Advance by 1 step (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe('T');

        // Type 'e' (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe('Te');

        // Type 's' (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe('Tes');

        // Type 't' (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe('Test');
    });

    it('deletes the placeholder character by character after delay', () => {
        const placeholders = ['Ok'];
        const { result } = renderHook(() => useSearchPlaceholder(placeholders, 100, 50, 1000));

        // Type 'O' (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        // Type 'Ok' (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toBe('Ok');

        // Wait for delayBetween (1000ms)
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Delete 'k' (50ms)
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(result.current).toBe('O');

        // Delete 'O' (50ms)
        act(() => {
            vi.advanceTimersByTime(50);
        });
        expect(result.current).toBe('');
    });
});
