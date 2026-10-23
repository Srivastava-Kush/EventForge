import React, { useState } from 'react';
import { User as UserIcon, Copy, Check, Sparkles, CheckCircle, Briefcase } from 'lucide-react';
import { eventService } from '../../services/event.service.js';

function ActionCard({ type, data, activeEventId }) {
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!activeEventId) {
      alert('Please open a specific event from your dashboard to apply this item.');
      return;
    }
    setLoading(true);
    try {
      if (type === 'ADD_TASK') {
        await eventService.createTask(activeEventId, {
          title: data.title || 'Recommended Task',
          phase: data.phase || 'Plan & book',
        });
      } else if (type === 'ADD_VENDOR') {
        await eventService.createVendor(activeEventId, {
          name: data.name || 'Recommended Vendor',
          priority: data.priority || 'recommended',
        });
      }
      setApplied(true);
      window.dispatchEvent(new CustomEvent('event-updated'));
    } catch (err) {
      alert(err.message || 'Failed to apply recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const isTask = type === 'ADD_TASK';

  return (
    <div className="action-recommendation-card my-2 p-2.5 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 overflow-hidden">
        {isTask ? (
          <CheckCircle size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
        ) : (
          <Briefcase size={16} className="text-secondary flex-shrink-0" aria-hidden="true" />
        )}
        <div className="text-xs">
          <span className="font-bold text-main block truncate">{data.title || data.name}</span>
          <span className="text-[10px] text-muted capitalize">
            {isTask ? `Task • ${data.phase || 'Plan & book'}` : `Vendor • ${data.priority || 'Recommended'}`}
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={applied || loading}
        onClick={handleApply}
        className={`btn btn-xs ${applied ? 'btn-success' : 'btn-primary'} flex items-center gap-1 font-semibold`}
      >
        {applied ? <Check size={12} /> : null}
        <span>{applied ? 'Applied!' : loading ? 'Adding...' : 'Apply to Event'}</span>
      </button>
    </div>
  );
}

export default function ChatMessage({ message, activeEventId = null }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Enhanced markdown / formatting helper for assistant messages
  const formatContent = (text) => {
    if (!text) return '';
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, pIdx) => {
      const trimmedPara = para.trim();

      // Check for Action Recommendation: [ACTION:ADD_TASK] { ... } or [ACTION:ADD_VENDOR] { ... }
      const actionMatch = trimmedPara.match(/^\[ACTION:(ADD_TASK|ADD_VENDOR)\]\s*(\{.*\})$/);
      if (actionMatch) {
        try {
          const actionType = actionMatch[1];
          const actionData = JSON.parse(actionMatch[2]);
          return (
            <ActionCard
              key={pIdx}
              type={actionType}
              data={actionData}
              activeEventId={activeEventId}
            />
          );
        } catch {
          // fallback to regular rendering
        }
      }

      // Check for headings (### Heading)
      if (trimmedPara.startsWith('### ')) {
        return (
          <h5 key={pIdx} className="chat-msg-heading text-xs font-bold text-accent mt-2 mb-1">
            {renderInline(trimmedPara.replace(/^###\s+/, ''))}
          </h5>
        );
      }
      if (trimmedPara.startsWith('## ')) {
        return (
          <h4 key={pIdx} className="chat-msg-heading text-sm font-bold text-primary mt-2.5 mb-1.5">
            {renderInline(trimmedPara.replace(/^##\s+/, ''))}
          </h4>
        );
      }

      // Check for blockquotes (> Quote)
      if (trimmedPara.startsWith('> ')) {
        return (
          <blockquote key={pIdx} className="chat-msg-quote my-2 pl-3 py-1 border-l-2 border-primary/50 text-xs text-muted italic bg-primary/5 rounded-r">
            {renderInline(trimmedPara.replace(/^>\s+/, ''))}
          </blockquote>
        );
      }

      // Check for standalone image: ![alt](url)
      const imgMatch = trimmedPara.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        return (
          <div key={pIdx} className="chat-msg-img-wrap my-2">
            <img
              src={src}
              alt={alt || 'Shared image'}
              className="chat-msg-img cursor-pointer"
              loading="lazy"
              onClick={() => window.open(src, '_blank')}
            />
            {alt && <span className="text-[10px] text-muted italic mt-1 block">{alt}</span>}
          </div>
        );
      }

      const lines = para.split('\n');
      const isList = lines.length > 0 && lines.every((line) => {
        const l = line.trim();
        return !l || l.startsWith('- ') || l.startsWith('* ') || l.startsWith('• ') || /^\d+\.\s/.test(l);
      });

      if (isList) {
        return (
          <ul key={pIdx} className="chat-msg-list my-2 space-y-1.5">
            {lines.filter((l) => l.trim()).map((line, lIdx) => {
              const isNumbered = /^\d+\.\s/.test(line.trim());
              const numberMatch = line.trim().match(/^(\d+)\.\s/);
              const clean = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
              return (
                <li key={lIdx} className="chat-msg-list-item flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
                  {isNumbered ? (
                    <span className="chat-msg-list-num flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center mt-0.5">
                      {numberMatch ? numberMatch[1] : lIdx + 1}
                    </span>
                  ) : (
                    <span className="chat-msg-list-bullet flex-shrink-0 text-primary font-bold text-sm leading-none mt-1">•</span>
                  )}
                  <span className="flex-1">{renderInline(clean)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <div key={pIdx} className="chat-msg-p mb-2 last:mb-0 text-xs sm:text-sm leading-relaxed">
          {lines.map((line, lIdx) => {
            const singleImgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
            if (singleImgMatch) {
              return (
                <div key={lIdx} className="chat-msg-img-wrap my-2">
                  <img
                    src={singleImgMatch[2]}
                    alt={singleImgMatch[1] || 'Shared image'}
                    className="chat-msg-img cursor-pointer"
                    loading="lazy"
                    onClick={() => window.open(singleImgMatch[2], '_blank')}
                  />
                  {singleImgMatch[1] && (
                    <span className="text-[10px] text-muted italic mt-0.5 block">{singleImgMatch[1]}</span>
                  )}
                </div>
              );
            }
            return (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </div>
      );
    });
  };

  // Parses inline formatting: **bold**, `code`
  const renderInline = (str) => {
    if (!str) return '';
    // Tokenize by `code` first, then **bold**
    const codeParts = str.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`') && cPart.length > 2) {
        return (
          <code key={cIdx} className="chat-msg-code font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/40 text-accent border border-accent/20">
            {cPart.slice(1, -1)}
          </code>
        );
      }

      const boldParts = cPart.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
          return (
            <strong key={`${cIdx}-${bIdx}`} className="font-bold text-main">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div className={`chat-message group ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="chat-avatar" aria-hidden="true">
        {isUser ? (
          <UserIcon size={14} />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      <div className="chat-bubble relative">
        <span className="sr-only">{isUser ? 'You said:' : 'AI Assistant said:'}</span>

        {/* Message body */}
        <div className="chat-content">
          {isUser ? (
            <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            formatContent(message.content)
          )}
        </div>

        {/* Footer with timestamp and quick copy */}
        <div className="chat-msg-footer flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/10 text-[10px] text-faint">
          <span className="chat-timestamp">
            {message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>

          {!isUser && (
            <button
              type="button"
              className="copy-msg-btn text-muted hover:text-white transition flex items-center gap-1 opacity-0 group-hover:opacity-100"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check size={11} className="text-success" />
                  <span className="text-success text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
