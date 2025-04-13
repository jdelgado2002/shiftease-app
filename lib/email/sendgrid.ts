import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
}

export async function sendTemplatedEmail({ to, templateId, dynamicTemplateData }: EmailOptions) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      templateId,
      dynamicTemplateData,
    });
    
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send email');
  }
}
