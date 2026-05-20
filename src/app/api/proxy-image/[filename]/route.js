export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return new Response('Missing url parameter', { status: 400 });
        }

        console.log('PROXY ATTEMPTING TO FETCH URL:', url);

        // Fetch the image from the external URL without caching
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            return new Response('Failed to fetch image', { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = await response.arrayBuffer();

        // If the image is WEBP, we must convert it to JPEG because @react-pdf/renderer does not support WEBP.
        if (contentType.includes('webp') || url.toLowerCase().includes('.webp')) {
            try {
                // Dynamic import so it's only loaded when needed
                const { loadImage, createCanvas } = await import('@napi-rs/canvas');
                const image = await loadImage(Buffer.from(buffer));
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                const jpegBuffer = await canvas.encode('jpeg');
                
                return new Response(jpegBuffer, {
                    headers: {
                        'Content-Type': 'image/jpeg',
                        'Cache-Control': 'public, max-age=86400, must-revalidate',
                    },
                });
            } catch (err) {
                console.error('Error converting webp to jpeg:', err);
                // Fall back to original buffer if conversion fails, though it will likely fail to render in PDF
            }
        }

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error in proxy-image API:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
