// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import RoomTypeIcon from './RoomTypeIcon';

describe('RoomTypeIcon Component', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders with correct size class', () => {
        const { container } = render(<RoomTypeIcon roomType="lab" size="small" />);
        const element = container.firstChild;
        expect(element.className).toContain('room-icon-small');
    });

    it('does not render label by default', () => {
        render(<RoomTypeIcon roomType="classroom" />);
        expect(screen.queryByText('📚')).toBeNull();
    });

    it('renders label when showLabel is true', () => {
        render(<RoomTypeIcon roomType="classroom" showLabel={true} />);
        expect(screen.getByText('📚')).toBeTruthy();
    });

    it('renders default icon for unknown roomType', () => {
        render(<RoomTypeIcon roomType="unknown" showLabel={true} />);
        expect(screen.getByText('📍')).toBeTruthy();
    });
});
