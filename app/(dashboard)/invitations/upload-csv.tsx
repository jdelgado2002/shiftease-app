'use client';

import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { downloadCSVTemplate } from './csv-template';

export function UploadCSV() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { organization } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setProgress(10); // Initial progress
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Call the API endpoint
      const response = await fetch('/api/invitations/csv', {
        method: 'POST',
        headers: {
          'x-organization-id': organization?.id || '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload CSV');
      }

      const result = await response.json();
      setProgress(100);
      
      toast({
        title: "CSV Upload Complete",
        description: `Successfully processed ${result.successful?.length || 0} invitations. ${result.failed?.length || 0} failed.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
        </DialogTrigger>
        <Button variant="outline" onClick={downloadCSVTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>
      <DialogContent aria-describedby="upload-description">
        <DialogHeader>
          <DialogTitle>Upload Invitations CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div id="upload-description" className="text-sm text-muted-foreground">
            Select a CSV file containing invitation details. The file should follow the template format.
          </div>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processing... {progress}%
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
