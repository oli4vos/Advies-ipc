import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { createCase, hasLocalApi, type ApiCase } from '../lib/api'
import type { ChatMessageRecord } from '../lib/chat-model'

function routeCheckSummary(result: ApiCase) {
  const unresolvedIssues = result.issues.filter(
    (issue) => issue.resolution_status !== 'RESOLVED',
  ).length
  const openPoints = unresolvedIssues
    ? `Er staan nog ${unresolvedIssues} punt${unresolvedIssues === 1 ? '' : 'en'} open voor beoordeling.`
    : 'Er zijn op dit moment geen open punten in de eerste structurering.'

  return [
    'Uw routecheck is opgeslagen.',
    '',
    `Onderwerp: ${result.category}`,
    `Samenvatting: ${result.summary}`,
    openPoints,
    '',
    'Controleer de gestructureerde intake. AI-output is een concept en geen definitief belastingadvies.',
  ].join('\n')
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessageRecord = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      if (!hasLocalApi()) {
        setMessages(previous => [
          ...previous,
          {
            id: `${Date.now()}-demo`,
            role: 'ai',
            content:
              'Dit is de publieke demo. Gebruik uitsluitend fictieve gegevens. In de lokale MVP wordt uw verhaal via de centrale FastAPI-casusflow gestructureerd; op GitHub Pages wordt niets doorgestuurd.',
            timestamp: new Date(),
          },
        ])
        toast.success('Demo-routecheck uitgevoerd')
        return
      }

      const result = await createCase({
        title: 'Vrije intake via routecheck',
        description: content.trim(),
        question: content.trim(),
        category: 'Weet ik niet',
        tax_year: 'Weet ik niet',
        client_type: 'Weet ik niet',
        urgency: 'Normaal',
        external_ai_answer: '',
      })

      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-routecheck`,
          role: 'ai',
          content: routeCheckSummary(result),
          timestamp: new Date(),
        },
      ])
      toast.success('Routecheck opgeslagen')
    } catch (err) {
      console.error('Routecheck error:', err)
      setError('De routecheck kon niet worden opgeslagen. Probeer het opnieuw.')
      toast.error('Routecheck mislukt')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximum 20MB.')
      return
    }

    // Validate file type
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      toast.error('Bestandstype niet ondersteund. Gebruik PDF, DOC, DOCX of TXT.')
      return
    }

    setMessages(previous => [
      ...previous,
      {
        id: `${Date.now()}-file`,
        role: 'user',
        content: `📎 ${file.name} geselecteerd. Het bestand wordt in deze versie niet geüpload.`,
        timestamp: new Date(),
      },
    ])
    toast.success('Bestand lokaal geselecteerd')
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    uploadFile,
    clearMessages,
  }
}
