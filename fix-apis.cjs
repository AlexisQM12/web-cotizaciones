const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace various fallback patterns
            const patterns = [
                /typeof\s+empresaId\s*!==\s*['"]undefined['"]\s*\?\s*empresaId\s*:\s*['"]ayatech['"]/g,
                /typeof\s+empresaId\s*!==\s*['"]undefined['"]\s*&&\s*empresaId\s*\?\s*empresaId\s*:\s*['"]ayatech['"]/g,
                /typeof\s+empresaId\s*!==\s*['"]undefined['"]\s*\?\s*empresaId\s*:\s*\(typeof\s+companyProfileId\s*!==\s*['"]undefined['"]\s*&&\s*companyProfileId\s*\?\s*companyProfileId\s*:\s*['"]ayatech['"]\)/g,
                /empresaId\s*\|\|\s*['"]ayatech['"]/g
            ];

            let changed = false;
            for (const p of patterns) {
                if (p.test(content)) {
                    content = content.replace(p, 'empresaId');
                    changed = true;
                }
            }
            
            // Also enforce empresaId check
            // Most APIs do `const empresaId = ...;` or `let empresaId = ...;`
            // If they don't have `if (!empresaId) return Response.json(...)`, we should add it.
            // That might be too complex for a regex, but removing the ayatech fallback will at least
            // pass undefined/null to getTenantCollection, which should fail if we also remove the fallback there.

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src/app/api'));
