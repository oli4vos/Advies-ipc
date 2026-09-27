import { UserIcon, CpuChipIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { ChatMessageRecord } from '../lib/chat-model'

interface ChatMessageProps {
  message: ChatMessageRecord
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAI = message.role === 'ai'
  const isExpert = message.role === 'expert'

  const getIcon = () => {
    if (isUser) {
      return <UserIcon className="h-5 w-5 text-white" />
    } else if (isAI) {
      return <CpuChipIcon className="h-5 w-5 text-white" />
    } else {
      return <UserGroupIcon className="h-5 w-5 text-white" />
    }
  }

  const getIconBg = () => {
    if (isUser) {
      return 'bg-blue-600'
    } else if (isAI) {
      return 'bg-gray-600'
    } else {
      return 'bg-green-600'
    }
  }

  const getMessageBg = () => {
    if (isUser) {
      return 'bg-blue-600 text-white'
    } else if (isAI) {
      return 'bg-white text-gray-900 border border-gray-200'
    } else {
      return 'bg-green-50 text-green-900 border border-green-200'
    }
  }

  const getAlignment = () => {
    if (isUser) {
      return 'justify-end'
    } else {
      return 'justify-start'
    }
  }

  return (
    <div className={`flex ${getAlignment()}`}>
      <div className={`flex items-start space-x-3 max-w-4xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getIconBg()}`}>
              {getIcon()}
            </div>
          </div>
        )}

        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
          <div className={`rounded-lg px-4 py-3 shadow-sm ${getMessageBg()}`}>
            <div className="prose prose-sm max-w-none">
              {message.content.startsWith('📎') ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📎</span>
                  <span>{message.content.replace('📎 ', '')}</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>

          <div className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : ''}`}>
            {format(message.timestamp, 'HH:mm', { locale: nl })}
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getIconBg()}`}>
              {getIcon()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
