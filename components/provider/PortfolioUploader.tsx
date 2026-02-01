'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import type { ProviderPortfolioImage } from '@/lib/types/prestataire';

interface PortfolioUploaderProps {
  userId: string;
  maxImages?: number; // Default: 10
  onSave?: () => void; // Callback for parent to refresh data
}

// Types de fichiers acceptés
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ACCEPTED_PDF_TYPE = 'application/pdf';
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPE];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PortfolioUploader({ userId, maxImages = 10, onSave }: PortfolioUploaderProps) {
  const [images, setImages] = useState<ProviderPortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);

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
      toast.error('Erreur', {
        description: 'Erreur lors du chargement du portfolio',
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
      toast.error('Limite atteinte', {
        description: `Maximum ${maxImages} fichiers autorisés`,
      });
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === ACCEPTED_PDF_TYPE;
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);

      // Vérifier type
      if (!isImage && !isPdf) {
        toast.error('Type de fichier non supporté', {
          description: `${file.name} doit être une image (JPG, PNG, WebP) ou un PDF`,
        });
        continue;
      }

      // Vérifier taille (max 10MB)
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Fichier trop volumineux', {
          description: `${file.name} est trop volumineux (max 10MB)`,
        });
        continue;
      }

      try {
        // Compresser uniquement les images (pas les PDFs)
        const fileToUpload = isImage ? await compressImage(file) : file;

        // Générer nom unique
        const fileExt = file.name.split('.').pop()?.toLowerCase() || (isPdf ? 'pdf' : 'jpg');
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const supabase = createClient();

        // Upload vers Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            contentType: isPdf ? 'application/pdf' : 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // Obtenir URL publique
        const { data: urlData } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        // Insérer en DB avec le type de fichier
        const { data: dbData, error: dbError } = await supabase
          .from('provider_portfolio')
          .insert({
            profile_id: userId,
            image_url: urlData.publicUrl,
            image_path: fileName,
            display_order: images.length + i,
            file_type: isPdf ? 'pdf' : 'image',
          })
          .select()
          .single();

        if (dbError) {
          console.error('DB error:', dbError);
          throw dbError;
        }

        // Ajouter à l'état
        setImages(prev => [...prev, dbData]);
        toast.success('Succès', {
          description: isPdf ? 'PDF ajouté' : 'Photo ajoutée',
        });
        onSave?.(); // Trigger parent refresh
      } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error?.message || error?.code || error?.details || `Erreur lors de l'upload de ${file.name}`;
        toast.error('Erreur', {
          description: errorMessage,
        });
      }
    }

    setIsUploading(false);
  }

  async function handleDelete(imageId: string, imagePath: string, e: React.MouseEvent) {
    e.stopPropagation();
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

      // Retirer de l'état et réorganiser les ordres
      const deletedImage = images.find(img => img.id === imageId);
      const newImages = images.filter(img => img.id !== imageId);
      
      // Réorganiser les display_order
      const updatedImages = newImages.map((img, index) => ({
        ...img,
        display_order: index
      }));

      // Mettre à jour les ordres en DB
      for (const img of updatedImages) {
        await supabase
          .from('provider_portfolio')
          .update({ display_order: img.display_order })
          .eq('id', img.id);
      }

      setImages(updatedImages);
      toast.success('Succès', {
        description: 'Fichier supprimé',
      });
      onSave?.(); // Trigger parent refresh
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la suppression';
      toast.error('Erreur', {
        description: errorMessage,
      });
    }
  }

  // Drag and drop pour réorganiser les images
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, imageId: string) {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', imageId);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, imageId: string) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedImageId && draggedImageId !== imageId) {
      setDragOverImageId(imageId);
    }
  }

  function handleDragLeave() {
    setDragOverImageId(null);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, targetImageId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedImageId || draggedImageId === targetImageId) {
      setDraggedImageId(null);
      setDragOverImageId(null);
      return;
    }

    const draggedIndex = images.findIndex(img => img.id === draggedImageId);
    const targetIndex = images.findIndex(img => img.id === targetImageId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedImageId(null);
      setDragOverImageId(null);
      return;
    }

    // Réorganiser les images localement
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    // Mettre à jour les display_order
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index
    }));

    setImages(updatedImages);
    setDraggedImageId(null);
    setDragOverImageId(null);

    // Mettre à jour en DB
    try {
      const supabase = createClient();
      for (const img of updatedImages) {
        const { error } = await supabase
          .from('provider_portfolio')
          .update({ display_order: img.display_order })
          .eq('id', img.id);

        if (error) throw error;
      }
      toast.success('Succès', {
        description: 'Ordre des photos mis à jour',
      });
      onSave?.();
    } catch (error: any) {
      console.error('Reorder error:', error);
      // Recharger en cas d'erreur
      loadPortfolio();
      toast.error('Erreur', {
        description: 'Erreur lors de la réorganisation',
      });
    }
  }

  // Drag & Drop handlers pour l'upload de fichiers
  function handleUploadDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Ne pas activer si on drag une image existante
    if (e.dataTransfer.types.includes('text/html')) {
      return;
    }
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleUploadDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Vérifier si c'est un fichier (pas une réorganisation d'image)
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !e.dataTransfer.types.includes('text/html')) {
      handleFileUpload(e.dataTransfer.files);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone - Réduite */}
      {images.length < maxImages && (
        <div
          onDragEnter={handleUploadDrag}
          onDragLeave={handleUploadDrag}
          onDragOver={handleUploadDrag}
          onDrop={handleUploadDrop}
          className={`
            relative border border-dashed border-[#823F91]/30 rounded-lg p-3 text-center transition-all bg-white/50
            ${dragActive ? 'bg-purple-50/70 border-[#823F91] shadow-[0_2px_8px_rgba(130,63,145,0.2)]' : ''}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-purple-50/40 hover:border-[#823F91]/50'}
          `}
        >
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || images.length >= maxImages}
          />
          <div className="flex flex-col items-center gap-1">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                <p className="text-xs text-muted-foreground">Upload en cours...</p>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Glissez vos fichiers ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground/70">
                  PNG, JPG, PDF jusqu'à 10MB • {images.length}/{maxImages} fichiers
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Galerie des fichiers */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Galerie ({images.length} fichier{images.length > 1 ? 's' : ''})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => {
              const isPdf = image.file_type === 'pdf';

              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={(e) => handleDragOver(e, image.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, image.id)}
                  className={`
                    relative group cursor-move
                    ${dragOverImageId === image.id ? 'ring-2 ring-[#823F91] ring-offset-2' : ''}
                    ${draggedImageId === image.id ? 'opacity-50' : ''}
                  `}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: draggedImageId === image.id ? 0.5 : 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="relative overflow-hidden aspect-square border-2 border-transparent group-hover:border-[#823F91]/30 transition-colors">
                      {isPdf ? (
                        // Affichage PDF
                        <a
                          href={image.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150 transition-colors"
                        >
                          <FileText className="h-12 w-12 text-red-500 mb-2" />
                          <span className="text-xs font-medium text-red-600 px-2 text-center truncate max-w-full">
                            {image.title || 'Document PDF'}
                          </span>
                          <span className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Ouvrir
                          </span>
                        </a>
                      ) : (
                        // Affichage Image
                        <NextImage
                          src={image.image_url}
                          alt={image.title || 'Portfolio'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      {/* Bouton de suppression avec croix */}
                      <button
                        onClick={(e) => handleDelete(image.id, image.image_path, e)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100"
                        aria-label="Supprimer le fichier"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                      {/* Icône de drag */}
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100">
                        <GripVertical className="h-3.5 w-3.5 text-white" />
                      </div>
                    </Card>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun fichier dans votre portfolio</p>
          <p className="text-xs mt-1 opacity-70">Ajoutez des photos ou des PDFs explicatifs</p>
        </div>
      )}
    </div>
  );
}

