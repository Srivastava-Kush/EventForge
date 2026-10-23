import { useEffect, useState } from 'react';
import { chatService } from '../services/chat.service.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    chatService
      .getHistory()
      .then((res) => {
        if (mounted && res?.data?.messages) {
          setMessages(res.data.messages);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Could not load chat history');
        }
      })
      .finally(() => {
        if (mounted) setHistoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sendMessage = async (content, eventId = null) => {
    if (!content || !content.trim()) return;

    const trimmed = content.trim();
    const tempUserMsg = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);
    setError('');

    try {
      const res = await chatService.sendMessage(trimmed, eventId);
      const assistantMsg = {
        role: 'assistant',
        content: res.data?.reply || '',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to send message');
      // Remove temporary message on failure or keep it with error indication
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    historyLoading,
    error,
    sendMessage,
  };
}

export default useChat;
