
import { Resend } from 'resend';
import { type ReactElement } from 'react';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || 're_gcrnufps_8CxhvNio8hUfTxi2oxvapPjG');

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
  try {
    const settings = await prisma.platformSettings.findFirst();

    // 1. Check if email notifications are globally disabled
    if (!settings || !settings.enableEmailNotifications) {
        console.log('Email notifications are disabled. Skipping email send.');
        return;
    }
    
    let finalRecipients: string[] = Array.isArray(to) ? to : [to];

    // 2. Check for whitelist/test mode
    if (settings.emailWhitelist && settings.emailWhitelist.trim() !== '') {
        const whitelist = settings.emailWhitelist.split(',').map(email => email.trim().toLowerCase());
        
        const originalRecipients = [...finalRecipients];
        finalRecipients = finalRecipients.filter(recipient => whitelist.includes(recipient.toLowerCase()));

        console.log('--- EMAIL WHITELIST MODE ---');
        console.log('Original intended recipients:', originalRecipients);
        console.log('Whitelist:', whitelist);
        console.log('Final recipients after filtering:', finalRecipients);
        console.log('--------------------------');
    }
    
    // 3. If no recipients left after filtering, don't send
    if (finalRecipients.length === 0) {
        console.log('No recipients to send to after applying whitelist. Skipping email send.');
        return;
    }

    // 4. Handle development environment simulation
    if (process.env.NODE_ENV === 'development') {
      console.log('--- EMAIL SIMULATION (Development) ---');
      console.log('To:', finalRecipients);
      console.log('Subject:', subject);
      console.log('React Component Props:', react.props);
      console.log('------------------------------------');
      return;
    }
  
    // 5. Send the email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: finalRecipients,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return;
    }

    console.log('Email sent successfully via Resend:', data);

  } catch (error) {
    console.error('Caught an exception in sendEmail function:', error);
  }
};
