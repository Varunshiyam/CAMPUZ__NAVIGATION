// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BuildingsPage from './BuildingsPage';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/buildings' }),
    };
});

// Mock useSearchPlaceholder hook
vi.mock('./hooks/useSearchPlaceholder', () => ({
    useSearchPlaceholder: () => 'Search building...'
}));

describe('BuildingsPage Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders search bar and category filter chips', () => {
        render(
            <BrowserRouter>
                <BuildingsPage />
            </BrowserRouter>
        );

        expect(screen.getByPlaceholderText('Search building...')).toBeTruthy();
        expect(screen.getByText('All')).toBeTruthy();
        expect(screen.getByText('Open Now')).toBeTruthy();
        expect(screen.getByText('Blocks')).toBeTruthy();
    });

    it('displays list of buildings', () => {
        render(
            <BrowserRouter>
                <BuildingsPage />
            </BrowserRouter>
        );

        // ABlock should render (its name is 'Block A' in locationData)
        expect(screen.getByText('Block A')).toBeTruthy();
    });

    it('filters building list on searching', () => {
        render(
            <BrowserRouter>
                <BuildingsPage />
            </BrowserRouter>
        );

        const searchInput = screen.getByPlaceholderText('Search building...');
        
        // Search for 'Block A'
        fireEvent.change(searchInput, { target: { value: 'Block A' } });
        expect(screen.getByText('Block A')).toBeTruthy();
        expect(screen.queryByText('Block B')).toBeNull();
    });

    it('navigates to /map when clicking a building with no rooms', () => {
        render(
            <BrowserRouter>
                <BuildingsPage />
            </BrowserRouter>
        );

        // SnacksBox has no indoor locations. It is in food category.
        const snackboxRow = screen.getByText('Snacks Box');
        fireEvent.click(snackboxRow);

        expect(mockNavigate).toHaveBeenCalledWith('/map', {
            state: { destination: 'SnacksBox' }
        });
    });

    it('expands building to show rooms when clicking a building with rooms', () => {
        render(
            <BrowserRouter>
                <BuildingsPage />
            </BrowserRouter>
        );

        // Block A (ABlock) has nested rooms (like A101, A201 etc. on various floors)
        const blockARow = screen.getByText('Block A');
        fireEvent.click(blockARow);

        // Clicking expanding should show floor badges
        expect(screen.getByText('Ground Floor')).toBeTruthy();

        // Click on Ground Floor header to expand rooms
        const groundFloorHeader = screen.getByText('Ground Floor');
        fireEvent.click(groundFloorHeader);

        // A102 is on ground floor (floor 0) of Block A
        expect(screen.getByText('Classroom A102')).toBeTruthy();

        // Click on Classroom A102 to navigate
        const roomItem = screen.getByText('Classroom A102');
        fireEvent.click(roomItem);

        // For indoor locations, it navigates to the parentBuilding
        expect(mockNavigate).toHaveBeenCalledWith('/map', {
            state: { destination: 'ABlock' }
        });
    });
});
