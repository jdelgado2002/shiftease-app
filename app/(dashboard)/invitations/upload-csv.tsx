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
  const { processCSVInvites } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await processCSVInvites(file);
      
      toast({
        title: "CSV Upload Complete",
        description: `Successfully processed ${result.successful.length} invitations. ${result.failed.length} failed.`,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Invitations CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {isUploading && (
            <Progress value={progress} className="w-full" />
          )}
          {progress > 0 && (
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
