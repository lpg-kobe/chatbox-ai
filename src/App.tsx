// 这个是基础版, 可以自由切换apiKey
import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Box,
  IconButton
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const ChatInterface = () => {
  const [apiKey, setApiKey] = useState<string>('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [showApiKeyForm, setShowApiKeyForm] = useState(true)

  const handleSubmitApiKey = () => {
    if (apiKey.trim()) {
      setShowApiKeyForm(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: input.trim() }]
    setInput('')
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          // lpgkobe => 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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Chat Interface'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: newMessages,
          temperature: 0.7
        })
      })

      if (!response.ok) throw new Error('API请求失败')

      const data = await response.json()
      const aiMessage = data.choices[0].message.content

      setMessages([...newMessages, { role: 'assistant', content: aiMessage }])
    } catch (error) {
      console.error(error)
      alert('请求出错，请检查API Key或网络连接')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">ChatBox AI</Typography>
        </Toolbar>
      </AppBar>

      {showApiKeyForm ? (
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
      ) : (
        <>
          <List sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'background.default'
          }}>
            {messages.map((msg, index) => (
              <ListItem key={index} sx={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                my: 1
              }}>
                {msg.role === 'assistant' && (
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
                  </ListItemAvatar>
                )}
                <ListItemText
                  primary={msg.content}
                  sx={{
                    maxWidth: '70%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                    color: msg.role === 'user' ? 'common.white' : 'text.primary',
                    p: 2,
                    borderRadius: 2,
                    ml: msg.role === 'user' ? 'auto' : 0
                  }}
                />
                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: 'grey.500', ml: 2 }}>U</Avatar>
                )}
              </ListItem>
            ))}
            {loading && (
              <ListItem sx={{ justifyContent: 'flex-start' }}>
                <CircularProgress size={24} />
              </ListItem>
            )}
          </List>

          <Box sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <TextField
              fullWidth
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    color="primary"
                  >
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </>
      )}
    </div>
  )
}

export default ChatInterface