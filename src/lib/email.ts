
import { Resend } from 'resend';
import { type ReactElement } from 'react';

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
  // Simulate email sending in development environment for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('--- EMAIL SIMULATION ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('React Component Props:', react.props);
    console.log('------------------------');
    // In dev, we can resolve immediately without sending a real email.
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
      console.error('Error sending email:', error);
      return;
    }

    console.log('Email sent successfully:', data);

  } catch (error) {
    console.error('Caught an exception while sending email:', error);
  }
};
