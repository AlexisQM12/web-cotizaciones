## Summary

- **OCR en producción corregido**: se eliminó el render local con `@napi-rs/canvas`+`pdfjs-dist` que causaba OOM en App Hosting (512 MiB). Ahora los PDFs se envían inline directamente a `batchAnnotateFiles` de Google Vision. El cliente Vision siempre usa las credenciales `FIREBASE_*` del entorno (no ADC), eliminando dependencia del SA de runtime.
- **Gmail quote leads**: el `emailListener` detecta solicitudes de cotización en el asunto de correos entrantes (16 keywords en español/inglés). Los leads se guardan en Firestore `quote_leads` y se emiten por Socket.io (`quote_lead_detected`).
- **Notificaciones en UI**: badge rojo parpadeante en la tarjeta "Mis Cotizaciones" del dashboard; panel ámbar en `/quotations` con botones "Crear cotización" (pre-rellena el cliente) y "Descartar"; toast flotante slide-in de 8 s para leads en tiempo real.
- **Gráfico de tendencia diaria**: nuevo endpoint `GET /api/accounting/daily-summary?period=YYYY-MM` que prellena todos los días del mes con ceros. El gráfico SVG (sin dependencias) en el resumen del empresario muestra ventas/compras por día con tooltip y áreas degradadas.

## Files changed

| File | Change |
|------|--------|
| `src/app/api/scan-invoice/route.js` | Rewrite: Vision inline PDF, no canvas render |
| `src/services/emailListener.js` | Add quote lead detection + `saveQuoteLead()` |
| `src/app/api/quote-leads/route.js` | New: GET pending leads |
| `src/app/api/quote-leads/[id]/route.js` | New: PATCH status |
| `src/app/api/accounting/daily-summary/route.js` | New: per-day totals |
| `src/app/api/accounting/periods-summary/route.js` | Add `salesAmount`/`purchasesAmount` |
| `src/app/page.js` | Blinking badge on Mis Cotizaciones card |
| `src/app/quotations/page.js` | Lead panel + toasts + create-from-lead |
| `src/app/contabilidad/empresario/page.js` | Daily SVG line chart |
| `apphosting.yaml` | memoryMiB: 512 to 1024 |
| `next.config.mjs` | Add @google-cloud/vision to serverExternalPackages |

## Reviewer notes

- Google Vision API must be enabled on project `web-cot-aya` and the firebase-adminsdk SA must have the `Cloud Vision AI User` role.
- Quote leads are deduped by IMAP UID (`inbox-{uid}` doc ID in Firestore) — no double notifications across scan cycles.
- The daily chart fetches `daily-summary` on every period change (parallel with `tax-calc` + `calendar`).

Generated with [Claude Code](https://claude.com/claude-code)
