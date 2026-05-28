import { createCanvas, loadImage } from '@napi-rs/canvas';
async function getColor() {
    const image = await loadImage('public/icono-cgo.png');
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    // Find dominant non-transparent color by sampling a few spots
    const w = image.width, h = image.height;
    const spots = [
      [w/2, h/2],
      [w/2, h/4],
      [w/4, h/2]
    ];
    for (let [x, y] of spots) {
      const data = ctx.getImageData(x, y, 1, 1).data;
      if (data[3] > 0) {
        const hex = "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);
        console.log(`Found color at ${x},${y}: ${hex}`);
      }
    }
}
getColor();
