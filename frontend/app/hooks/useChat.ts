import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  createCase,
  hasLocalApi,
  uploadCaseAttachment,
  type ApiCase,
} from '../lib/api'
import type { ChatMessageRecord } from '../lib/chat-model'

function routeCheckSummary(result: ApiCase) {
  const unresolvedIssues = result.issues.filter(
    (issue) => issue.resolution_status !== 'RESOLVED',
  ).length
  const openPoints = unresolvedIssues
    ? `Er staan nog ${unresolvedIssues} punt${unresolvedIssues === 1 ? '' : 'en'} open voor beoordeling.`
    : 'Er zijn op dit moment geen open punten in de eerste structurering.'

  return [
    'Uw eerste beoordeling is opgeslagen.',
    '',
    `Onderwerp: ${result.category}`,
    `Samenvatting: ${result.summary}`,
    openPoints,
    '',
    'Controleer de geordende vraag. De tekst van AI is een concept en geen definitief belastingadvies.',
  ].join('\n')
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCaseCode, setCreatedCaseCode] = useState<string | null>(null)
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

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
              'Dit is de publieke proefversie. Gebruik uitsluitend fictieve gegevens. In de lokale versie wordt uw verhaal via één centrale werkwijze geordend; op GitHub Pages wordt niets doorgestuurd.',
            timestamp: new Date(),
          },
        ])
        toast.success('Eerste beoordeling uitgevoerd')
        return
      }

      const result = await createCase({
        title: 'Vrije vraag voor eerste beoordeling',
        description: content.trim(),
        question: content.trim(),
        category: 'Weet ik niet',
        tax_year: 'Weet ik niet',
        client_type: 'Weet ik niet',
        urgency: 'Normaal',
        external_ai_answer: '',
      })
      setCreatedCaseCode(result.public_code)
      setActiveCaseId(result.id)

      if (pendingFile) {
        try {
          const attachment = await uploadCaseAttachment(result.id, pendingFile)
          setMessages(previous => [
            ...previous,
            {
              id: `${Date.now()}-attachment`,
              role: 'ai',
              content: `Document ${attachment.original_name} is lokaal gecontroleerd en veilig opgeslagen. Uitkomst van de veiligheidscontrole: ${attachment.scan_status}.`,
              timestamp: new Date(),
            },
          ])
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : 'Het document kon niet veilig worden opgeslagen.',
          )
          toast.error('Documentcontrole mislukt')
        } finally {
          setPendingFile(null)
        }
      }

      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-routecheck`,
          role: 'ai',
          content: routeCheckSummary(result),
          timestamp: new Date(),
        },
      ])
      toast.success('Eerste beoordeling opgeslagen')
    } catch (err) {
      console.error('Routecheck error:', err)
      setError('De eerste beoordeling kon niet worden opgeslagen. Probeer het opnieuw.')
      toast.error('Eerste beoordeling mislukt')
    } finally {
      setIsLoading(false)
    }
  }, [pendingFile])

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

    if (!hasLocalApi()) {
      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-file`,
          role: 'user',
          content: `Document: ${file.name} geselecteerd. In de publieke proefversie wordt dit bestand niet doorgestuurd.`,
          timestamp: new Date(),
        },
      ])
      toast.success('Demo-bestand geselecteerd')
      return
    }

    if (!activeCaseId) {
      setPendingFile(file)
      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-file`,
          role: 'user',
          content: `Document: ${file.name} staat klaar. Verstuur eerst uw belastingvraag; daarna controleert de lokale veiligheidscontrole het document.`,
          timestamp: new Date(),
        },
      ])
      toast.success('Document klaar om te verzenden')
      return
    }

    try {
      const attachment = await uploadCaseAttachment(activeCaseId, file)
      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-file`,
          role: 'ai',
          content: `Document ${attachment.original_name} is lokaal gecontroleerd en veilig opgeslagen. Uitkomst van de veiligheidscontrole: ${attachment.scan_status}.`,
          timestamp: new Date(),
        },
      ])
      toast.success('Document veilig opgeslagen')
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Het document kon niet veilig worden opgeslagen.',
      )
      toast.error('Documentcontrole mislukt')
    }
  }, [activeCaseId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setCreatedCaseCode(null)
    setActiveCaseId(null)
    setPendingFile(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    uploadFile,
    clearMessages,
    createdCaseCode,
  }
}
