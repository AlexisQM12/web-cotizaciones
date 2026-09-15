import { GET } from '../src/app/api/proxy-image/route.js';

async function run() {
    const imageUrl = "https://firebasestorage.googleapis.com/v0/b/web-cot-aya.firebasestorage.app/o/quotation-images%2F68sxThBGxGhWyZdSn6wK%2Fitem-1-1778767908400.jpg?alt=media&token=cefcdc45-5427-4302-b534-49416626f43d";
    
    // Create a mock Request object
    const req = {
        url: `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    };

    console.log(`Calling GET with URL: ${req.url}`);
    
    try {
        const response = await GET(req);
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Headers:`, Object.fromEntries(response.headers.entries() || []));
        
        if (response.ok) {
            const buf = await response.arrayBuffer();
            console.log(`Fetched successfully! Buffer size: ${buf.byteLength} bytes`);
        } else {
            const text = await response.text();
            console.log(`Failed to fetch: ${text}`);
        }
    } catch (err) {
        console.error('Error in execution:', err);
    }
}

run();
