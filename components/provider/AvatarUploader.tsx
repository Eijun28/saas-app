'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, ZoomIn } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // sm=40px, md=64px, lg=96px, xl=120px
  editable?: boolean; // Permet upload/delete
  showEnlarge?: boolean; // Montre icône zoom
  onAvatarUpdate?: (url: string | null) => void;
}

export function AvatarUploader({ 
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

  // Fonction helper pour nettoyer l'URL et ajouter un nouveau timestamp
  const getUrlWithTimestamp = (url: string | null): string | null => {
    if (!url) return null;
    // Enlever tous les paramètres de query existants (y compris les anciens timestamps)
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?t=${Date.now()}`;
  };

  // ✅ Ajouter timestamp au chargement initial pour éviter le cache
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatarUrl ? getUrlWithTimestamp(currentAvatarUrl) : null
  );
  const [imageKey, setImageKey] = useState(0); // Clé pour forcer le re-render

  // Charger l'avatar depuis la DB si pas fourni (une seule fois au montage)
  useEffect(() => {
    const loadAvatar = async () => {
      // Si currentAvatarUrl est fourni, l'utiliser avec timestamp
      if (currentAvatarUrl) {
        setAvatarUrl(getUrlWithTimestamp(currentAvatarUrl));
        setImageKey(prev => prev + 1); // Forcer le re-render
        return;
      }

      // Sinon, charger depuis la DB
      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (!error && profile) {
          const url = profile.avatar_url || null;
          // ✅ Ajouter timestamp pour forcer le refresh
          setAvatarUrl(getUrlWithTimestamp(url));
          setImageKey(prev => prev + 1); // Forcer le re-render
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Charger seulement au montage

  // ✅ Mettre à jour l'avatar si currentAvatarUrl change (au refresh de la page)
  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarUrl(getUrlWithTimestamp(currentAvatarUrl));
      setImageKey(prev => prev + 1); // Forcer le re-render
    } else {
      setAvatarUrl(null);
      setImageKey(prev => prev + 1);
    }
  }, [currentAvatarUrl]);

  // Tailles en pixels pour le wrapper (doivent correspondre exactement)
  const sizeMap = {
    sm: 'h-10 w-10',      // 40px
    md: 'h-16 w-16',      // 64px
    lg: 'h-24 w-24',      // 96px
    xl: 'h-[120px] w-[120px]', // 120px
  };

  // Tailles de texte pour les initiales
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

  // Générer les initiales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compression de l'image (carré 400x400px, max 500KB)
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
                // Vérifier que la taille est < 500KB
                if (blob.size > 500 * 1024) {
                  // Réduire la qualité si trop gros
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
      toast.error('Erreur', {
        description: 'Le fichier doit être une image',
      });
      return;
    }

    setIsUploading(true);

    try {
      const compressedFile = await compressAvatar(file);
      const avatarPath = `${userId}/avatar.jpg`;
      const supabase = createClient();

      // Supprimer l'ancien avatar s'il existe (enlever le timestamp de l'URL)
      if (avatarUrl) {
        const cleanUrl = avatarUrl.split('?')[0]; // Enlever le timestamp
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

      // Mettre à jour la table profiles
      const { data: updateData, error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: urlData.publicUrl,
          avatar_path: avatarPath,
        })
        .eq('id', userId)
        .select();

      if (dbError) {
        console.error('DB update error:', dbError);
        throw dbError;
      }

      // ✅ Ajouter timestamp pour forcer le refresh
      const urlWithTimestamp = getUrlWithTimestamp(urlData.publicUrl);
      setAvatarUrl(urlWithTimestamp);
      setImageKey(prev => prev + 1); // Forcer le re-render
      onAvatarUpdate?.(urlData.publicUrl); // Callback sans timestamp (pour la DB)
      
      // Déclencher un événement pour mettre à jour le header
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { avatarUrl: urlData.publicUrl } 
      }));
      
      toast.success('Succès', {
        description: 'Photo de profil mise à jour',
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de l\'upload';
      toast.error('Erreur', {
        description: errorMessage,
      });
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
      // Enlever le timestamp de l'URL pour obtenir le chemin réel
      const cleanUrl = avatarUrl.split('?')[0];
      const avatarPath = cleanUrl.includes('/avatars/') 
        ? cleanUrl.split('/avatars/')[1].split('?')[0]
        : `${userId}/avatar.jpg`;
      
      await supabase.storage.from('avatars').remove([avatarPath]);

      // Mettre à jour la table profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          avatar_path: null,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting avatar from profile:', error);
        throw error;
      }

      setAvatarUrl(null);
      onAvatarUpdate?.(null);
      toast.success('Succès', {
        description: 'Photo de profil supprimée',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.message || error?.code || error?.details || 'Erreur lors de la suppression';
      toast.error('Erreur', {
        description: errorMessage,
      });
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
                key={imageKey} // Clé unique pour forcer le re-render
                src={avatarUrl}
                alt={userName}
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl(null)}
                onLoad={() => {
                  // Forcer le rechargement si l'image est en cache
                  const img = document.querySelector(`img[src="${avatarUrl}"]`) as HTMLImageElement;
                  if (img) {
                    img.src = avatarUrl;
                  }
                }}
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
        <DialogContent className="max-w-lg" showCloseButton={false} aria-describedby={undefined}>
          {/* DialogTitle caché pour l'accessibilité */}
          <DialogTitle className="sr-only">
            Photo de profil - {userName}
          </DialogTitle>
          
          <div className="space-y-4">
            <div className="relative flex justify-center">
              {/* Close button - seule croix */}
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
                    key={`modal-${imageKey}`} // Clé unique pour forcer le re-render
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

