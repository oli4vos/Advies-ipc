import { useState, useRef } from 'react'
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'

interface FileUploadProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function FileUpload({ onUpload, disabled = false }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (disabled) return

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum 20MB.')
      return
    }

    // Validate file type
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      alert('Bestandstype niet ondersteund. Gebruik PDF, DOC, DOCX of TXT.')
      return
    }

    onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
    // Reset input value
    e.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`p-2 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Upload document (PDF, DOC, DOCX, TXT)"
      >
        <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </>
  )
}