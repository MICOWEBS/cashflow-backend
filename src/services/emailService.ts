import { Resend } from 'resend';
import config from '../config/config';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY || config.email.provider.resend.apiKey;
const resend = new Resend(resendApiKey);

export const sendEmail = async (options: { 
  to: string; 
  subject: string; 
  text: string; 
  html?: string 
}): Promise<void> => {
  try {
    if (!resendApiKey) {
      console.error('Resend API key is not configured. Check environment variables.');
      throw new Error('Email service not configured properly');
    }

    console.log(`Attempting to send email to: ${options.to}`);
    console.log(`Using API key starting with: ${resendApiKey.substring(0, 5)}...`);
    console.log(`From email: ${config.email.from}`);

    const response = await resend.emails.send({
      from: config.email.from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    if (!response.data?.id) {
      console.error('Failed to send email - API response:', JSON.stringify(response));
      throw new Error('Failed to send email - no confirmation ID received');
    }

    console.log('Email sent successfully:', response.data.id);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // In production, don't fail the entire operation if email sending fails
    if (process.env.NODE_ENV === 'production') {
      console.error('Email sending failed but continuing operation');
      return; // Don't throw, just return
    }
    
    throw new Error('Failed to send email');
  }
}; 