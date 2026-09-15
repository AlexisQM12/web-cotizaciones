import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const targetCollections = [
    'quotations', 'client_profiles', 'suppliers', 
    'accounting_config', 'purchases_ledger', 'sales_ledger'
];

walkDir('./src/app/api', (filePath) => {
    if (!filePath.endsWith('.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Add import if needed
    if (content.includes('firestore.collection(') || content.includes('firestore.batch(')) {
        if (!content.includes('getTenantCollection')) {
            content = content.replace(
                "import { firestore } from '@/lib/firebase-admin';",
                "import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';"
            );
            // Some files might use a different import style
            content = content.replace(
                "import { firestore, admin } from '@/lib/firebase-admin';",
                "import { firestore, admin, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';"
            );
            changed = true;
        }
    }

    // 2. Replace company_profiles
    if (content.includes("firestore.collection('company_profiles').doc(")) {
        content = content.replace(
            /firestore\.collection\(['"`]company_profiles['"`]\)\.doc\((.*?)\)/g,
            "getTenantDoc($1)"
        );
        changed = true;
    }

    // 3. Replace collections
    for (const coll of targetCollections) {
        const regex = new RegExp(`firestore\\.collection\\(['"\`]${coll}['"\`]\\)`, 'g');
        if (regex.test(content)) {
            // We assume empresaId is available in scope. 
            // Most endpoints read `const empresaId = searchParams.get('empresaId')` or from `await req.json()`
            content = content.replace(regex, `getTenantCollection(typeof empresaId !== 'undefined' ? empresaId : '6', '${coll}')`);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Refactored:', filePath);
    }
});
