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

            // For POST/PUT/PATCH:
            const writeMethods = ['POST', 'PUT', 'PATCH'];
            for (const method of writeMethods) {
                if (content.includes(`export async function ${method}(req)`) || content.includes(`export async function ${method}(request)`)) {
                    // Check if it calls getTenantCollection(empresaId
                    // If it does, we must define const empresaId = body.empresaId; or const { searchParams }...
                    if (content.includes('getTenantCollection(empresaId')) {
                        // check if empresaId is already defined in the block
                        // A cheap way is just to replace `const body = await req.json();`
                        // with `const body = await req.json(); const empresaId = body.empresaId || new URL(req.url).searchParams.get('empresaId');`
                        if (content.includes('const body = await req.json();') && !content.includes('body.empresaId || new URL(')) {
                            content = content.replace(/(const body = await req\.json\(\);\n?)/g, "$1        const empresaId = body.empresaId || new URL(req.url).searchParams.get('empresaId');\n");
                        }
                    }
                }
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed body in:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src/app/api'));
