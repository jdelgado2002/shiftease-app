import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface InvitationEmailParams {
  email: string;
  token: string;
  organizationName: string;
  inviterName: string;
}

export async function sendInvitationEmail({
  email,
  token,
  organizationName,
  inviterName,
}: InvitationEmailParams) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@easyshifthq.com',
    templateId: process.env.SENDGRID_INVITATION_TEMPLATE_ID,
    dynamicTemplateData: {
      organizationName,
      inviterName,
      acceptUrl,
    },
  };

  await sgMail.send(msg);
} 