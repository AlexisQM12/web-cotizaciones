import { POST } from '../src/app/api/scan-invoice/route.js';
import fs from 'fs';
import path from 'path';

// Mock del objeto Request de Next.js
class MockRequest {
    constructor(formData) {
        this._formData = formData;
    }
    async formData() {
        return this._formData;
    }
}

// Mock de FormData
class MockFormData {
    constructor() {
        this.data = new Map();
    }
    append(key, value) {
        this.data.set(key, value);
    }
    get(key) {
        return this.data.get(key);
    }
}

// Mock de File/Blob
class MockFile {
    constructor(buffer, name, type) {
        this.buffer = buffer;
        this.name = name;
        this.type = type;
    }
    async arrayBuffer() {
        return this.buffer.buffer.slice(this.buffer.byteOffset, this.buffer.byteOffset + this.buffer.byteLength);
    }
}

async function run() {
    try {
        console.log('--- Iniciando prueba local del OCR ---');
        // Cargamos una imagen dummy o archivo
        const testFilePath = path.join(process.cwd(), 'test.png');
        if (!fs.existsSync(testFilePath)) {
            // Crear un archivo test.png dummy si no existe
            fs.writeFileSync(testFilePath, Buffer.alloc(100));
        }
        const fileBuffer = fs.readFileSync(testFilePath);
        const mockFile = new MockFile(fileBuffer, 'test.png', 'image/png');

        const formData = new MockFormData();
        formData.append('file', mockFile);

        const req = new MockRequest(formData);

        console.log('Llamando a POST...');
        const response = await POST(req);
        
        console.log('Status de respuesta:', response.status);
        const json = await response.json();
        console.log('JSON devuelto:', json);

    } catch (err) {
        console.error('ERROR AL EJECUTAR LA PRUEBA:', err);
    }
}

run();
