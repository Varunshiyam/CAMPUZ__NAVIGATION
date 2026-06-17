// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from './WelcomePage';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick }) => (
            <div className={className} onClick={onClick}>
                {children}
            </div>
        ),
    },
}));

describe('WelcomePage Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders titles and layout elements correctly', () => {
        render(
            <BrowserRouter>
                <WelcomePage />
            </BrowserRouter>
        );

        expect(screen.getByText('KARPAGAM')).toBeTruthy();
        expect(screen.getByText('COLLEGE OF ENGINEERING')).toBeTruthy();
        expect(screen.getByText('Rediscover Campus. Navigate with Precision.')).toBeTruthy();
    });

    it('navigates to /home when clicking the EXPLORE SMART CAMPUS button', () => {
        render(
            <BrowserRouter>
                <WelcomePage />
            </BrowserRouter>
        );

        const enterBtn = screen.getByRole('button', { name: /explore smart campus/i });
        fireEvent.click(enterBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('navigates to appropriate routes when clicking feature cards', () => {
        render(
            <BrowserRouter>
                <WelcomePage />
            </BrowserRouter>
        );

        // Click Compass card
        const compassCard = screen.getByText('Smart Compass').closest('.feature-card');
        fireEvent.click(compassCard);
        expect(mockNavigate).toHaveBeenCalledWith('/home');

        // Click Buildings card
        const buildingsCard = screen.getByText('Blocks & Offices').closest('.feature-card');
        fireEvent.click(buildingsCard);
        expect(mockNavigate).toHaveBeenCalledWith('/buildings');

        // Click Labs card
        const labsCard = screen.getByText('Labs & Amenities').closest('.feature-card');
        fireEvent.click(labsCard);
        expect(mockNavigate).toHaveBeenCalledWith('/categories');
    });
});
