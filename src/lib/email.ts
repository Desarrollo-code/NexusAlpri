
import { Resend } from 'resend';
import { type ReactElement } from 'react';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Ensure RESEND_API_KEY is set in environment variables
const resendApiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;

if (resendApiKey) {
    resend = new Resend(resendApiKey);
} else {
    console.warn("RESEND_API_KEY no está configurada en las variables de entorno. La funcionalidad de envío de correos estará deshabilitada.");
}

const fromEmail = 'NexusAlpri <onboarding@resend.dev>';

export const sendEmail = async ({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
}) => {
  // Log for debugging
  console.log("--- Iniciando proceso de envío de correo ---");

  if (!resend) {
      console.error("Intento de envío de correo, pero Resend no está inicializado. ¿Falta la RESEND_API_KEY?");
      return;
  }
  
  const apiKeyPreview = resendApiKey ? `${resendApiKey.substring(0, 5)}...${resendApiKey.substring(resendApiKey.length - 4)}` : "No encontrada";
  console.log(`[Email Debug] Usando clave de API que empieza con: ${apiKeyPreview}`);

  try {
    const settings = await prisma.platformSettings.findFirst();

    // 1. Check if email notifications are globally disabled
    if (!settings || !settings.enableEmailNotifications) {
        console.log('[Email Debug] Las notificaciones por correo están deshabilitadas en la configuración. Se cancela el envío.');
        return;
    }
    
    let finalRecipients: string[] = Array.isArray(to) ? to : [to];
    console.log(`[Email Debug] Destinatarios originales: ${JSON.stringify(finalRecipients)}`);

    // 2. Check for whitelist/test mode
    if (settings.emailWhitelist && settings.emailWhitelist.trim() !== '') {
        const whitelist = settings.emailWhitelist.split(',').map(email => email.trim().toLowerCase());
        
        finalRecipients = finalRecipients.filter(recipient => whitelist.includes(recipient.toLowerCase()));

        console.log(`[Email Debug] Lista blanca activa: ${JSON.stringify(whitelist)}`);
        console.log(`[Email Debug] Destinatarios después de filtrar por lista blanca: ${JSON.stringify(finalRecipients)}`);
    }
    
    // 3. If no recipients left after filtering, don't send
    if (finalRecipients.length === 0) {
        console.log('[Email Debug] No hay destinatarios válidos después de aplicar los filtros. Se cancela el envío.');
        return;
    }

    // 4. Handle development environment simulation vs. real sending
    if (process.env.NODE_ENV === 'development') {
      console.log('--- SIMULACIÓN DE CORREO (Entorno de Desarrollo) ---');
      console.log('Desde:', fromEmail);
      console.log('Para:', finalRecipients);
      console.log('Asunto:', subject);
      // Not logging react props as it can be very verbose
      console.log('----------------------------------------------------');
      // Uncomment the line below to perform real sends in development
      // WARNING: This will send real emails and may incur costs.
      // const { data, error } = await resend.emails.send({ from: fromEmail, to: finalRecipients, subject, react });
      // if (error) { console.error('Error enviando correo en DEV:', error); return; }
      // console.log('Correo real enviado en DEV:', data);
      return;
    }
  
    // 5. Send the email via Resend in production
    console.log(`[Email Prod] Enviando correo real a: ${JSON.stringify(finalRecipients)}`);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: finalRecipients,
      subject,
      react,
    });

    if (error) {
      console.error('Error enviando correo vía Resend:', error);
      return;
    }

    console.log('Correo enviado exitosamente vía Resend:', data);

  } catch (error) {
    console.error('Excepción atrapada en la función sendEmail:', error);
  }
};
