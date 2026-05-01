'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText } from 'lucide-react'
import { formatFileSize } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface CorpseUploadZoneProps {
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  maxFiles?: number
  maxSizeMB?: number
}

export default function CorpseUploadZone({
  files,
  onAdd,
  onRemove,
  maxFiles = 10,
  maxSizeMB = 50,
}: CorpseUploadZoneProps) {
  const [hoveredRemoveButton, setHoveredRemoveButton] = useState<number | null>(null)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = maxFiles - files.length
      onAdd(accepted.slice(0, remaining))
    },
    [files.length, maxFiles, onAdd]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: true,
  })

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-10 text-center cursor-pointer',
          'transition-all duration-300 overflow-hidden group',
          isDragActive ? 'border-amber-600/70 bg-amber-600/6' : 'border-bureau-glass bg-bureau-glass'
        )}
      >
        <input {...getInputProps()} aria-label="Upload project files" />

        {/* Corner grain */}
        <div aria-hidden="true" className="absolute inset-0 grain pointer-events-none opacity-50" />

        {/* Coffin lid visual */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <motion.div
            animate={isDragActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'border border-bureau-glass',
              isDragActive ? 'bg-amber-600/15' : 'bg-bureau-glass'
            )}
          >
            <Upload
              size={20}
              className={isDragActive ? 'text-amber-600' : 'text-bureau-muted'}
            />
          </motion.div>

          <div>
            <p
              className={cn('font-sans text-sm font-medium mb-1', isDragActive ? 'text-amber-600' : 'text-bureau-text')}
            >
              {isDragActive ? 'Drop the remains here…' : 'Drag files, or click to browse'}
            </p>
            <p className="font-sans text-xs text-bureau-dim">
              Any file type · Max {maxSizeMB}MB each · Up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      <AnimatePresence initial={false}>
        {files.map((file, i) => (
          <motion.div
            key={`${file.name}-${i}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded bg-bureau-elevated border-bureau-glass border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={14} className="text-bureau-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-sans text-xs truncate text-bureau-text">
                    {file.name}
                  </p>
                  <p className="font-sans text-[10px] text-bureau-dim">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className={cn(
                  'p-1 rounded transition-colors flex-shrink-0 cursor-pointer',
                  hoveredRemoveButton === i ? 'text-red-400' : 'text-bureau-dim'
                )}
                onMouseEnter={() => setHoveredRemoveButton(i)}
                onMouseLeave={() => setHoveredRemoveButton(null)}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <p className="text-center font-sans text-xs text-bureau-dim">
          No files? That&apos;s okay. Even a description is worth preserving.
        </p>
      )}
    </div>
  )
}
