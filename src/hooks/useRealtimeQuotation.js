'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
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
        if (!quotationId || !clientDb || !user?.empresaId) return;

        const empresaId = user.empresaId;

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

        // Listen to company profile — document ID equals empresaId
        const companyProfileRef = doc(clientDb, 'company_profiles', empresaId);
        const unsubscribeCompanyProfiles = onSnapshot(
            companyProfileRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setCompanyProfiles([{ id: snapshot.id, ...snapshot.data() }]);
                } else {
                    setCompanyProfiles([]);
                }
            },
            (error) => {
                console.error('Error loading company profiles:', error);
                setCompanyProfiles([]);
            }
        );

        // Listen to client profiles filtered by empresaId
        const clientProfilesQuery = query(
            collection(clientDb, 'client_profiles'),
            where('empresaId', '==', empresaId)
        );
        const unsubscribeClientProfiles = onSnapshot(
            clientProfilesQuery,
            (snapshot) => {
                const profiles = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                profiles.sort((a, b) => {
                    if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1;
                    return (a.name || '').localeCompare(b.name || '');
                });
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
            // Use user.uid as document ID so re-mounting overwrites instead of creating duplicates
            const userDocFixed = doc(activeUsersRef, user.uid);
            userDocRef = userDocFixed;

            setDoc(userDocFixed, {
                uid: user.uid,
                displayName: user.displayName || user.email,
                firstName: user.firstName,
                photoURL: user.photoURL,
                email: user.email,
                joinedAt: serverTimestamp(),
                lastSeen: serverTimestamp()
            }, { merge: true }).then(() => {
                // Heartbeat to update lastSeen
                heartbeatInterval = setInterval(() => {
                    if (userDocRef && !isCleanedUp) {
                        setDoc(userDocFixed, {
                            lastSeen: serverTimestamp()
                        }, { merge: true }).catch(err => {
                            if (err.code !== 'not-found') {
                                console.error('Heartbeat error:', err);
                            }
                        });
                    }
                }, 30000);
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
