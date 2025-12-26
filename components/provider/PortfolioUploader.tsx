'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import type { ProviderPortfolioImage } from '@/lib/types/prestataire';

interface PortfolioUploaderProps {
  userId: string;
  maxImages?: number; // Default: 10
  onSave?: () => void; // Callback for parent to refresh data
}

export function PortfolioUploader({ userId, maxImages = 10, onSave }: PortfolioUploaderProps) {
  const [images, setImages] = useState<ProviderPortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPortfolio();
  }, [userId]);

  async function loadPortfolio() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('provider_portfolio')
      .select('*')
      .eq('profile_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading portfolio:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement du portfolio',
        variant: 'destructive',
      });
    } else {
      setImages(data || []);
    }
    setIsLoading(false);
  }

  // Compression d'image
  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionner si trop grand (max 1920px)
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.85 // Qualité
          );
        };
      };
    });
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Vérifier limite
    if (images.length + files.length > maxImages) {
      toast({
        title: 'Limite atteinte',
        description: `Maximum ${maxImages} photos autorisées`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Vérifier type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: `${file.name} n'est pas une image`,
          variant: 'destructive',
        });
        continue;
      }

      // Vérifier taille (max 10MB avant compression)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} est trop volumineux (max 10MB)`,
          variant: 'destructive',
        });
        continue;
      }

      try {
        // Compresser
        const compressedFile = await compressImage(file);

        // Générer nom unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const supabase = createClient();

        // Upload vers Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Obtenir URL publique
        const { data: urlData } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        // Insérer en DB
        const { data: dbData, error: dbError } = await supabase
          .from('provider_portfolio')
          .insert({
            profile_id: userId,
            image_url: urlData.publicUrl,
            image_path: fileName,
            display_order: images.length + i,
          })
          .select()
          .single();

        if (dbError) {
          console.error('DB error:', dbError);
          throw dbError;
        }

        // Ajouter à l'état
        setImages(prev => [...prev, dbData]);
        toast({
          title: 'Succès',
          description: 'Photo ajoutée',
          variant: 'success',
        });
        onSave?.(); // Trigger parent refresh
      } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error?.message || error?.code || error?.details || `Erreur lors de l'upload de ${file.name}`;
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }

    setIsUploading(false);
  }

  async function handleDelete(imageId: string, imagePath: string) {
    try {
      const supabase = createClient();

      // Supprimer du Storage
      const { error: storageError } = await supabase.storage
        .from('portfolio')
        .remove([imagePath]);

      if (storageError) throw storageError;

      // Supprimer de la DB
      const { error: dbError } = await supabase
        .from('provider_portfolio')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('DB error:', dbError);
        throw dbError;
      }

      // Retirer de l'état
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: 'Succès',
        description: 'Photo supprimée',
        variant: 'success',
      });
      onSave?.(); // Trigger parent refresh
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la suppression';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-[#823F91] bg-purple-50/50' : 'border-gray-200'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-[#823F91]/50 hover:bg-purple-50/30'}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading || images.length >= maxImages}
        />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                Glissez vos photos ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG jusqu'à 10MB • {images.length}/{maxImages} photos
              </p>
            </>
          )}
        </div>
      </div>

      {/* Grid des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative group overflow-hidden aspect-square">
                <NextImage
                  src={image.image_url}
                  alt={image.title || 'Portfolio'}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id, image.image_path)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune photo dans votre portfolio</p>
        </div>
      )}
    </div>
  );
}

