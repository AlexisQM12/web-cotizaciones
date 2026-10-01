import 'dotenv/config';
import { startEmailListener } from './functions/src/emailListener.js';
import { firestore } from './src/lib/firebase-admin.js';

async function testScanner() {
  console.log("==========================================");
  console.log("📡 Iniciando prueba local del lector de correos...");
  console.log("==========================================");

  try {
    // Opcional: Para asegurar que lea todo, podemos limpiar el caché primero.
    // Descomenta las siguientes líneas si quieres forzar un re-escaneo completo en cada prueba local.
    
    // console.log("Limpiando caché en la base de datos...");
    // await firestore.collection('scanner_state').doc('cache').update({
    //   inboxUids: [],
    //   sentUids: [],
    //   quoteLeadUids: []
    // });
    
    await startEmailListener(null);
    console.log("✅ Ciclo de escaneo local completado.");
  } catch (error) {
    console.error("❌ Error en la prueba local:", error);
  } finally {
    process.exit(0);
  }
}

testScanner();
