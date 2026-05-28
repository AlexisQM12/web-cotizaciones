import vision from '@google-cloud/vision';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// IMPORTANT: Clear the bad env var that crashes google-auth
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function test() {
    // create a dummy pdf (a simple valid pdf)
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    
    const projectId   = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '');
    const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

    const client = new vision.ImageAnnotatorClient({
        credentials: { client_email: clientEmail, private_key: privateKey },
        projectId,
    });

    try {
        console.log('Sending dummy PDF to batchAnnotateFiles...');
        const [result] = await client.batchAnnotateFiles({
            requests: [
                {
                    inputConfig: {
                        mimeType: 'application/pdf',
                        content: dummyPdf.toString('base64'),
                    },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                    pages: [1]
                }
            ]
        });
        const responses = result.responses?.[0]?.responses || [];
        const text = responses.map(r => r.fullTextAnnotation?.text || '').join('\n');
        console.log('Extracted text length:', text.length);
        console.log('First 100 chars:', text.substring(0, 100));
    } catch(err) {
        console.error('Vision API Error:', err.message);
    }
}
test();
