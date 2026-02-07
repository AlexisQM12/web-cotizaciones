'use client';
import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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

        // Add current user to active users with proper cleanup
        let userDocRef;
        let heartbeatInterval;
        let isCleanedUp = false;

        if (user) {
            addDoc(activeUsersRef, {
                uid: user.uid,
                displayName: user.displayName || user.email,
                firstName: user.firstName,
                photoURL: user.photoURL,
                email: user.email,
                joinedAt: serverTimestamp(),
                lastSeen: serverTimestamp()
            }).then(docRef => {
                userDocRef = docRef;

                // Heartbeat to update lastSeen
                heartbeatInterval = setInterval(() => {
                    if (userDocRef && !isCleanedUp) {
                        setDoc(userDocRef, {
                            lastSeen: serverTimestamp()
                        }, { merge: true }).catch(err => {
                            // Silently ignore if document doesn't exist (user left)
                            if (err.code !== 'not-found') {
                                console.error('Heartbeat error:', err);
                            }
                        });
                    }
                }, 30000); // Every 30 seconds
            }).catch(err => {
                console.error('Error adding user to active users:', err);
            });
        }

        return () => {
            isCleanedUp = true;
            unsubscribeQuotation();
            unsubscribeUsers();
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (userDocRef) {
                deleteDoc(userDocRef).catch(err => {
                    // Silently ignore if document doesn't exist
                    if (err.code !== 'not-found') {
                        console.error('Error removing user:', err);
                    }
                });
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
