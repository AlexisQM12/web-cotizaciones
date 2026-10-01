import fs from 'fs';
import { loadImage, createCanvas } from '@napi-rs/canvas';

async function test() {
    const url = 'https://firebasestorage.googleapis.com/v0/b/web-cot-aya.firebasestorage.app/o/quotation-images%2FrfJL7tbomR6iMfIG2JqP%2Fitem-0-1779298133521.webp?alt=media&token=41edf6ab-59e1-4e2c-a939-1261ffe2a8db';
    
    console.log('Fetching...');
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    
    console.log('Loading image...');
    const image = await loadImage(Buffer.from(buffer));
    
    console.log('Creating canvas...');
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    console.log('Encoding to JPEG...');
    const jpegBuffer = await canvas.encode('jpeg');
    
    console.log('Success, buffer length:', jpegBuffer.length);
}

test().catch(console.error);
