async function test() {
    try {
        const formData = new FormData();
        const blob = new Blob(['dummy image content'], { type: 'image/jpeg' });
        formData.append('file', blob, 'test.jpg');
        console.log('Fetching...');
        const res = await fetch('http://localhost:3000/api/scan-invoice', { method: 'POST', body: formData });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch(e) {
        console.log('Error:', e);
    }
}
test();
