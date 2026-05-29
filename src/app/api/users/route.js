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
        let assignedRole = dbUser?.role || null;

        console.log('[Auth API] Intento de inicio de sesión:', { email, uid, dbUserExists: !!dbUser, assignedTenantId, assignedRole });

        // Whitelist validation (tenant_users): check if this email has been registered from the Zentria panel
        if (!assignedTenantId && email) {
            const normalizedEmail = email.trim().toLowerCase();
            const tenantUserDoc = await firestore.collection('tenant_users').doc(normalizedEmail).get();
            if (tenantUserDoc.exists) {
                const tenantUserData = tenantUserDoc.data();
                assignedTenantId = tenantUserData.tenantId;
                assignedRole = tenantUserData.role || 'admin';
                console.log('[Auth API] Encontrado en tenant_users (whitelist):', { assignedTenantId, assignedRole });
            }
        }

        // Auto-Join by Domain: if user has no tenant, check if their email domain matches any registered tenant
        if (!assignedTenantId && email.includes('@')) {
            const domain = email.split('@')[1].toLowerCase();
            // Don't auto-join public email providers
            const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
            
            if (!publicDomains.includes(domain)) {
                const tenantsSnap = await firestore.collection('tenants').where('customDomain', '==', domain).limit(1).get();
                if (!tenantsSnap.empty) {
                    assignedTenantId = tenantsSnap.docs[0].id;
                    console.log('[Auth API] Encontrado por dominio:', assignedTenantId);
                }
            }
        }

        console.log('[Auth API] Resultado de asignación:', { assignedTenantId, assignedRole });

        if (userDoc.exists) {
            // Update existing user
            await userRef.update({
                lastActive: userData.lastActive,
                updatedAt: userData.updatedAt,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                firstName: userData.firstName,
                ...(assignedTenantId && !dbUser.empresaId ? { empresaId: assignedTenantId, tenantId: assignedTenantId } : {}),
                ...(assignedRole && !dbUser.role ? { role: assignedRole } : {})
            });
            const updatedUser = (await userRef.get()).data();
            
            // If they still don't have a tenant after all attempts, reject them
            if (!updatedUser.empresaId && !updatedUser.tenantId) {
                return Response.json({ error: 'Acceso Denegado. Tu cuenta no está registrada en Zentria ni asociada a un dominio empresarial.' }, { status: 403 });
            }
            
            return Response.json({ success: true, user: updatedUser });
        } else {
            // User doesn't exist. If we found a tenant via whitelist or domain, let them in!
            if (assignedTenantId) {
                const newUser = {
                    ...userData,
                    empresaId: assignedTenantId,
                    tenantId: assignedTenantId,
                    role: assignedRole || 'employee',
                    createdAt: new Date().toISOString()
                };
                await userRef.set(newUser);
                return Response.json({ success: true, user: newUser });
            } else {
                // Reject new user registration from CGO
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
