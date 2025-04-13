import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InvalidInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-destructive">Invalid Invitation</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          This invitation link is either invalid, expired, or has already been used.
          Please contact your organization administrator for a new invitation.
        </p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    </div>
  );
} 