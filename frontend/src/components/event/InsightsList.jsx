import React from 'react';
import { AlertTriangle, Info, Sparkles, Lightbulb, RefreshCw, Wand2 } from 'lucide-react';

export default function InsightsList({ insights, ideas, onGenerateIdeas, isGenerating }) {
  const getIcon = (level) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle size={18} className="text-error" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning" aria-hidden="true" />;
      default:
        return <Info size={18} className="text-accent" aria-hidden="true" />;
    }
  };

  const actualIdeas = ideas?.ideas || (ideas?.themes ? ideas : null);
  const isAi = ideas?.source === 'ai';
  const hasIdeas = Boolean(
    actualIdeas &&
      ((actualIdeas.themes && actualIdeas.themes.length > 0) ||
        (actualIdeas.activities && actualIdeas.activities.length > 0) ||
        (actualIdeas.tips && actualIdeas.tips.length > 0))
  );

  return (
    <div className="insights-container space-y-6">
      {/* ── Key Insights & Considerations ─────────────────────────────────── */}
      {insights && insights.length > 0 && (
        <section className="card plan-section" aria-labelledby="insights-heading">
          <div className="section-header">
            <div className="section-title-wrap">
              <Lightbulb className="section-icon" size={20} aria-hidden="true" />
              <h3 id="insights-heading">Key Insights &amp; Considerations</h3>
            </div>
          </div>

          <ul className="insights-list" role="list" aria-label="Key insights and advisories">
            {insights.map((insight, idx) => (
              <li key={idx} className={`insight-card insight-${insight.level}`}>
                <div className="insight-icon" aria-hidden="true">
                  {getIcon(insight.level)}
                </div>
                <div className="insight-content">
                  <h4 className="insight-title">{insight.title}</h4>
                  <p className="insight-detail">{insight.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Personalized AI Inspirations & Creative Themes ────────────────── */}
      {hasIdeas ? (
        <section className="card plan-section ai-ideas-card" aria-labelledby="ai-ideas-heading">
          <div className="section-header flex flex-wrap items-center justify-between gap-3">
            <div className="section-title-wrap">
              <Sparkles className="section-icon text-primary" size={20} aria-hidden="true" />
              <div>
                <h3 id="ai-ideas-heading">Personalized AI Inspirations</h3>
                <p className="text-xs text-muted mt-0.5">
                  Bespoke creative themes, activities, and expert guidance tailored to your event profile.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="badge badge-ai">
                {isAi ? 'Generated with Gemini AI' : 'Curated Recommendations'}
              </span>
              {onGenerateIdeas && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={onGenerateIdeas}
                  disabled={isGenerating}
                  title="Re-synthesize new ideas using Google Gemini"
                >
                  <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} aria-hidden="true" />
                  <span>{isGenerating ? 'Synthesizing...' : 'Refresh AI Inspirations'}</span>
                </button>
              )}
            </div>
          </div>

          {actualIdeas.summary && <p className="ai-summary-text">{actualIdeas.summary}</p>}

          <div className="ideas-grid">
            {actualIdeas.themes && actualIdeas.themes.length > 0 && (
              <div className="idea-block">
                <h4 className="idea-block-title">Curated Themes &amp; Concepts</h4>
                <ul className="idea-items">
                  {actualIdeas.themes.map((theme, i) => (
                    <li key={i} className="idea-item">
                      <span className="bullet-dot" aria-hidden="true" />
                      <div>
                        {typeof theme === 'string' ? (
                          theme
                        ) : (
                          <>
                            <strong>{theme.title || theme.name}: </strong>
                            <span>{theme.description || theme.detail}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {actualIdeas.activities && actualIdeas.activities.length > 0 && (
              <div className="idea-block">
                <h4 className="idea-block-title">Interactive Activities &amp; Flow</h4>
                <ul className="idea-items">
                  {actualIdeas.activities.map((act, i) => (
                    <li key={i} className="idea-item">
                      <span className="bullet-dot" aria-hidden="true" />
                      <div>
                        {typeof act === 'string' ? (
                          act
                        ) : (
                          <>
                            <strong>{act.title || act.name}: </strong>
                            <span>{act.description || act.detail}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {actualIdeas.tips && actualIdeas.tips.length > 0 && (
              <div className="idea-block">
                <h4 className="idea-block-title">Expert Planning Tips</h4>
                <ul className="idea-items">
                  {actualIdeas.tips.map((tip, i) => (
                    <li key={i} className="idea-item">
                      <span className="bullet-dot" aria-hidden="true" />
                      <div>
                        {typeof tip === 'string' ? (
                          tip
                        ) : (
                          <>
                            <strong>{tip.title || tip.name}: </strong>
                            <span>{tip.description || tip.detail}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ── Empty State Card with Explanation & Generation Button ───────── */
        <section className="card plan-section ai-ideas-card" aria-labelledby="ai-ideas-empty-heading">
          <div className="ai-inspirations-empty-banner p-6 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-md">
              <Wand2 size={32} className="text-primary" aria-hidden="true" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 id="ai-ideas-empty-heading" className="text-xl font-bold text-main">
                  Personalized AI Inspirations &amp; Creative Themes
                </h3>
                <span className="badge badge-ai">Powered by Gemini AI</span>
              </div>

              <p className="text-sm text-muted leading-relaxed">
                Personalized AI Inspirations analyzes your event's unique specifications—including guest count,
                budget tier, venue setting, and priorities—to generate bespoke creative themes, experiential activity
                flows, decor palettes, and expert planner tips customized specifically for your celebration.
              </p>

              {onGenerateIdeas && (
                <div className="pt-2">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center gap-2"
                    onClick={onGenerateIdeas}
                    disabled={isGenerating}
                  >
                    <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} aria-hidden="true" />
                    <span>{isGenerating ? 'Synthesizing Creative Themes...' : 'Generate AI Inspirations'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
