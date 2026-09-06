export const SIRE_SECURITY_BASE = 'https://api-seguridad.sunat.gob.pe';
export const SIRE_API_BASE = 'https://api-sire.sunat.gob.pe';

/**
 * Obtener Token OAuth2 de SUNAT
 */
export async function getSireToken({ clientId, clientSecret, ruc, solUser, solPassword }) {
    const tokenUrl = `${SIRE_SECURITY_BASE}/v1/clientessol/${encodeURIComponent(clientId)}/oauth2/token/`;
    const fullUsername = `${ruc.trim()}${solUser.trim()}`.toUpperCase();

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('scope', 'https://api-sire.sunat.gob.pe');
    params.append('client_id', clientId.trim());
    params.append('client_secret', clientSecret.trim());
    params.append('username', fullUsername);
    params.append('password', solPassword.trim());

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: params.toString(),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error obteniendo token SUNAT (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return data.access_token; // Expira en 3600 segundos
}

/**
 * Consultar Propuesta en Línea (RVIE o RCE)
 */
export async function fetchSireProposal({ token, type, period, page = 1, perPage = 100 }) {
    // Normalizar periodo a YYYYMM (por si viene YYYY-MM)
    const perTributario = period.replace('-', '').trim();
    const modulePath = type.toUpperCase() === 'RVIE' ? 'rvie' : 'rce';

    const url = new URL(
        `${SIRE_API_BASE}/v1/contribuyente/migeigv/libros/${modulePath}/propuesta/web/propuesta/${perTributario}/comprobantes`
    );
    url.searchParams.append('page', String(page));
    url.searchParams.append('perPage', String(perPage));

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error consultando propuesta ${type} (${res.status}): ${errText}`);
    }

    return await res.json();
}
