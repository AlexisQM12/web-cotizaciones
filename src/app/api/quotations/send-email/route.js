import { firestore, getTenantCollection, getTenantDoc } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const formData = await req.formData();
        
        const empresaId = formData.get('empresaId');
        const quotationId = formData.get('quotationId');
        const fromAlias = formData.get('fromAlias');
        const toEmail = formData.get('toEmail');
        const subject = formData.get('subject');
        const message = formData.get('message');
        const pdfFile = formData.get('pdfFile'); // This is a File/Blob

        if (!empresaId || !quotationId || !fromAlias || !toEmail || !pdfFile) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Company Settings for SMTP Credentials
        const settingsDoc = await firestore.collection('company_settings').doc(empresaId).get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};
        
        const smtpUser = settings.smtpUser || process.env.EMAIL_USER;
        const smtpPassword = settings.smtpPassword || process.env.EMAIL_APP_PASSWORD;

        if (!smtpUser || !smtpPassword) {
            return Response.json({ error: 'Falta configurar las credenciales SMTP en Settings y no hay fallback.' }, { status: 400 });
        }

        // 2. Read the PDF File to Buffer
        const arrayBuffer = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Configure Nodemailer Transporter
        // Assuming Gmail as per user context, otherwise we can adapt to generic SMTP later
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPassword
            }
        });

        // 4. Send Email
        // Convert plain text newlines to <br> for HTML email
        const formattedMessage = message ? message.replace(/\n/g, '<br>') : '';
        const signature = settings.emailSignature ? `<br><br>${settings.emailSignature}` : '';
        
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        ${formattedMessage}
        ${signature}
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: settings.senderName 
                ? { name: settings.senderName, address: fromAlias } 
                : fromAlias,
            to: toEmail,
            subject: subject,
            html: htmlBody,
            attachments: [
                {
                    filename: pdfFile.name || 'cotizacion.pdf',
                    content: buffer,
                    contentType: 'application/pdf'
                }
            ],
            // Reply-to ensures replies go to the alias
            replyTo: fromAlias 
        };

        await transporter.sendMail(mailOptions);

        // 5. Update Quotation status to sent
        await getTenantCollection(empresaId, 'quotations').doc(quotationId).update({
            isSent: true,
            quotationStatus: 'pendiente', // Keep it pending or whatever is current, but mark sent
            updatedAt: new Date().toISOString()
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('API Error (send-email POST):', error);
        return Response.json({ error: 'Failed to send email. Check your SMTP settings.' }, { status: 500 });
    }
}
