import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { isAdmin } from '../utils/adminAuth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAdminUser(currentUser ? isAdmin(currentUser.email) : false);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { user, loading, isAdminUser };
}
