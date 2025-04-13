'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, RefreshCcw, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: Date;
  expiresAt: Date;
  inviterId: string;
  audit?: {
    action: string;
    performedBy: string;
    details: Record<string, any>;
  }[];
}

export function InvitationsDataTable() {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getInvitations, resendInvitation, revokeInvitation } = useAuth();

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await getInvitations();
      setInvitations(data);
    } catch (error) {
      toast({
        title: "Error fetching invitations",
        description: "Failed to load invitations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: "Invitation resent",
        description: "The invitation has been resent successfully.",
      });
      await fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await revokeInvitation(invitationId);
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked successfully.",
      });
      await fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Invitation['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      case 'REVOKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvitations}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation: Invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.email}</TableCell>
              <TableCell className="capitalize">{invitation.role.toLowerCase()}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(invitation.status)}>
                  {invitation.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDistanceToNow(new Date(invitation.createdAt))} ago</TableCell>
              <TableCell>{formatDistanceToNow(new Date(invitation.expiresAt))} left</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {invitation.status === 'PENDING' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Resend
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Revoke
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {invitations.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No invitations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
