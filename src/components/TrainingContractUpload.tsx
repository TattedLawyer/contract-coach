import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
}

export const TrainingContractUpload = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [contractType, setContractType] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { isAdmin, loading } = useUserRole();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
      uploadProgress: 0,
      uploadStatus: 'pending' as const
    }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prevFiles.filter(f => f.id !== fileId);
    });
  };

  const removeAllFiles = () => {
    files.forEach(file => file.preview && URL.revokeObjectURL(file.preview));
    setFiles([]);
  };

  const uploadFiles = async () => {
    if (!files.length || !isAdmin) return;

    setUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;
    const totalFiles = files.length;

    try {
      // Update all files to uploading status
      setFiles(prevFiles => prevFiles.map(file => ({
        ...file,
        uploadStatus: 'uploading' as const
      })));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${i}.${fileExt}`;
          const filePath = `contracts/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('training-contracts')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Save metadata to database
          const { error: dbError } = await supabase
            .from('training_contracts')
            .insert({
              file_name: file.name,
              file_path: filePath,
              contract_type: contractType || null,
              description: description || null,
              uploaded_by: (await supabase.auth.getUser()).data.user?.id,
              file_size: file.size
            });

          if (dbError) throw dbError;

          // Update file status to success
          setFiles(prevFiles => prevFiles.map(f => 
            f.id === file.id ? { ...f, uploadStatus: 'success' as const } : f
          ));

          successCount++;
          setUploadProgress((successCount / totalFiles) * 100);

        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          
          // Update file status to error
          setFiles(prevFiles => prevFiles.map(f => 
            f.id === file.id ? { ...f, uploadStatus: 'error' as const } : f
          ));
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `${successCount} of ${totalFiles} training contracts uploaded successfully!`,
        });
      }

      if (successCount < totalFiles) {
        toast({
          title: "Partial Upload",
          description: `${totalFiles - successCount} files failed to upload. Please try again.`,
          variant: "destructive",
        });
      }

      // Reset form only if all files uploaded successfully
      if (successCount === totalFiles) {
        setTimeout(() => {
          removeAllFiles();
          setContractType('');
          setDescription('');
        }, 2000);
      }

    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload training contracts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
          <Label>Document Upload ({files.length} file{files.length !== 1 ? 's' : ''} selected)</Label>
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
                  ? 'Drop the documents here'
                  : 'Drag & drop documents here, or click to select multiple files'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOC, DOCX files - Multiple files allowed
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Files:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAllFiles}
                  className="h-8 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-muted/30 rounded p-2">
                    <div className="flex items-center gap-2 flex-1">
                      {file.uploadStatus === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      {file.uploadStatus === 'uploading' && (
                        <span className="text-xs text-blue-500">Uploading...</span>
                      )}
                      {file.uploadStatus === 'error' && (
                        <span className="text-xs text-red-500">Failed</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-6 w-6 p-0"
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        <Button
          onClick={uploadFiles}
          disabled={!files.length || uploading}
          className="w-full"
        >
          {uploading ? `Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...` : `Upload ${files.length} Contract${files.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};