'use client';
// fetch que adjunta el ID token de Firebase del usuario actual.
//
// Las rutas protegidas (ver src/lib/apiAuth.js) lo exigen en la cabecera
// Authorization. Sin esto, el backend no tiene forma de saber quién llama, y
// firebase-admin se salta las reglas de Firestore.

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

// Al recargar la página, Firebase tarda un instante en rehidratar la sesión desde
// IndexedDB. Si un componente pide datos en ese hueco, currentUser todavía es
// null aunque el usuario sí esté logueado: esperamos a que se resuelva en vez de
// fallar de inmediato.
function esperarUsuario(timeoutMs = 8000) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
        const temporizador = setTimeout(() => { cancelar(); resolve(null); }, timeoutMs);
        const cancelar = onAuthStateChanged(auth, (user) => {
            if (user) {
                clearTimeout(temporizador);
                cancelar();
                resolve(user);
            }
        });
    });
}

export async function authFetch(url, opciones = {}) {
    const user = await esperarUsuario();
    if (!user) throw new Error('No hay sesión activa. Vuelve a iniciar sesión.');

    // getIdToken refresca solo si está por vencer, así que es barato llamarlo.
    const token = await user.getIdToken();

    return fetch(url, {
        ...opciones,
        headers: {
            ...(opciones.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });
}
