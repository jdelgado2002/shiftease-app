import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type InvitationEmailProps = {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
};

export async function sendInvitationEmail({
  inviteeEmail,
  inviterName,
  organizationName,
  role,
  invitationLink,
}: InvitationEmailProps) {
  const msg = {
    to: inviteeEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@shiftease.com',
      name: 'ShiftEase',
    },
    templateId: process.env.SENDGRID_INVITATION_TEMPLATE_ID,
    dynamicTemplateData: {
      inviter_name: inviterName,
      organization_name: organizationName,
      role: role.toLowerCase(),
      invitation_link: invitationLink,
    },
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
} 