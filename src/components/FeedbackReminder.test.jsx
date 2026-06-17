// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FeedbackReminder from './FeedbackReminder';

describe('FeedbackReminder Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        sessionStorage.clear();
        vi.spyOn(window, 'open').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('does not display reminder initially', () => {
        render(<FeedbackReminder />);
        expect(screen.queryByText('Enjoying Campuz Navigation?')).toBeNull();
    });

    it('displays reminder after 60 seconds if not already shown', async () => {
        render(<FeedbackReminder />);
        
        await act(async () => {
            vi.advanceTimersByTime(60000);
        });

        expect(screen.getByText('Enjoying Campuz Navigation?')).toBeTruthy();
        expect(localStorage.getItem('campuz_feedback_shown')).toBe('true');
    });

    it('displays reminder immediately when navigationCompleted event is dispatched', async () => {
        render(<FeedbackReminder />);

        await act(async () => {
            window.dispatchEvent(new Event('navigationCompleted'));
        });

        expect(screen.getByText('Enjoying Campuz Navigation?')).toBeTruthy();
    });

    it('dismisses the notification when close button is clicked', async () => {
        render(<FeedbackReminder />);

        await act(async () => {
            window.dispatchEvent(new Event('navigationCompleted'));
        });

        const dismissBtn = screen.getByText('✕');
        fireEvent.click(dismissBtn);

        expect(screen.queryByText('Enjoying Campuz Navigation?')).toBeNull();
    });

    it('opens feedback form and closes notification when Give Feedback is clicked', async () => {
        render(<FeedbackReminder />);

        await act(async () => {
            window.dispatchEvent(new Event('navigationCompleted'));
        });

        const feedbackBtn = screen.getByText('Give Feedback');
        fireEvent.click(feedbackBtn);

        expect(window.open).toHaveBeenCalledWith('https://forms.gle/qDSTXFeY1eAisaedA', '_blank');
        expect(screen.queryByText('Enjoying Campuz Navigation?')).toBeNull();
    });

    it('shows exit feedback modal on beforeunload if feedback has been shown before', async () => {
        // Mock that feedback has been shown
        localStorage.setItem('campuz_feedback_shown', 'true');
        
        render(<FeedbackReminder />);

        // Dispatch beforeunload
        const event = new Event('beforeunload', { cancelable: true });
        await act(async () => {
            window.dispatchEvent(event);
        });

        // Exit reminder sheet should render
        expect(screen.getByText('Before You Go...')).toBeTruthy();
        expect(screen.getByText("We'd love to hear your feedback about Campuz Navigation!")).toBeTruthy();

        // Dismiss exit reminder
        const dismissBtn = screen.getByText('Maybe Later');
        fireEvent.click(dismissBtn);
        expect(screen.queryByText('Before You Go...')).toBeNull();
        expect(sessionStorage.getItem('campuz_exit_reminder_dismissed')).toBe('true');
    });
});
