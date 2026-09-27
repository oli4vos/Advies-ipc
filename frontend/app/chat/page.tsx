'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import { Toaster } from 'react-hot-toast'
import { useChat } from '../hooks/useChat'
import { ChatMessage } from '../components/ChatMessage'
import { FileUpload } from '../components/FileUpload'
import { LoadingDots } from '../components/LoadingDots'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    sendMessage,
    uploadFile,
    error
  } = useChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      await uploadFile(file)
    } catch (error) {
      console.error('File upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <CpuChipIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Routecheck belastingvraag</h1>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span>•</span>
              <span>Gratis eerste structurering</span>
              <span>•</span>
              <span>Menselijke controle beschikbaar</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileUpload onUpload={handleFileUpload} disabled={isUploading} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <CpuChipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welkom bij AI Check Advies
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Leg je belastingvraag voor aan de routecheck. In de lokale MVP wordt je verhaal gestructureerd door dezelfde casusflow als de hoofdapp. Op GitHub Pages wordt niets doorgestuurd.
            </p>
            <div className="mt-6 space-y-2">
              <div className="text-sm text-gray-400">
                Voorbeelden van vragen:
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                  "Ik twijfel over de btw op een online training."
                </div>
                <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                  "Welke informatie ontbreekt voor een goede beoordeling?"
                </div>
                <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                  "Ik heb al een AI-antwoord, maar wil menselijke controle."
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <CpuChipIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <LoadingDots />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                <CpuChipIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-800 text-sm">
                  Er is een fout opgetreden. Probeer het opnieuw.
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Stel je belastingvraag..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Verstuur</span>
          </button>
        </form>

        <div className="mt-3 text-xs text-gray-500">
          <p>
            <strong>Disclaimer:</strong> Dit is een routecheck en geen zelfstandig belastingadvies. Een definitief antwoord vereist controle door een passende specialist. Bestanden worden in deze versie niet geüpload.
          </p>
        </div>
      </div>
    </div>
  )
}
