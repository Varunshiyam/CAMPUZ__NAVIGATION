import { useState, useEffect } from 'react';

const defaultPlaceholders = [
  "Searching building...",
  "Looking for a building..."
];

export function useSearchPlaceholder(placeholders = defaultPlaceholders, typingSpeed = 70, deletingSpeed = 40, delayBetween = 2000) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    let timer;
    const currentPlaceholder = placeholders[loopNum % placeholders.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText(currentPlaceholder.substring(0, text.length - 1));
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setText(currentPlaceholder.substring(0, text.length + 1));
      }, typingSpeed);
    }

    if (!isDeleting && text === currentPlaceholder) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetween);
    } else if (isDeleting && text === '') {
      clearTimeout(timer);
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, placeholders, typingSpeed, deletingSpeed, delayBetween]);

  return text;
}
