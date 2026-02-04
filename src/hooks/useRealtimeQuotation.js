'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb } from '@/lib/firestoreClient';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtimeQuotation(quotationId) {
    const [quotation, setQuotation] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!quotationId || !clientDb) return;

        // Listen to quotation changes
        const quotationRef = doc(clientDb, 'quotations', quotationId);
        const unsubscribeQuotation = onSnapshot(
            quotationRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setQuotation({ id: snapshot.id, ...snapshot.data() });
                    setError(null);
                } else {
                    setError('Quotation not found');
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error listening to quotation:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Listen to active users
        const activeUsersRef = collection(clientDb, 'quotations', quotationId, 'activeUsers');
        const unsubscribeUsers = onSnapshot(activeUsersRef, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setActiveUsers(users);
        });

        // Add current user to active users
        let userDocRef;
        if (user) {
            addDoc(activeUsersRef, {
                uid: user.uid,
                displayName: user.displayName || user.email,
                photoURL: user.photoURL,
                joinedAt: serverTimestamp(),
                lastSeen: serverTimestamp()
            }).then(docRef => {
                userDocRef = docRef;

                // Heartbeat to update lastSeen
                const heartbeat = setInterval(() => {
                    if (userDocRef) {
                        updateDoc(userDocRef, {
                            lastSeen: serverTimestamp()
                        }).catch(err => console.error('Heartbeat error:', err));
                    }
                }, 30000); // Every 30 seconds

                // Cleanup on unmount
                return () => {
                    clearInterval(heartbeat);
                    if (userDocRef) {
                        deleteDoc(userDocRef).catch(err => console.error('Error removing user:', err));
                    }
                };
            });
        }

        return () => {
            unsubscribeQuotation();
            unsubscribeUsers();
            if (userDocRef) {
                deleteDoc(userDocRef).catch(err => console.error('Error removing user:', err));
            }
        };
    }, [quotationId, user]);

    const updateQuotation = async (updates) => {
        if (!quotationId || !clientDb) return;

        try {
            const quotationRef = doc(clientDb, 'quotations', quotationId);
            await updateDoc(quotationRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating quotation:', err);
            throw err;
        }
    };

    return {
        quotation,
        activeUsers,
        loading,
        error,
        updateQuotation
    };
}
