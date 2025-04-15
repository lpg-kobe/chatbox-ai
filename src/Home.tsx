// 升级版
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  styled,
  keyframes,
  Container,
  Button
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { green, grey, blue } from '@mui/material/colors'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const streamAnimation = keyframes`
  from { opacity: 0.3; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
`

const ChatContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.mode === 'dark' ? grey[900] : '#ffffff',
  [theme.breakpoints.down('sm')]: {
    '& .message-content': {
      maxWidth: '90%'
    }
  }
}))

const MessageBubble = styled(Box)(({ theme, role }) => ({
  maxWidth: '80%',
  padding: '12px 16px',
  borderRadius: role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
  backgroundColor: role === 'user'
    ? (theme.palette.mode === 'dark' ? blue[700] : blue[500])
    : (theme.palette.mode === 'dark' ? grey[800] : grey[100]),
  color: role === 'user' ? '#fff' : theme.palette.text.primary,
  fontSize: '0.875rem',
  lineHeight: 1.5,
  animation: `${streamAnimation} 0.3s ease`,
  boxShadow: theme.shadows[1],
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  '&.streaming::after': {
    content: '"▋"',
    animation: `${streamAnimation} 1s infinite`,
    marginLeft: 4
  }
}))

const ChatInterface = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<AbortController>(null)
  const [apiKey, setApiKey] = useState<string>('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')
  const [showApiKeyForm, setShowApiKeyForm] = useState(true)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSubmitApiKey = () => {
    if (apiKey.trim()) {
      setShowApiKeyForm(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const newMessage: Message = {
      role: 'user',
      content: input.trim()
    }

    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      isStreaming: true
    }

    setMessages(prev => [...prev, newMessage, newAssistantMessage])
    setInput('')
    setLoading(true)

    try {
      controllerRef.current = new AbortController()
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Chat Interface'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [...messages, newMessage],
          stream: true,
          temperature: 0.7
        }),
        signal: controllerRef.current.signal
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream reader not available')

      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          try {
            const res = line.slice(6)
            if (res === '[DONE]') {
              break
            }
            const data = JSON.parse(res)
            const content = data.choices[0]?.delta?.content || ''
            result += content

            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: result }
                ]
              }
              return prev
            })
          } catch (e) {
            console.error('Error parsing stream data:', e)
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
    } finally {
      setLoading(false)
      setMessages(prev => prev.map(msg =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ))
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return (
    <ChatContainer>
      <AppBar position="sticky">
        <Toolbar variant="dense">
          <Typography variant="h6" fontWeight={600}>
            ChatBox AI - create by pika see https://github.com/lpg-kobe/raising-pigs
          </Typography>
        </Toolbar>
      </AppBar>

      {
        showApiKeyForm ? (
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <TextField
              fullWidth
              label="OpenRouter API Key"
              variant="outlined"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitApiKey}
              disabled={!apiKey.trim()}
            >
              开始聊天
            </Button>
          </Container>
        ) : <>
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start'
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: green[500], mt: 0.5 }}>
                    GPT
                  </Avatar>
                )}

                <MessageBubble
                  role={msg.role}
                  className={msg.isStreaming ? 'streaming' : ''}
                >
                  {msg.content}
                  {!msg.content && <Box component="span" sx={{ opacity: 0.5 }}>...</Box>}
                </MessageBubble>

                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: blue[600], mt: 0.5 }}>
                    U
                  </Avatar>
                )}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 2,
            boxShadow: 3
          }}>
            <Box sx={{
              maxWidth: '48rem',
              mx: 'auto',
              position: 'relative'
            }}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={8}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="发送消息..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 6,
                    backgroundColor: 'background.paper',
                    pr: 6,
                    fontSize: '0.875rem'
                  }
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={loading || !input.trim()}
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  color: loading ? grey[400] : blue[600]
                }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Box>
        </>
      }
    </ChatContainer>
  )
}

export default ChatInterface