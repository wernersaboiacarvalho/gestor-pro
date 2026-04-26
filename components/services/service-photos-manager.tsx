'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
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

  const existingPhotos = attachments.data ?? []
  const isBusy = isPreparing || uploadAttachment.isPending || deleteAttachment.isPending

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-4 w-4" />
            Fotos do veiculo/servico
          </Label>
          <p className="text-xs text-muted-foreground">
            As imagens sao reduzidas antes do envio para deixar o PDF leve.
          </p>
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
            size="sm"
            disabled={isBusy}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Camera
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Galeria
          </Button>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {existingPhotos.map((photo) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-md border bg-white">
            <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
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
          <div key={photo.id} className="relative overflow-hidden rounded-md border bg-white">
            <img src={photo.previewUrl} alt="" className="aspect-square w-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 bg-white/90"
              disabled={isBusy}
              onClick={() => removePendingPhoto(photo.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
