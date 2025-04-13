import { sendTemplatedEmail } from './sendgrid';

interface InvitationEmailParams {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
}

export async function sendInvitationEmail({
  inviteeEmail,
  inviterName,
  organizationName,
  role,
  invitationLink,
}: InvitationEmailParams) {
  try {
    return await sendTemplatedEmail({
      to: inviteeEmail,
      templateId: process.env.SENDGRID_INVITATION_TEMPLATE_ID!,
      dynamicTemplateData: {
        inviter_name: inviterName,
        organization_name: organizationName,
        role: role,
        invitation_link: invitationLink,
        current_year: new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}
