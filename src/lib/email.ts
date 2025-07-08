
import { Resend } from 'resend';
import { type ReactElement } from 'react';

const resend = new Resend('re_gcrnufps_8CxhvNio8hUfTxi2oxvapPjG');

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
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      react,
    });

    if (error) {
      // Log the error but don't let it crash the main operation (e.g., creating an announcement)
      console.error('Error sending email:', error);
      // We can re-throw if the calling function should handle it
      // For now, we'll log and continue
      return;
    }

    console.log('Email sent successfully:', data);

  } catch (error) {
    console.error('Caught an exception while sending email:', error);
  }
};
