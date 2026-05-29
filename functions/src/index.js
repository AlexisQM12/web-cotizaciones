import { onSchedule } from 'firebase-functions/v2/scheduler';
import { startEmailListener } from './emailListener.js';

// Cloud Function programada para ejecutarse cada 3 minutos
// La memoria se establece en 1GB o 2GB para permitir el OCR sin quedarse sin RAM
// El timeout se establece en 9 minutos (540 segundos) para procesamientos largos
export const scanEmailsTask = onSchedule({
  schedule: 'every 3 minutes',
  memory: '1GiB',
  timeoutSeconds: 540,
  region: 'us-central1'
}, async (event) => {
  console.log('[Cloud Scheduler] Iniciando ciclo de escaneo de correos...');
  
  // Ejecutamos la lógica que antes estaba en startEmailListener.
  // IMPORTANTE: Modificaremos startEmailListener en emailListener.js
  // para que retorne una Promesa que se resuelva cuando termine el ciclo (scanInbox y scanSent).
  // Pasamos null en lugar del objeto `io` (Socket.io).
  await startEmailListener(null);
  
  console.log('[Cloud Scheduler] Ciclo de escaneo completado.');
});
