import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  onRemove?: () => void;
  index: number;
}

export function ImageUploader({ onImageUploaded, currentImageUrl, onRemove, index }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error'),
        description: t('selectImageFile'),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('error'),
        description: t('imageTooLarge'),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get upload URL from backend with file metadata
      const response = await apiRequest("POST", "/api/upload-url", {
        contentType: file.type,
        fileSize: file.size,
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Handle Replit-only feature
        if (response.status === 503 && error.feature === "replit-only") {
          toast({
            title: t('error'),
            description: "Image upload is only available in Replit environment. Order can be created without images.",
            variant: "destructive",
          });
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        
        throw new Error(error.message || 'Failed to get upload URL');
      }
      
      const { uploadUrl } = await response.json();

      // Upload file to object storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Confirm upload and get normalized path
      const confirmResponse = await apiRequest("POST", "/api/upload-confirm", {
        uploadUrl: uploadUrl.split('?')[0],
      });
      
      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }
      
      const { path } = await confirmResponse.json();

      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Call parent callback with the normalized path
      onImageUploaded(path);

      toast({
        title: t('success'),
        description: t('imageUploadedSuccessfully'),
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Map server errors to localized messages
      let errorMessage = t('imageUploadFailed');
      if (error.message) {
        if (error.message.includes('Invalid file type') || error.message.includes('only') || error.message.includes('allowed')) {
          errorMessage = t('selectImageFile');
        } else if (error.message.includes('size') || error.message.includes('5MB')) {
          errorMessage = t('imageTooLarge');
        }
      }
      
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid={`file-input-${index}`}
      />
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt={`Preview ${index + 1}`}
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 bg-white/80 hover:bg-white"
            onClick={handleRemove}
            disabled={uploading}
            data-testid={`button-remove-image-${index}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid={`button-upload-${index}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('uploading')}...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              {t('uploadImage')}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
