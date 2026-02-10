'use client';
import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb } from '@/lib/firestoreClient';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtimeQuotation(quotationId) {
    const [quotation, setQuotation] = useState(null);
    const [companyProfiles, setCompanyProfiles] = useState([]);
    const [clientProfiles, setClientProfiles] = useState([]);
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

        // Listen to company profiles
        const companyProfilesRef = collection(clientDb, 'company_profiles');
        const unsubscribeCompanyProfiles = onSnapshot(
            companyProfilesRef,
            (snapshot) => {
                const profiles = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort: defaults first, then alphabetically by name
                profiles.sort((a, b) => {
                    if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
                    return (a.name || '').localeCompare(b.name || '');
                });
                console.log('🏢 Company Profiles Loaded:', profiles.length);
                setCompanyProfiles(profiles);
            },
            (error) => {
                console.error('Error loading company profiles:', error);
                setCompanyProfiles([]);
            }
        );

        // Listen to client profiles
        const clientProfilesRef = collection(clientDb, 'client_profiles');
        const unsubscribeClientProfiles = onSnapshot(
            clientProfilesRef,
            (snapshot) => {
                const profiles = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort: defaults first, then alphabetically by name
                profiles.sort((a, b) => {
                    if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
                    return (a.name || '').localeCompare(b.name || '');
                });
                console.log('👤 Client Profiles Loaded:', profiles.length);
                setClientProfiles(profiles);
            },
            (error) => {
                console.error('Error loading client profiles:', error);
                setClientProfiles([]);
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
            unsubscribeCompanyProfiles();
            unsubscribeClientProfiles();
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
        companyProfiles,
        clientProfiles,
        activeUsers,
        loading,
        error,
        updateQuotation
    };
}
