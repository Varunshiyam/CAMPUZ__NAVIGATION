// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import FloorBadge from './FloorBadge';

describe('FloorBadge Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders floor name correctly', () => {
        render(<FloorBadge floor={1} />);
        expect(screen.getByText('First Floor')).toBeTruthy();
    });

    it('applies default size and variant classes', () => {
        const { container } = render(<FloorBadge floor={0} />);
        const element = container.firstChild;
        expect(element.className).toContain('floor-badge-medium');
        expect(element.className).toContain('floor-badge-default');
    });

    it('applies custom size and variant classes', () => {
        const { container } = render(<FloorBadge floor={2} size="small" variant="subtle" />);
        const element = container.firstChild;
        expect(element.className).toContain('floor-badge-small');
        expect(element.className).toContain('floor-badge-subtle');
    });
});
