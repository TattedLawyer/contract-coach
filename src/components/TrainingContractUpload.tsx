import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface FileWithPreview extends File {
  preview?: string;
}

export const TrainingContractUpload = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [contractType, setContractType] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { isAdmin, loading } = useUserRole();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false
  });

  const removeFile = () => {
    files.forEach(file => file.preview && URL.revokeObjectURL(file.preview));
    setFiles([]);
  };

  const uploadFile = async () => {
    if (!files.length || !isAdmin) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('training-contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast({
        title: "Success",
        description: "Training contract uploaded successfully!",
      });

      // Reset form
      removeFile();
      setContractType('');
      setDescription('');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload training contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Admin access required to upload training contracts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Training Contract
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="contract-type">Contract Type</Label>
          <Input
            id="contract-type"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            placeholder="e.g., Safety Training, Technical Manual"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the training contract content"
            rows={3}
          />
        </div>

        <div>
          <Label>Document Upload</Label>
          {!files.length ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the document here'
                  : 'Drag & drop a document here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOC, DOCX files
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{files[0].name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(files[0].size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={uploadFile}
          disabled={!files.length || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Contract'}
        </Button>
      </CardContent>
    </Card>
  );
};