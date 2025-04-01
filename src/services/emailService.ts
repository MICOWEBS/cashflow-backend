import { Resend } from 'resend';
import config from '../config/config';

const resend = new Resend(config.email.provider.resend.apiKey);

export const sendEmail = async (options: { 
  to: string; 
  subject: string; 
  text: string; 
  html?: string 
}): Promise<void> => {
  try {
    if (!config.email.provider.resend.apiKey) {
      throw new Error('Resend API key is not configured');
    }

    const response = await resend.emails.send({
      from: config.email.from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    if (!response.data?.id) {
      throw new Error('Failed to send email - no confirmation ID received');
    }

    console.log('Email sent successfully:', response.data.id);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}; 