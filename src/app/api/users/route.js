import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';

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

        let dbUser = userDoc.exists ? userDoc.data() : null;
        let assignedTenantId = dbUser?.empresaId || dbUser?.tenantId || null;

        // Auto-Join by Domain: if user has no tenant, check if their email domain matches any registered tenant
        if (!assignedTenantId && email.includes('@')) {
            const domain = email.split('@')[1].toLowerCase();
            // Don't auto-join public email providers
            const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
            
            if (!publicDomains.includes(domain)) {
                const tenantsSnap = await firestore.collection('tenants').where('customDomain', '==', domain).limit(1).get();
                if (!tenantsSnap.empty) {
                    assignedTenantId = tenantsSnap.docs[0].id;
                }
            }
        }

        if (userDoc.exists) {
            // Update existing user
            await userRef.update({
                lastActive: userData.lastActive,
                updatedAt: userData.updatedAt,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                firstName: userData.firstName,
                ...(assignedTenantId && !dbUser.empresaId ? { empresaId: assignedTenantId, tenantId: assignedTenantId } : {})
            });
            const updatedUser = (await userRef.get()).data();
            
            // If they still don't have a tenant after auto-join attempt, reject them
            if (!updatedUser.empresaId && !updatedUser.tenantId) {
                return Response.json({ error: 'Acceso Denegado. Tu dominio no está registrado en Zentria.' }, { status: 403 });
            }
            
            return Response.json({ success: true, user: updatedUser });
        } else {
            // User doesn't exist. If we found a tenant via domain, let them in!
            if (assignedTenantId) {
                const newUser = {
                    ...userData,
                    empresaId: assignedTenantId,
                    tenantId: assignedTenantId,
                    role: 'employee',
                    createdAt: new Date().toISOString()
                };
                await userRef.set(newUser);
                return Response.json({ success: true, user: newUser });
            } else {
                // Reject new user registration from CGO, users must be pre-registered or match a domain
                return Response.json({ error: 'Acceso Denegado. No estás registrado en Zentria y tu dominio no está asociado a ninguna empresa.' }, { status: 403 });
            }
        }
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
