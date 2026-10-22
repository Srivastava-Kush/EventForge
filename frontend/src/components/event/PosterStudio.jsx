import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  Download,
  BookmarkPlus,
  RefreshCw,
  Trash2,
  Eye,
  Check,
  ImageIcon,
} from 'lucide-react';
import { eventService } from '../../services/event.service.js';

/**
 * Sanitizes and normalizes SVG markup so it scales responsively and cannot execute malicious script payloads.
 */
function formatSvgPoster(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  if (!rawSvg.includes('<svg')) return '';

  let sanitized = rawSvg
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon[a-z]+\s*=[^\s>]+/gi, '')
    .replace(/\b(?:href|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, '');

  return sanitized.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let cleanAttrs = attrs
      .replace(/\bwidth="[^"]*"/gi, '')
      .replace(/\bheight="[^"]*"/gi, '')
      .replace(/\bpreserveAspectRatio="[^"]*"/gi, '');
    if (!/viewBox=/i.test(cleanAttrs)) {
      cleanAttrs += ' viewBox="0 0 800 1120"';
    }
    return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"${cleanAttrs}>`;
  });
}

export default function PosterStudio({
  eventId,
  eventData,
  posters = [],
  onSavePoster,
  onDeletePoster,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form parameters initialized directly from eventData
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [title, setTitle] = useState(() => {
    const summary = eventData?.plan?.summary || {};
    const input = eventData?.input || {};
    return summary.eventName || input.eventName || `${eventData?.type || 'Celebration'} Party`;
  });
  const [subtitle, setSubtitle] = useState(() => eventData?.input?.vibe || 'Join us for an unforgettable celebration');
  const [date, setDate] = useState(() => {
    const summary = eventData?.plan?.summary || {};
    const input = eventData?.input || {};
    return summary.date || input.date || '';
  });
  const [location, setLocation] = useState(() => {
    const input = eventData?.input || {};
    return input.setting ? `${input.setting} Venue` : 'Grand Celebration Grounds';
  });
  const [customPrompt, setCustomPrompt] = useState('');

  // Generated preview (supports both raster image base64 data URLs and SVG vector artwork)
  const [engine, setEngine] = useState('flux'); // 'flux' (PNG) | 'svg' (Vector)
  const [currentPoster, setCurrentPoster] = useState('');
  const [posterType, setPosterType] = useState('image'); // 'image' | 'svg'
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize state when switching between events without cascading effect warning
  const [prevEventDataId, setPrevEventDataId] = useState(eventData?._id);
  if (eventData && eventData._id !== prevEventDataId) {
    setPrevEventDataId(eventData._id);
    const summary = eventData.plan?.summary || {};
    const input = eventData.input || {};
    setTitle(summary.eventName || input.eventName || `${eventData.type || 'Celebration'} Party`);
    setSubtitle(input.vibe || 'Join us for an unforgettable celebration');
    setDate(summary.date || input.date || '');
    setLocation(input.setting ? `${input.setting} Venue` : 'Grand Celebration Grounds');
  }

  // Load suggested prompts from backend
  useEffect(() => {
    let ignore = false;
    async function fetchSuggestions() {
      setLoadingSuggestions(true);
      try {
        const res = await eventService.getPosterSuggestions(eventId);
        if (!ignore) {
          setSuggestions(res.data || []);
          if (res.data?.length > 0) {
            setCustomPrompt(res.data[0].prompt);
            setSelectedStyle(res.data[0].style);
          }
        }
      } catch (err) {
        console.warn('Could not fetch poster suggestions', err);
      } finally {
        if (!ignore) setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const handleApplySuggestion = (sug) => {
    setSelectedStyle(sug.style);
    setCustomPrompt(sug.prompt);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setSaveSuccess(false);

    try {
      const res = await eventService.generatePoster(eventId, {
        title,
        subtitle,
        date,
        location,
        style: selectedStyle,
        prompt: customPrompt,
        engine,
      });

      const posterData = res.data?.data || res.data?.imageUrl || res.data?.svg;
      if (posterData) {
        setCurrentPoster(posterData);
        const isImg =
          res.data?.type === 'image' ||
          posterData.startsWith('data:image/') ||
          posterData.startsWith('http');
        setPosterType(isImg ? 'image' : 'svg');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate poster.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToEvent = async () => {
    if (!currentPoster) return;
    try {
      await onSavePoster({
        title,
        prompt: customPrompt,
        style: selectedStyle,
        imageData: currentPoster,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save poster.');
    }
  };

  const handleDownload = () => {
    if (!currentPoster) return;
    const isImg =
      posterType === 'image' ||
      currentPoster.startsWith('data:image/') ||
      currentPoster.startsWith('http');

    if (isImg) {
      const link = document.createElement('a');
      link.href = currentPoster;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-poster.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blob = new Blob([currentPoster], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-poster.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="card plan-section poster-studio-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <Sparkles className="section-icon text-primary" size={22} />
          <div>
            <h3 className="section-heading mb-0">AI Poster Studio</h3>
            <p className="text-xs text-muted mt-1">
              Craft bespoke promotional event flyers, invitations, and digital commemorative artwork.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Style Prompts */}
      <div className="my-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
          Recommended Aesthetic Styles for this Event:
          {loadingSuggestions && <span className="ml-2 font-normal lowercase tracking-normal">(loading...)</span>}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {suggestions.map((sug) => {
            const isSelected = selectedStyle === sug.style;
            return (
              <button
                key={sug.id}
                type="button"
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : 'border-subtle bg-card-solid hover:border-card'
                }`}
                onClick={() => handleApplySuggestion(sug)}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-main">{sug.name}</span>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-faint line-clamp-2">{sug.prompt}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {sug.palette?.map((col, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Studio Workspace: Form Controls on Left, Live Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-4 bg-card-solid p-5 rounded-xl border border-subtle">
          <h4 className="font-bold text-sm text-main uppercase tracking-wider flex items-center gap-2">
            <Palette size={16} className="text-secondary" />
            <span>Customize Poster Details</span>
          </h4>

          <div>
            <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Poster Headline / Event Name
            </label>
            <input
              type="text"
              className="input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maya & Liam's Sunset Nuptials"
            />
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Invitation Subtitle / Vibe
            </label>
            <input
              type="text"
              className="input w-full"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. An Evening of Garden Romance and Dancing"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Event Date
              </label>
              <input
                type="text"
                className="input w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. October 24, 2026"
              />
            </div>

            <div>
              <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Location / Venue
              </label>
              <input
                type="text"
                className="input w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Rosewood Botanical Hall"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-muted font-semibold flex items-center justify-between">
              <span>Generation Engine</span>
              <span className="text-[10px] text-accent font-normal">Choose mode</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                className={`p-2.5 rounded-lg border text-left transition flex flex-col gap-1 ${
                  engine === 'flux'
                    ? 'bg-primary/20 border-primary text-white shadow-sm'
                    : 'bg-card border-subtle text-muted hover:border-faint'
                }`}
                onClick={() => setEngine('flux')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-main">🎨 Photorealistic AI</span>
                  <span className="badge badge-primary text-[9px] px-1 py-0">PNG</span>
                </div>
                <p className="text-[10px] text-muted leading-tight">
                  Free FLUX diffusion painting & rich imagery
                </p>
              </button>

              <button
                type="button"
                className={`p-2.5 rounded-lg border text-left transition flex flex-col gap-1 ${
                  engine === 'svg'
                    ? 'bg-secondary/20 border-secondary text-white shadow-sm'
                    : 'bg-card border-subtle text-muted hover:border-faint'
                }`}
                onClick={() => setEngine('svg')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-main">✨ Bespoke Vector</span>
                  <span className="badge badge-accent text-[9px] px-1 py-0">SVG</span>
                </div>
                <p className="text-[10px] text-muted leading-tight">
                  Gemini vector typography & ornate borders
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Style Preset
            </label>
            <select
              className="input w-full"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
            >
              <option value="modern">Modern Minimalist</option>
              <option value="luxury">Luxury Gold & Midnight</option>
              <option value="botanical">Botanical Garden</option>
              <option value="neon">Neon Festival Vibe</option>
            </select>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Custom AI Prompt Refinement
            </label>
            <textarea
              className="input w-full min-h-[70px] text-xs font-mono"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add details, color palettes or motif instructions..."
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleGenerate}
              disabled={generating}
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              <span>
                {generating
                  ? 'Synthesizing Artwork...'
                  : engine === 'flux'
                  ? 'Generate Photorealistic Image (PNG)'
                  : 'Render Bespoke Vector Poster (SVG)'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Eye size={14} /> Live Canvas Preview
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1 py-1 px-2.5 text-xs"
                onClick={handleDownload}
                disabled={!currentPoster}
                title="Download poster graphic"
              >
                <Download size={13} />
                <span>Download {posterType === 'image' ? 'PNG' : 'SVG'}</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm flex items-center gap-1 py-1 px-2.5 text-xs ${
                  saveSuccess ? 'btn-success' : 'btn-primary'
                }`}
                onClick={handleSaveToEvent}
                disabled={!currentPoster}
              >
                {saveSuccess ? <Check size={13} /> : <BookmarkPlus size={13} />}
                <span>{saveSuccess ? 'Saved!' : 'Save to Event'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Frame */}
          <div className="poster-canvas-frame">
            {currentPoster ? (
              posterType === 'image' || currentPoster.startsWith('data:image/') || currentPoster.startsWith('http') ? (
                <img
                  src={currentPoster}
                  alt={title}
                  className="poster-img-element"
                />
              ) : (
                <div
                  className="poster-canvas-render"
                  dangerouslySetInnerHTML={{ __html: formatSvgPoster(currentPoster) }}
                />
              )
            ) : (
              <div className="text-center p-8 text-muted">
                <ImageIcon size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Select options and click Render to preview your poster</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Posters Gallery */}
      {posters && posters.length > 0 && (
        <div className="mt-8 pt-6 border-t border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-main uppercase tracking-wider">
              Saved Event Posters Gallery ({posters.length})
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {posters.map((poster) => {
              const isImg =
                poster.imageData.startsWith('data:image/') ||
                poster.imageData.startsWith('http');

              return (
                <div
                  key={poster.id}
                  className="group relative rounded-lg border border-subtle overflow-hidden bg-card-solid hover:border-primary transition"
                >
                  {isImg ? (
                    <div
                      className="poster-card-thumb"
                      onClick={() => {
                        setCurrentPoster(poster.imageData);
                        setPosterType('image');
                      }}
                    >
                      <img
                        src={poster.imageData}
                        alt={poster.title}
                        className="poster-img-element"
                      />
                    </div>
                  ) : (
                    <div
                      className="poster-card-thumb"
                      onClick={() => {
                        setCurrentPoster(poster.imageData);
                        setPosterType('svg');
                      }}
                      dangerouslySetInnerHTML={{ __html: formatSvgPoster(poster.imageData) }}
                    />
                  )}

                  <div className="p-2.5 bg-bg-card-solid flex items-center justify-between text-xs border-t border-subtle">
                    <span className="font-semibold text-main truncate pr-2">{poster.title}</span>
                    <button
                      type="button"
                      className="text-muted hover:text-error p-1 transition"
                      onClick={() => onDeletePoster(poster.id)}
                      title="Remove from gallery"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
