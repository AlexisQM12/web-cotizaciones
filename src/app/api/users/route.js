import { firestore } from '@/lib/firebase-admin';

export async function POST(req) {
    try {
        const { uid, email, displayName, photoURL, firstName } = await req.json();

        if (!uid || !email) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userRef = firestore.collection('users').doc(uid);

        const userData = {
            uid,
            email,
            displayName: displayName || '',
            photoURL: photoURL || '',
            firstName: firstName || displayName?.split(' ')[0] || 'Usuario',
            lastActive: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Check if user exists
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // Update existing user
            await userRef.update({
                lastActive: userData.lastActive,
                updatedAt: userData.updatedAt,
                // Update profile info in case it changed
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                firstName: userData.firstName
            });
        } else {
            // Create new user
            await userRef.set({
                ...userData,
                createdAt: new Date().toISOString()
            });
        }

        return Response.json({ success: true, user: userData });
    } catch (error) {
        console.error('User API Error:', error);
        return Response.json({ error: 'Failed to save user data' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const snapshot = await firestore.collection('users').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return Response.json(users);
    } catch (error) {
        console.error('Users GET Error:', error);
        return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
