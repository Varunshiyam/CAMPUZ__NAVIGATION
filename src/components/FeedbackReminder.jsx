import { useState, useEffect } from 'react';
import './FeedbackReminder.css';

export default function FeedbackReminder() {
    const [showReminder, setShowReminder] = useState(false);
    const [showExitReminder, setShowExitReminder] = useState(false);

    useEffect(() => {
        // Check if user has already seen the feedback reminder
        const hasSeenFeedback = localStorage.getItem('campuz_feedback_shown');


        if (hasSeenFeedback) {
            return; // Don't show again if already shown
        }

        // Timer for 60 seconds
        const timer = setTimeout(() => {
            if (!hasSeenFeedback) {
                setShowReminder(true);
                localStorage.setItem('campuz_feedback_shown', 'true');
            }
        }, 60000); // 60 seconds

        // Listen for navigation completion event
        const handleNavigationComplete = () => {
            if (!hasSeenFeedback) {
                setShowReminder(true);
                localStorage.setItem('campuz_feedback_shown', 'true');
            }
        };

        window.addEventListener('navigationCompleted', handleNavigationComplete);

        // Cleanup
        return () => {
            clearTimeout(timer);
            window.removeEventListener('navigationCompleted', handleNavigationComplete);
        };
    }, []);

    // Show reminder when user is about to leave
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const hasSeenFeedback = localStorage.getItem('campuz_feedback_shown');
            const hasDismissedExit = sessionStorage.getItem('campuz_exit_reminder_dismissed');

            if (hasSeenFeedback && !hasDismissedExit) {
                // Show exit reminder
                setShowExitReminder(true);

                // Optional: Show browser's default confirmation dialog
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleFeedbackClick = () => {
        // Open Google Form in new tab
        window.open('https://forms.gle/qDSTXFeY1eAisaedA', '_blank');
        setShowReminder(false);
    };

    const handleDismiss = () => {
        setShowReminder(false);
    };

    const handleExitDismiss = () => {
        setShowExitReminder(false);
        sessionStorage.setItem('campuz_exit_reminder_dismissed', 'true');
    };

    const handleExitFeedback = () => {
        window.open('YOUR_GOOGLE_FORM_URL_HERE', '_blank');
        setShowExitReminder(false);
        sessionStorage.setItem('campuz_exit_reminder_dismissed', 'true');
    };

    if (showExitReminder) {
        return (
            <div className="feedback-reminder-overlay">
                <div className="feedback-reminder-modal exit-reminder">
                    <div className="reminder-icon">👋</div>
                    <h3>Before You Go...</h3>
                    <p>We'd love to hear your feedback about Campuz Navigation!</p>
                    <p className="reminder-subtitle">Help us improve your campus experience</p>

                    <div className="reminder-actions">
                        <button className="feedback-btn primary" onClick={handleExitFeedback}>
                            📝 Share Feedback
                        </button>
                        <button className="dismiss-btn" onClick={handleExitDismiss}>
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!showReminder) return null;

    return (
        <div className="feedback-reminder-notification">
            <div className="reminder-content">
                <div className="reminder-icon-small">💡</div>
                <div className="reminder-text">
                    <h4>Enjoying Campuz Navigation?</h4>
                    <p>Share your feedback to help us improve!</p>
                </div>
                <div className="reminder-actions-inline">
                    <button className="feedback-btn-small" onClick={handleFeedbackClick}>
                        Give Feedback
                    </button>
                    <button className="close-btn-small" onClick={handleDismiss}>
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
