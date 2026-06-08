// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import PageTransition from './PageTransition';

// Mock framer-motion to simplify rendering and avoid React 19 compatibility warnings in test environments
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, style }) => <div data-testid="motion-div" style={style}>{children}</div>
    }
}));

describe('PageTransition Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders child content correctly', () => {
        render(
            <PageTransition>
                <div data-testid="child">Transition Child</div>
            </PageTransition>
        );
        expect(screen.getByTestId('child')).toBeTruthy();
        expect(screen.getByText('Transition Child')).toBeTruthy();
    });
});
