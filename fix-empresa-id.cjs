const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // If it uses getTenantCollection(empresaId, ...) but doesn't define empresaId,
            // we should define it.
            // Check if getTenantCollection(empresaId, ...) or getTenantCollection((empresaId), ...) is used.
            if (content.includes('getTenantCollection(empresaId') || content.includes('getTenantCollection((empresaId)')) {
                // Check if const empresaId = is defined somewhere.
                // We'll replace it. Let's just define it if it's missing.
                
                // For GET:
                if (content.includes('export async function GET(req)') || content.includes('export async function GET(request)')) {
                    if (!content.includes("empresaId = searchParams.get('empresaId')") && !content.includes("empresaId = req.nextUrl.searchParams.get('empresaId')")) {
                        content = content.replace(/(const { searchParams } = new URL\(req\.url\);\n?)/g, "$1        const empresaId = searchParams.get('empresaId');\n");
                        content = content.replace(/(const { searchParams } = new URL\(request\.url\);\n?)/g, "$1        const empresaId = searchParams.get('empresaId');\n");
                    }
                }
                
                // For POST/PUT/PATCH:
                const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
                for (const method of writeMethods) {
                    if (content.includes(`export async function ${method}(req)`) || content.includes(`export async function ${method}(request)`)) {
                        if (!content.includes("const {") || !content.includes("empresaId") || (!content.includes("const empresaId = searchParams.get('empresaId')") && !content.includes("const empresaId = body.empresaId"))) {
                            // Too complex for simple regex without knowing body parsing. Let's try to extract from body or searchParams.
                            // If they parse body as json, we should get empresaId from it.
                        }
                    }
                }
            }
            
            // Clean up the `(empresaId)` if present
            content = content.replace(/getTenantCollection\(\(empresaId\)/g, 'getTenantCollection(empresaId');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src/app/api'));
