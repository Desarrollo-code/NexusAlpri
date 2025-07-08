
import { Resend } from 'resend';
import { type ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.FROM_EMAIL || 'NexusAlpri <onboarding@resend.dev>';

export const sendEmail = async ({
  to,
  subject,
  react,
}: {
  to: string[];
  subject: string;
  react: ReactElement;
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email sending is disabled.');
    // Silently fail in development if the key is not set.
    if (process.env.NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY is not set for production environment.');
    }
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      react,
    });

    if (error) {
      // Log the error but don't let it crash the main operation (e.g., creating an announcement)
      console.error('Error sending email:', error);
      return;
    }

    console.log('Email sent successfully:', data);

  } catch (error) {
    console.error('Caught an exception while sending email:', error);
  }
};
