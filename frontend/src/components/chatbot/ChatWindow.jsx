import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Bot,
  HelpCircle,
  Calendar,
  DollarSign,
  Compass,
} from 'lucide-react';
import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';
import Loader from '../common/Loader.jsx';
import { useChat } from '../../hooks/useChat.js';
import { useLocation } from 'react-router-dom';

const STARTER_CARDS = [
  {
    icon: DollarSign,
    color: 'text-accent',
    title: 'Cut Budget Costs',
    prompt: 'How can I trim 10-15% from my event budget without compromising guest experience?',
  },
  {
    icon: Calendar,
    color: 'text-primary',
    title: 'Timeline Checklist',
    prompt: 'What are the top 5 urgent milestones I should focus on 2 months prior to my event?',
  },
  {
    icon: Compass,
    color: 'text-secondary',
    title: 'Theme & Decor Ideas',
    prompt: 'Suggest unique atmospheric decor and interactive activity ideas tailored to my event setting.',
  },
  {
    icon: HelpCircle,
    color: 'text-warning',
    title: 'Vendor Negotiation',
    prompt: 'What key questions and payment terms should I negotiate with catering and venue vendors?',
  },
];

export default function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, loading, historyLoading, error, sendMessage } = useChat();
  const location = useLocation();
  const match = location.pathname.match(/^\/events\/([a-zA-Z0-9]+)/);
  const activeEventId = match ? match[1] : null;
  const messagesEndRef = useRef(null);
  const fabRef = useRef(null);

  const handleSendMessage = (text) => {
    sendMessage(text, activeEventId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Accessibility: Close with Escape key and return focus to FAB
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setTimeout(() => fabRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="chat-widget-root">
      {!isOpen ? (
        <button
          ref={fabRef}
          type="button"
          className="chat-fab group flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-bold shadow-2xl transition-all duration-300 hover:scale-105"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-controls="chat-dialog-window"
          aria-label="Open AI Event Assistant"
        >
          <div className="relative">
            <Sparkles size={18} className="chat-fab-sparkle text-yellow-300 animate-pulse" aria-hidden="true" />
          </div>
          <span className="chat-fab-label tracking-wide">Ask Event AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
        </button>
      ) : (
        <div
          role="dialog"
          id="chat-dialog-window"
          aria-label="AI Event Concierge"
          aria-modal="false"
          className={`chat-window-container shadow-2xl border border-card flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'chat-window-minimized' : ''
          }`}
        >
          {/* Glassmorphic Header */}
          <div className="chat-header px-4 py-3 bg-bg-elevated/95 backdrop-blur-md border-b border-subtle flex items-center justify-between">
            <div className="chat-header-info flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-sm">
                <Bot size={18} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="chat-title text-sm font-bold text-main">Event AI Concierge</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald font-semibold bg-emerald/10 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald" /> Online
                  </span>
                </div>
                <span className="chat-status-indicator text-[11px] text-muted block">
                  {activeEventId ? '⚡ Grounded in active event' : 'Context-aware of your saved events'}
                </span>
              </div>
            </div>

            <div className="chat-header-actions flex items-center gap-1">
              <button
                type="button"
                className="btn-icon p-1.5 text-muted hover:text-white rounded-lg hover:bg-hover transition"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Expand AI Event Assistant' : 'Minimize AI Event Assistant'}
              >
                {isMinimized ? <Maximize2 size={15} aria-hidden="true" /> : <Minimize2 size={15} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="btn-icon p-1.5 text-muted hover:text-error rounded-lg hover:bg-hover transition"
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => fabRef.current?.focus(), 50);
                }}
                aria-label="Close AI Event Assistant"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message scroll area */}
              <div
                className="chat-messages-area flex-1 overflow-y-auto p-4 space-y-3.5 bg-bg-main/90"
                role="log"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="additions text"
              >
                {historyLoading ? (
                  <div className="py-8">
                    <Loader text="Loading your chat history..." />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state text-center py-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3 shadow-glow">
                      <Sparkles size={24} className="text-primary" aria-hidden="true" />
                    </div>
                    <h5 className="font-bold text-sm text-main mb-1">How can I help plan your event?</h5>
                    <p className="text-xs text-muted max-w-xs mx-auto mb-5 leading-relaxed">
                      I have full context of your event plans, budgets, vendors, and timeline. Ask me anything or tap a prompt:
                    </p>

                    {/* Starter prompt cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {STARTER_CARDS.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="chat-starter-card group"
                            onClick={() => sendMessage(card.prompt)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Icon size={13} className={card.color} />
                                <span className="font-semibold text-xs text-main group-hover:text-primary transition">
                                  {card.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-faint group-hover:text-primary group-hover:translate-x-0.5 transition-transform">
                                →
                              </span>
                            </div>
                            <p className="text-[11px] text-faint line-clamp-2 leading-tight">
                              {card.prompt}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} activeEventId={activeEventId} />
                  ))
                )}

                {/* Gemini typing wave indicator */}
                {loading && (
                  <div className="chat-typing-row flex items-center gap-2 text-xs text-muted py-1" role="status">
                    <div className="w-6 h-6 rounded-md bg-primary-dim flex items-center justify-center">
                      <Sparkles size={12} className="text-primary animate-spin" />
                    </div>
                    <span className="text-[11px] font-medium text-faint">Gemini is formulating advice...</span>
                    <div className="chat-typing-dots flex items-center gap-1">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="chat-error-notice alert alert-error text-xs py-2 px-3 rounded-lg" role="alert">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="chat-input-wrapper p-3 bg-bg-elevated/95 backdrop-blur-md border-t border-subtle">
                <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
