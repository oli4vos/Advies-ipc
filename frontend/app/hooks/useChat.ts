import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'ai' | 'expert'
  content: string
  timestamp: Date
  metadata?: {
    tokens_used?: number
    cost_usd?: number
    model?: string
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          question: content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'content') {
                aiMessage.content += parsed.content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessage.id 
                      ? { ...msg, content: aiMessage.content }
                      : msg
                  )
                )
              } else if (parsed.type === 'metadata') {
                aiMessage.metadata = {
                  tokens_used: parsed.tokens_used,
                  cost_usd: parsed.cost_usd,
                  model: parsed.model,
                }
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessage.id 
                      ? { ...msg, metadata: aiMessage.metadata }
                      : msg
                  )
                )
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }

      toast.success('Antwoord ontvangen')
    } catch (err) {
      console.error('Chat error:', err)
      setError('Er is een fout opgetreden bij het versturen van je bericht')
      toast.error('Fout bij versturen bericht')
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

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const result = await response.json()
      toast.success('Bestand succesvol geüpload')
      
      // Add file message to chat
      const fileMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `📎 ${file.name} geüpload`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, fileMessage])
    } catch (err) {
      console.error('File upload error:', err)
      toast.error('Fout bij uploaden bestand')
    }
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
