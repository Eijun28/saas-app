'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  showEnlarge?: boolean;
  onAvatarUpdate?: (url: string | null) => void;
}

export function CoupleAvatarUploader({ 
  userId, 
  currentAvatarUrl, 
  userName,
  size = 'lg',
  editable = true,
  showEnlarge = false,
  onAvatarUpdate 
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getUrlWithTimestamp = (url: string | null): string | null => {
    if (!url) return null;
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?t=${Date.now()}`;
  };

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatarUrl ? getUrlWithTimestamp(currentAvatarUrl) : null
  );
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    const loadAvatar = async () => {
      if (currentAvatarUrl) {
        setAvatarUrl(getUrlWithTimestamp(currentAvatarUrl));
        setImageKey(prev => prev + 1);
        return;
      }

      try {
        const supabase = createClient();
        const { data: couple, error } = await supabase
          .from('couples')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (!error && couple) {
          const url = couple.avatar_url || null;
          setAvatarUrl(getUrlWithTimestamp(url));
          setImageKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadAvatar();
  }, [userId, currentAvatarUrl]);

  const sizeMap = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-[120px] w-[120px]',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const iconSizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  async function compressAvatar(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d');
          const sourceSize = Math.min(img.width, img.height);
          const sx = (img.width - sourceSize) / 2;
          const sy = (img.height - sourceSize) / 2;
          
          ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > 500 * 1024) {
                  canvas.toBlob(
                    (smallerBlob) => {
                      if (smallerBlob) {
                        resolve(new File([smallerBlob], 'avatar.jpg', {
                          type: 'image/jpeg',
                          lastModified: Date.now(),
                        }));
                      } else {
                        resolve(file);
                      }
                    },
                    'image/jpeg',
                    0.7
                  );
                } else {
                  resolve(new File([blob], 'avatar.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }));
                }
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.9
          );
        };
      };
    });
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    setIsUploading(true);

    try {
      const compressedFile = await compressAvatar(file);
      const avatarPath = `${userId}/avatar.jpg`;
      const supabase = createClient();

      // Supprimer l'ancien avatar s'il existe
      if (avatarUrl) {
        const cleanUrl = avatarUrl.split('?')[0];
        const oldPath = cleanUrl.includes('/avatars/') 
          ? cleanUrl.split('/avatars/')[1].split('?')[0]
          : `${userId}/avatar.jpg`;
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload vers Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath);

      // Mettre à jour la table couples
      const { error: dbError } = await supabase
        .from('couples')
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('DB update error:', dbError);
        throw dbError;
      }

      const urlWithTimestamp = getUrlWithTimestamp(urlData.publicUrl);
      setAvatarUrl(urlWithTimestamp);
      setImageKey(prev => prev + 1);
      onAvatarUpdate?.(urlData.publicUrl);
      // Déclencher un événement pour mettre à jour la TopBar
      window.dispatchEvent(new CustomEvent('avatar-updated'));
      toast.success('Photo de profil mise à jour');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de l\'upload';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete() {
    if (!avatarUrl) return;

    try {
      const supabase = createClient();
      const cleanUrl = avatarUrl.split('?')[0];
      const avatarPath = cleanUrl.includes('/avatars/') 
        ? cleanUrl.split('/avatars/')[1].split('?')[0]
        : `${userId}/avatar.jpg`;
      
      await supabase.storage.from('avatars').remove([avatarPath]);

      // Mettre à jour la table couples
      const { error } = await supabase
        .from('couples')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting avatar from couple:', error);
        throw error;
      }

      setAvatarUrl(null);
      onAvatarUpdate?.(null);
      // Déclencher un événement pour mettre à jour la TopBar
      window.dispatchEvent(new CustomEvent('avatar-updated'));
      toast.success('Photo de profil supprimée');
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  }

  const handleAvatarClick = () => {
    if (showEnlarge || !editable) {
      setShowModal(true);
    } else if (editable) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      {/* Avatar principal */}
      <div className={cn('relative group inline-block', sizeMap[size])}>
        <div
          className={cn(
            'cursor-pointer ring-2 ring-[#823F91]/20 hover:ring-[#823F91]/40 transition-all rounded-full overflow-hidden',
            sizeMap[size]
          )}
          onClick={handleAvatarClick}
        >
          <div className={cn('h-full w-full rounded-full overflow-hidden bg-[#E5E7EB] flex items-center justify-center', sizeMap[size])}>
            {avatarUrl ? (
              <img
                key={imageKey}
                src={avatarUrl}
                alt={userName}
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <span className={cn('font-semibold text-[#6B7280]', textSizeMap[size])}>
                {getInitials(userName)}
              </span>
            )}
          </div>
        </div>
        
        {/* Overlay au hover - seulement si editable */}
        {editable && (
          <div 
            className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className={cn(iconSizeMap[size], 'text-white animate-spin')} />
            ) : (
              <Camera className={cn(iconSizeMap[size], 'text-white')} />
            )}
          </div>
        )}

        {/* Icône zoom si showEnlarge */}
        {showEnlarge && !editable && (
          <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border shadow-sm">
            <ZoomIn className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        {/* Input file caché */}
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        )}
      </div>

      {/* Modal d'agrandissement */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">
            Photo de profil - {userName}
          </DialogTitle>
          
          <div className="space-y-4">
            <div className="relative flex justify-center">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 z-10 bg-background hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
              
              <div className="h-64 w-64 rounded-full overflow-hidden bg-[#E5E7EB] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    key={`modal-${imageKey}`}
                    src={avatarUrl}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-6xl font-semibold text-[#6B7280]">
                    {getInitials(userName)}
                  </span>
                )}
              </div>
            </div>
            
            {editable && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Changer la photo
                </Button>
                {avatarUrl && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleDelete();
                      setShowModal(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

