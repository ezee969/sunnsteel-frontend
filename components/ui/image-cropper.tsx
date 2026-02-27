import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import getCroppedImg from '@/lib/utils/cropImage';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (croppedFile: File) => void;
}

export function ImageCropper({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedFile) {
        onCropComplete(croppedFile);
        onOpenChange(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-64 sm:h-80 bg-neutral-100 rounded-md overflow-hidden">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
            />
          ) : null}
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <span className="text-sm font-medium text-muted-foreground w-12">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <DialogFooter className="mt-4 sm:justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
