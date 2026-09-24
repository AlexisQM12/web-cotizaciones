import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { startEmailListener } from './emailListener.js';

// Cloud Function programada para ejecutarse cada 3 minutos
export const scanEmailsTask = onSchedule({
  schedule: 'every 3 minutes',
  memory: '1GiB',
  timeoutSeconds: 540,
  region: 'us-central1'
}, async (event) => {
  console.log('[Cloud Scheduler] Iniciando ciclo de escaneo de correos...');
  await startEmailListener(null);
  console.log('[Cloud Scheduler] Ciclo de escaneo completado.');
});

// Trigger HTTP para forzar el escaneo inmediatamente sin esperar 3 minutos
export const triggerScanHttp = onRequest({
  memory: '1GiB',
  timeoutSeconds: 540,
  region: 'us-central1',
  cors: true
}, async (req, res) => {
  console.log('[HTTP Trigger] Iniciando ciclo de escaneo forzado...');
  try {
    await startEmailListener(null);
    res.status(200).json({ success: true, message: 'Escaneo forzado completado.' });
  } catch (error) {
    console.error('[HTTP Trigger] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
