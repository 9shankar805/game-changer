import { useState, useRef } from "react";
import { Camera, Upload, Link, X, Image as ImageIcon, Wand2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// AI Processing Service Configuration
const AI_SERVICE_URL = "http://localhost:8000"; // FastAPI service URL

// Smart image compression utility targeting 1MB with HD quality preservation
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const timeout = setTimeout(() => {
      reject(new Error('Image compression timeout'));
    }, 15000);
    
    img.onload = () => {
      try {
        clearTimeout(timeout);
        
        let { width, height } = img;
        
        // Target 1MB maximum for HD quality
        const targetSizeKB = 1024;
        const targetSizeBytes = targetSizeKB * 1024;
        const base64Overhead = 1.37;
        
        let maxDimension = 2048;
        
        if (file.size > targetSizeBytes * 10) {
          maxDimension = 1600;
        } else if (file.size > targetSizeBytes * 5) {
          maxDimension = 1920;
        }
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.92;
        let compressedData = canvas.toDataURL('image/jpeg', quality);
        
        if (compressedData.length <= targetSizeBytes * base64Overhead) {
          resolve(compressedData);
          return;
        }
        
        while (compressedData.length > targetSizeBytes * base64Overhead && quality > 0.3) {
          quality -= 0.05;
          compressedData = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(compressedData);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

interface AIImageUploadProps {
  maxImages?: number;
  minImages?: number;
  onImagesChange: (images: string[]) => void;
  initialImages?: string[];
  label?: string;
  className?: string;
  single?: boolean;
}

export default function AIImageUpload({
  maxImages = 6,
  minImages = 1,
  onImagesChange,
  initialImages = [],
  label = "Upload Product Images with AI Enhancement",
  className = "",
  single = false
}: AIImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  // AI Processing Options
  const [removeBackground, setRemoveBackground] = useState(true);
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [whiteBackground, setWhiteBackground] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const actualMaxImages = single ? 1 : maxImages;

  // AI Service Health Check
  const checkAIService = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('AI service not available:', error);
      return false;
    }
  };

  // Process image with AI
  const processImageWithAI = async (imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('remove_bg', removeBackground.toString());
    formData.append('enhance', enhanceQuality.toString());
    formData.append('white_background', whiteBackground.toString());
    formData.append('max_size', '1024'); // Max dimension for processing

    const response = await fetch(`${AI_SERVICE_URL}/process-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`AI processing failed: ${response.statusText}`);
    }

    // Convert blob to base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    if (images.length + files.length > actualMaxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${actualMaxImages} image${actualMaxImages > 1 ? 's' : ''} allowed`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setAiProcessing(true);
    const newImages: string[] = [];

    try {
      // Check if AI service is available
      const aiServiceAvailable = await checkAIService();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please select only image files",
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select images smaller than 20MB",
            variant: "destructive"
          });
          continue;
        }

        try {
          let processedImage: string;

          if (aiServiceAvailable && (removeBackground || enhanceQuality)) {
            // Process with AI
            toast({
              title: "AI Processing",
              description: `Processing ${file.name} with AI enhancement...`,
              duration: 2000,
            });

            try {
              processedImage = await processImageWithAI(file);
              
              toast({
                title: "AI Processing Complete",
                description: `${file.name} enhanced successfully with AI`,
              });
            } catch (aiError) {
              console.error('AI processing failed:', aiError);
              // Fallback to regular compression
              toast({
                title: "AI Processing Failed",
                description: "Using regular compression instead",
                variant: "destructive",
              });
              processedImage = await compressImage(file);
            }
          } else {
            // Regular compression
            if (!aiServiceAvailable && (removeBackground || enhanceQuality)) {
              toast({
                title: "AI Service Unavailable",
                description: "Using regular compression. Start AI service for background removal and enhancement.",
                variant: "destructive",
              });
            }
            processedImage = await compressImage(file);
          }

          newImages.push(processedImage);
        } catch (error) {
          console.error('Processing failed for file:', file.name, error);
          toast({
            title: "Processing failed",
            description: `Failed to process ${file.name}`,
            variant: "destructive"
          });
          continue;
        }
      }

      if (newImages.length > 0) {
        const updatedImages = single ? newImages : [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
        
        toast({
          title: "Images processed successfully",
          description: `${newImages.length} image${newImages.length > 1 ? 's' : ''} added with AI enhancement`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setAiProcessing(false);
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;

    if (images.length >= actualMaxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add ${actualMaxImages} image${actualMaxImages > 1 ? 's' : ''}`,
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
      return;
    }

    const updatedImages = single ? [urlInput] : [...images, urlInput];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setUrlInput("");
    
    toast({
      title: "Image URL added",
      description: "Image URL has been added successfully"
    });
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerCameraInput = () => cameraInputRef.current?.click();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {!single && (
          <span className="text-xs text-gray-500 ml-2">
            ({minImages}-{maxImages} images)
          </span>
        )}
      </label>

      {/* AI Processing Options */}
      <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">AI Enhancement Options</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-bg"
                checked={removeBackground}
                onCheckedChange={(checked) => setRemoveBackground(checked === true)}
              />
              <label htmlFor="remove-bg" className="text-sm font-medium text-gray-700">
                Remove Background
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enhance"
                checked={enhanceQuality}
                onCheckedChange={(checked) => setEnhanceQuality(checked === true)}
              />
              <label htmlFor="enhance" className="text-sm font-medium text-gray-700">
                Enhance Quality
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="white-bg"
                checked={whiteBackground}
                onCheckedChange={(checked) => setWhiteBackground(checked === true)}
                disabled={!removeBackground}
              />
              <label htmlFor="white-bg" className="text-sm font-medium text-gray-700">
                White Background
              </label>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-2">
            🤖 AI processing includes background removal and image enhancement for professional product photos
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center space-x-1">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center space-x-1">
            <Camera className="h-4 w-4" />
            <span>Camera</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center space-x-1">
            <Link className="h-4 w-4" />
            <span>URL</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 cursor-pointer transition-colors bg-gradient-to-br from-purple-50 to-blue-50"
              >
                {aiProcessing ? (
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-purple-600 animate-spin" />
                ) : (
                  <Wand2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                )}
                <p className="text-sm text-gray-600">
                  {aiProcessing 
                    ? "AI processing your images..." 
                    : "Click to select images for AI enhancement"
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  AI background removal + quality enhancement
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={!single}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div
                onClick={triggerCameraInput}
                className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 cursor-pointer transition-colors bg-gradient-to-br from-purple-50 to-blue-50"
              >
                <Camera className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">
                  Take a photo with AI enhancement
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Camera + AI background removal
                </p>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple={!single}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <Input
                  type="url"
                  placeholder="Enter image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleUrlAdd} disabled={!urlInput.trim()}>
                  Add URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {single ? "Enhanced Image" : `Enhanced Images (${images.length}/${actualMaxImages})`}
          </label>
          <div className={`grid gap-3 ${single ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                  <img
                    src={image}
                    alt={`Enhanced ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Im0xNSAxMi0zIDMtMy0zIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA5djYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isUploading || aiProcessing) && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
            <div>
              <p className="text-sm font-medium text-purple-900">
                {aiProcessing ? "AI processing images..." : "Processing images..."}
              </p>
              <p className="text-xs text-purple-700">
                {aiProcessing 
                  ? "Removing backgrounds and enhancing quality"
                  : "Compressing and optimizing for better performance"
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}