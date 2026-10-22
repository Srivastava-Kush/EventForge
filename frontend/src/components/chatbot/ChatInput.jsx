import React, { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';

const QUICK_PROMPTS = [
  'Budget optimization tips',
  '2-month timeline checklist',
  'Mocktail menu suggestions',
  'Vendor interview questions',
];

export default function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (disabled) return;
    onSendMessage(prompt);
  };

  return (
    <div className="chat-input-container">
      {/* Quick Prompt Pills */}
      <div className="chat-quick-prompts-row flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-faint flex items-center gap-1 flex-shrink-0">
          <Sparkles size={10} className="text-primary" /> Ideas:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="chat-quick-pill whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-bg-card border border-subtle text-muted hover:text-white hover:border-primary transition"
            onClick={() => handleQuickPrompt(prompt)}
            disabled={disabled}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field with Integrated Send Button */}
      <form className="chat-input-form relative flex items-center gap-2" onSubmit={handleSubmit} aria-label="Send message to AI assistant">
        <div className="relative flex-1">
          <input
            type="text"
            className="chat-input-field w-full pr-8 pl-4 py-2.5 text-xs sm:text-sm bg-bg-input border border-subtle rounded-xl text-main placeholder-faint focus:border-primary focus:shadow-glow outline-none transition"
            placeholder="Ask anything about budgets, vendors, or timelines..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={2000}
            aria-label="Message the AI Event Assistant"
          />

          {text && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white p-1"
              onClick={() => setText('')}
              title="Clear text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className={`chat-send-btn p-2.5 rounded-xl flex items-center justify-center transition shadow-md ${
            text.trim() && !disabled
              ? 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 shadow-glow'
              : 'bg-bg-elevated text-faint cursor-not-allowed border border-subtle'
          }`}
          disabled={!text.trim() || disabled}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
      <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-faint">
        <span>Powered by Google Gemini</span>
        <span>Enter ↵ to send</span>
      </div>
    </div>
  );
}
