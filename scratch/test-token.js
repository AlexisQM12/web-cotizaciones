import { admin } from '../src/lib/firebase-admin.js';

async function test() {
    const credential = admin.app().options.credential;
    console.log(credential);
    const token = await credential.getAccessToken();
    console.log(token.access_token);
}

test();
