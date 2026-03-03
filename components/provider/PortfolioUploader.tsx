'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, FileText, ExternalLink, Play, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import type { ProviderPortfolioImage } from '@/lib/types/prestataire';

interface PortfolioUploaderProps {
  userId: string;
  maxImages?: number; // Default: 15
  onSave?: () => void;
}

// ─── Types de fichiers acceptés ──────────────────────────────
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ACCEPTED_PDF_TYPE = 'application/pdf';
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov', 'video/mpeg', 'video/x-m4v'];
const MAX_SIZE_IMAGE = 10 * 1024 * 1024;  // 10 MB
const MAX_SIZE_VIDEO = 200 * 1024 * 1024; // 200 MB

function getFileKind(file: File): 'image' | 'pdf' | 'video' | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (file.type === ACCEPTED_PDF_TYPE) return 'pdf';
  if (ACCEPTED_VIDEO_TYPES.includes(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) return 'video';
  return null;
}

// ─── Compression image ────────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = (height / width) * maxDimension; width = maxDimension; }
          else { width = (width / height) * maxDimension; height = maxDimension; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }) : file),
          'image/jpeg', 0.85
        );
      };
    };
  });
}

export function PortfolioUploader({ userId, maxImages = 15, onSave }: PortfolioUploaderProps) {
  const [items, setItems] = useState<ProviderPortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // video preview modal
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => { loadPortfolio(); }, [userId]);

  async function loadPortfolio() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('provider_portfolio')
      .select('*')
      .eq('profile_id', userId)
      .order('display_order', { ascending: true });
    if (error) { console.error(error); toast.error('Erreur lors du chargement du portfolio'); }
    else setItems(data || []);
    setIsLoading(false);
  }

  // ─── Upload ────────────────────────────────────────────────
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    if (items.length + filesArray.length > maxImages) {
      toast.error('Limite atteinte', { description: `Maximum ${maxImages} fichiers autorisés` });
      return;
    }

    setUploadingCount(filesArray.length);
    let uploaded = 0;

    for (const file of filesArray) {
      const kind = getFileKind(file);

      if (!kind) {
        toast.error('Format non supporté', { description: `${file.name} — utilisez JPG, PNG, PDF, MP4 ou WebM` });
        setUploadingCount(prev => prev - 1);
        continue;
      }

      const maxSize = kind === 'video' ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
      if (file.size > maxSize) {
        toast.error('Fichier trop volumineux', {
          description: kind === 'video'
            ? `${file.name} dépasse 200 MB`
            : `${file.name} dépasse 10 MB`,
        });
        setUploadingCount(prev => prev - 1);
        continue;
      }

      try {
        const fileToUpload = kind === 'image' ? await compressImage(file) : file;
        const ext = file.name.split('.').pop()?.toLowerCase() || kind;
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const supabase = createClient();

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            contentType: kind === 'image' ? 'image/jpeg' : file.type,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(fileName);

        const { data: dbData, error: dbError } = await supabase
          .from('provider_portfolio')
          .insert({
            profile_id: userId,
            image_url: urlData.publicUrl,
            image_path: fileName,
            display_order: items.length + uploaded,
            file_type: kind,
          })
          .select()
          .single();
        if (dbError) throw dbError;

        setItems(prev => [...prev, dbData]);
        uploaded++;
        toast.success(
          kind === 'video' ? 'Vidéo ajoutée' : kind === 'pdf' ? 'PDF ajouté' : 'Photo ajoutée'
        );
        onSave?.();
      } catch (err: any) {
        console.error(err);
        toast.error('Erreur upload', { description: err?.message || `Erreur pour ${file.name}` });
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1));
      }
    }
  }

  // ─── Suppression ───────────────────────────────────────────
  async function handleDelete(itemId: string, itemPath: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage.from('portfolio').remove([itemPath]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('provider_portfolio').delete().eq('id', itemId);
      if (dbError) throw dbError;

      const newItems = items.filter(i => i.id !== itemId).map((i, idx) => ({ ...i, display_order: idx }));
      for (const i of newItems) {
        await supabase.from('provider_portfolio').update({ display_order: i.display_order }).eq('id', i.id);
      }
      setItems(newItems);
      toast.success('Fichier supprimé');
      onSave?.();
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur suppression', { description: err?.message });
    }
  }

  // ─── Réorganisation drag & drop ───────────────────────────
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) setDragOverId(id);
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }

    const fromIdx = items.findIndex(i => i.id === draggedId);
    const toIdx = items.findIndex(i => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedId(null); setDragOverId(null); return; }

    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((i, idx) => ({ ...i, display_order: idx }));
    setItems(updated);
    setDraggedId(null);
    setDragOverId(null);

    try {
      const supabase = createClient();
      for (const i of updated) {
        await supabase.from('provider_portfolio').update({ display_order: i.display_order }).eq('id', i.id);
      }
      onSave?.();
    } catch {
      loadPortfolio();
      toast.error('Erreur lors de la réorganisation');
    }
  }

  // ─── Drag upload zone ─────────────────────────────────────
  function handleUploadDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('text/html')) return;
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }

  function handleUploadDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length && !e.dataTransfer.types.includes('text/html')) {
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

  const isUploading = uploadingCount > 0;

  return (
    <div className="space-y-6">
      {/* ── Video preview modal ── */}
      {videoPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setVideoPreview(null)}
        >
          <button
            onClick={() => setVideoPreview(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors touch-manipulation"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <video
            src={videoPreview}
            controls
            autoPlay
            className="w-full max-h-[80vh] sm:max-h-[85vh] sm:max-w-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Zone de dépôt ── */}
      {items.length < maxImages && (
        <div
          onDragEnter={handleUploadDrag}
          onDragLeave={handleUploadDrag}
          onDragOver={handleUploadDrag}
          onDrop={handleUploadDrop}
          className={cn(
            'relative border border-dashed rounded-xl p-5 sm:p-4 text-center transition-all',
            dragActive
              ? 'bg-[#F5F0F7]/70 border-[#823F91] shadow-[0_2px_12px_rgba(130,63,145,0.2)]'
              : 'border-[#823F91]/30 bg-white/50',
            !isUploading && 'cursor-pointer hover:bg-[#F5F0F7]/40 hover:border-[#823F91]/50 active:bg-[#F5F0F7]/60',
            isUploading && 'opacity-60 pointer-events-none'
          )}
        >
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,video/mp4,video/webm,video/quicktime,video/mov"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || items.length >= maxImages}
          />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-[#823F91] animate-spin" />
                <p className="text-sm font-medium text-[#823F91]">
                  Upload en cours{uploadingCount > 1 ? ` (${uploadingCount} fichiers)` : ''}…
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  <span className="sm:hidden">Appuyez pour ajouter des fichiers</span>
                  <span className="hidden sm:inline">Glissez vos fichiers ici ou cliquez pour parcourir</span>
                </p>
                {/* Formats supportés — pills */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-0.5">
                  {[
                    { label: 'JPG / PNG', color: 'bg-blue-50 text-blue-600' },
                    { label: 'PDF', color: 'bg-red-50 text-red-600' },
                    { label: 'MP4 / WebM / MOV', color: 'bg-violet-50 text-violet-600' },
                  ].map(f => (
                    <span key={f.label} className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', f.color)}>
                      {f.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Photos & PDF max 10 MB · Vidéos max 200 MB · {items.length}/{maxImages}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Galerie ── */}
      {items.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">
            Galerie ({items.length} fichier{items.length > 1 ? 's' : ''})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => {
              const kind = item.file_type || (
                /\.(mp4|webm|mov)$/i.test(item.image_url) ? 'video' :
                item.image_url?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
              );
              const isVideo = kind === 'video';
              const isPdf = kind === 'pdf';

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={cn(
                    'relative group cursor-move',
                    dragOverId === item.id && 'ring-2 ring-[#823F91] ring-offset-2 rounded-xl',
                    draggedId === item.id && 'opacity-40'
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: draggedId === item.id ? 0.4 : 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* ── Bouton suppression ── */}
                    <button
                      onClick={(e) => handleDelete(item.id, item.image_path, e)}
                      className="absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full bg-[#1c1c1e] hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors shadow-md touch-manipulation"
                      aria-label="Supprimer"
                    >
                      <X className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </button>

                    <Card
                      className={cn(
                        'relative overflow-hidden border-2 border-transparent group-hover:border-[#823F91]/30 transition-colors',
                        isVideo ? 'aspect-video' : 'aspect-square'
                      )}
                    >
                      {isVideo ? (
                        // ── Vidéo ──
                        <button
                          type="button"
                          onClick={() => setVideoPreview(item.image_url)}
                          className="w-full h-full block relative bg-black"
                        >
                          <video
                            src={item.image_url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          {/* Overlay play */}
                          <div className="absolute inset-0 bg-black/30 sm:bg-black/25 sm:group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="h-11 w-11 sm:h-9 sm:w-9 rounded-full bg-white/90 flex items-center justify-center shadow-md sm:group-hover:scale-110 transition-transform">
                              <Play className="h-5 w-5 sm:h-4 sm:w-4 ml-0.5 text-gray-800" />
                            </div>
                          </div>
                          {/* Durée badge (coin bas-gauche) */}
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                            <Video className="h-2.5 w-2.5 text-white" />
                            <span className="text-[10px] text-white font-medium">Vidéo</span>
                          </div>
                        </button>
                      ) : isPdf ? (
                        // ── PDF ──
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150 transition-colors"
                        >
                          <FileText className="h-10 w-10 text-red-500 mb-1.5" />
                          <span className="text-[11px] font-medium text-red-600 px-2 text-center truncate max-w-full">
                            {item.title || 'Document PDF'}
                          </span>
                          <span className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1">
                            <ExternalLink className="h-2.5 w-2.5" />
                            Ouvrir
                          </span>
                        </a>
                      ) : (
                        // ── Image ──
                        <NextImage
                          src={item.image_url}
                          alt={item.title || 'Portfolio'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}

                      {/* Poignée drag (sauf vidéo qui a déjà un overlay) */}
                      {!isVideo && (
                        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center z-10 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="flex items-center justify-center gap-3 mb-3 opacity-40">
            <ImageIcon className="h-9 w-9" />
            <Video className="h-9 w-9" />
          </div>
          <p className="text-sm font-semibold">Portfolio vide</p>
          <p className="text-xs mt-1.5 opacity-70 max-w-[240px] mx-auto leading-relaxed">
            Ajoutez des photos, vidéos ou PDFs pour présenter votre travail
          </p>
        </div>
      )}
    </div>
  );
}
