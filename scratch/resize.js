import fs from 'fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function resizeImage(inputPath, outputPath, size) {
    const image = await loadImage(inputPath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, size, size);
    const buffer = await canvas.encode('png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Created ${outputPath} (${size}x${size})`);
}

async function main() {
    try {
        await resizeImage('public/icono-cgo.png', 'public/icon-192x192.png', 192);
        await resizeImage('public/icono-cgo.png', 'public/icon-512x512.png', 512);
        console.log('Images resized successfully!');
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
