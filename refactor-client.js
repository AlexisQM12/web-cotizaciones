import fs from 'fs';

const filePath = './src/hooks/useRealtimeQuotation.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('getTenantCollectionClient')) {
    content = content.replace(
        "import { clientDb } from '@/lib/firestoreClient';",
        "import { clientDb, getTenantCollectionClient, getTenantDocClient } from '@/lib/firestoreClient';"
    );
}

// Replace doc(clientDb, 'quotations', quotationId)
content = content.replace(
    /doc\(clientDb,\s*'quotations',\s*quotationId\)/g,
    "doc(getTenantCollectionClient(user?.empresaId || '6', 'quotations'), quotationId)"
);

// Replace doc(clientDb, 'company_profiles', empresaId)
content = content.replace(
    /doc\(clientDb,\s*'company_profiles',\s*empresaId\)/g,
    "getTenantDocClient(empresaId)"
);

// Replace collection(clientDb, 'client_profiles')
content = content.replace(
    /collection\(clientDb,\s*'client_profiles'\)/g,
    "getTenantCollectionClient(empresaId, 'client_profiles')"
);

// Replace active users subcollection
// collection(clientDb, 'quotations', quotationId, 'activeUsers')
// => collection(getTenantCollectionClient(empresaId, 'quotations'), quotationId, 'activeUsers')
content = content.replace(
    /collection\(clientDb,\s*'quotations',\s*quotationId,\s*'activeUsers'\)/g,
    "collection(getTenantCollectionClient(user?.empresaId || '6', 'quotations'), quotationId, 'activeUsers')"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored useRealtimeQuotation.js');
