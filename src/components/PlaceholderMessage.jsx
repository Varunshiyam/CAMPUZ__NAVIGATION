
import './PlaceholderMessage.css';

export function PlaceholderMessage({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="placeholder-overlay" onClick={onClose}>
            <div className="placeholder-card" onClick={(e) => e.stopPropagation()}>
                <div className="placeholder-icon">🚀</div>
                <h2>Future Extensions</h2>
                <p>This feature is coming soon!</p>
                <p className="follow-text">Follow us 💕</p>
                <button onClick={onClose} className="placeholder-button">
                    Got it!
                </button>
            </div>
        </div>
    );
}
