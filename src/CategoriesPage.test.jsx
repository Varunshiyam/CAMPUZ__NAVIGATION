// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CategoriesPage from './CategoriesPage';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/categories' }),
    };
});

// Mock useSearchPlaceholder hook
vi.mock('./hooks/useSearchPlaceholder', () => ({
    useSearchPlaceholder: () => 'Search category...'
}));

// Mock framer-motion AnimatePresence and motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, className, style }) => (
            <div className={className} style={style}>
                {children}
            </div>
        )
    }
}));

describe('CategoriesPage Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders filters, search bar, and groups categories correctly', () => {
        render(
            <BrowserRouter>
                <CategoriesPage />
            </BrowserRouter>
        );

        expect(screen.getByPlaceholderText('Search category...')).toBeTruthy();
        
        // Should show category headers for All items
        expect(screen.getByText('Academic Blocks')).toBeTruthy();
        expect(screen.getByText('Halls & Auditoriums')).toBeTruthy();
    });

    it('expands category item to show nested rooms/buildings', async () => {
        render(
            <BrowserRouter>
                <CategoriesPage />
            </BrowserRouter>
        );

        // Click on Academic Blocks category to expand
        const blocksHeader = screen.getByText('Academic Blocks');
        fireEvent.click(blocksHeader);

        // Should see 'Block A' (destinations under 'block' category)
        expect(screen.getByText('Block A')).toBeTruthy();

        // Clicking Start button navigates to map
        const startBtn = screen.getAllByRole('button', { name: 'Start' })[0];
        fireEvent.click(startBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/map', {
            state: { destination: 'ABlock' }
        });
    });

    it('filters items by searching', () => {
        render(
            <BrowserRouter>
                <CategoriesPage />
            </BrowserRouter>
        );

        const searchInput = screen.getByPlaceholderText('Search category...');

        // Search for 'Block A'
        fireEvent.change(searchInput, { target: { value: 'Block A' } });
        
        // Expand the category
        const blocksHeader = screen.getByText('Academic Blocks');
        fireEvent.click(blocksHeader);

        expect(screen.getByText('Block A')).toBeTruthy();
        expect(screen.queryByText('Block B')).toBeNull();
    });

    it('filters items flatly when selecting a specific filter chip', () => {
        render(
            <BrowserRouter>
                <CategoriesPage />
            </BrowserRouter>
        );

        // Click the Sports filter chip. FILTERS list has Sports with value 'sports'.
        // In the filter chips row, it is rendered as div with title "Sports".
        const sportsChip = screen.getByTitle('Sports');
        fireEvent.click(sportsChip);

        // Flat view should show sports elements directly
        expect(screen.getByText('Turf Ground')).toBeTruthy();
        expect(screen.queryByText('Academic Blocks')).toBeNull(); // No headers in flat view
    });
});
