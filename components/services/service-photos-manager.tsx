'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, ImagePlus, Images, Trash2, UploadCloud } from 'lucide-react'
import {
  useDeleteServiceAttachment,
  useServiceAttachments,
  useUploadServiceAttachment,
} from '@/hooks/use-services-query'
import { useToast } from '@/hooks/use-toast'
import type { PendingServicePhoto } from '@/types/service.types'

interface ServicePhotosManagerProps {
  serviceId?: string | null
  pendingPhotos: PendingServicePhoto[]
  onPendingPhotosChange: (photos: PendingServicePhoto[]) => void
}

async function compressImage(file: File) {
  if (!file.type.startsWith('image/')) return file

  const imageUrl = URL.createObjectURL(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageUrl
  })

  const maxSize = 1600
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    URL.revokeObjectURL(imageUrl)
    return file
  }

  context.drawImage(image, 0, 0, width, height)
  URL.revokeObjectURL(imageUrl)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.72)
  )

  if (!blob) return file

  const name = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ServicePhotosManager({
  serviceId,
  pendingPhotos,
  onPendingPhotosChange,
}: ServicePhotosManagerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const { success, error: showError } = useToast()
  const attachments = useServiceAttachments(serviceId)
  const uploadAttachment = useUploadServiceAttachment(serviceId)
  const deleteAttachment = useDeleteServiceAttachment(serviceId)

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setIsPreparing(true)
    try {
      const photos = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file)
          return {
            id: crypto.randomUUID(),
            file: compressed,
            previewUrl: URL.createObjectURL(compressed),
            caption: '',
          }
        })
      )

      if (serviceId) {
        for (const photo of photos) {
          await uploadAttachment.mutateAsync({ file: photo.file })
          URL.revokeObjectURL(photo.previewUrl)
        }
        success('Fotos adicionadas!', 'As fotos foram anexadas ao documento.')
      } else {
        onPendingPhotosChange([...pendingPhotos, ...photos])
      }
    } catch (err) {
      showError('Erro ao preparar foto', err instanceof Error ? err.message : 'Tente novamente.')
    } finally {
      setIsPreparing(false)
    }
  }

  const removePendingPhoto = (photoId: string) => {
    const photo = pendingPhotos.find((item) => item.id === photoId)
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    onPendingPhotosChange(pendingPhotos.filter((item) => item.id !== photoId))
  }

  const updatePendingCaption = (photoId: string, caption: string) => {
    onPendingPhotosChange(
      pendingPhotos.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo))
    )
  }

  const existingPhotos = attachments.data ?? []
  const isBusy = isPreparing || uploadAttachment.isPending || deleteAttachment.isPending
  const totalPhotos = existingPhotos.length + pendingPhotos.length

  return (
    <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-4 w-4 text-primary" />
            Fotos do veiculo e servico
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a camera do celular ou selecione imagens da galeria. As fotos sao comprimidas antes
            do envio.
          </p>
        </div>
        <Badge variant="outline">{totalPhotos} foto(s)</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-md border border-dashed bg-background p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Images className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Adicionar registros visuais</div>
                <div className="text-sm text-muted-foreground">
                  Ideal para entrada, diagnostico, pecas substituidas e entrega.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFiles}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Galeria
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-background p-4 text-sm">
          <div className="font-semibold">Boas praticas</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>Entrada do veiculo</li>
            <li>Defeito encontrado</li>
            <li>Peca substituida</li>
            <li>Entrega final</li>
          </ul>
        </div>
      </div>

      {!serviceId && pendingPhotos.length > 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          As fotos serao enviadas automaticamente depois que o documento for salvo.
        </p>
      )}

      {isBusy && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UploadCloud className="h-4 w-4" />
          Processando fotos...
        </p>
      )}

      {totalPhotos === 0 ? (
        <div className="rounded-md border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          Nenhuma foto anexada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {existingPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-md border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || photo.fileName || 'Foto do servico'}
                className="aspect-square w-full object-cover"
              />
              <div className="border-t p-2 text-xs text-muted-foreground">
                <div className="truncate">{photo.caption || photo.fileName || 'Foto anexada'}</div>
                <div>{formatFileSize(photo.size)}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 bg-white/90"
                disabled={isBusy}
                onClick={() => deleteAttachment.mutate(photo.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          {pendingPhotos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-md border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.previewUrl} alt="" className="aspect-square w-full object-cover" />
              <div className="space-y-2 border-t p-2">
                <Input
                  value={photo.caption || ''}
                  placeholder="Legenda da foto"
                  onChange={(event) => updatePendingCaption(photo.id, event.target.value)}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(photo.file.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isBusy}
                    onClick={() => removePendingPhoto(photo.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
