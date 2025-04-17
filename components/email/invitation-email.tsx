import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from '@react-email/components';

interface InvitationEmailProps {
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  invitationLink: string;
}

export const InvitationEmail = ({
  inviteeEmail,
  inviterName,
  organizationName,
  role,
  invitationLink,
}: InvitationEmailProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on ShiftEase</Preview>
      <Body style={{ fontFamily: 'system-ui', backgroundColor: '#ffffff', margin: '0' }}>
        <Container>
          <Section style={{ padding: '50px 30px 18px 30px', textAlign: 'center' }}>
            <Heading style={{ fontSize: '32px', marginBottom: '10px' }}>
              Join {organizationName}
            </Heading>
          </Section>

          <Section style={{ padding: '0px 30px 30px 30px', lineHeight: '24px', textAlign: 'left' }}>
            <Text>Hello,</Text>
            <Text>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{organizationName}</strong> as a <strong>{role}</strong>.
            </Text>
            <Link
              href={invitationLink}
              style={{
                color: '#1188E6',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '16px',
              }}
            >
              Click here to accept your invitation
            </Link>
            <Text>This invitation will expire in 7 days.</Text>
            <Text>If you don't wish to join, simply ignore this email.</Text>
            
            <Hr style={{ margin: '30px 0' }} />
            
            <Text style={{ textAlign: 'center', fontSize: '13px' }}>
              &copy; {currentYear} ShiftEase. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
