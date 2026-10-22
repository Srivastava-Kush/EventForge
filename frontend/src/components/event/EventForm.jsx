import React from 'react';
import {
  EVENT_TYPES,
  SETTINGS,
  CURRENCIES,
  PRIORITIES,
  CONSIDERATIONS,
} from '../../constants/index.js';
import { Sparkles, Info } from 'lucide-react';


export default function EventForm({
  formData,
  errors,
  submitting,
  apiError,
  handleChange,
  handlePriorityToggle,
  handleConsiderationToggle,
  handleSubmit,
}) {
  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="alert alert-error" role="alert" aria-live="assertive">
          {apiError}
        </div>
      )}

      {/* Row 1: Type, Name, Date */}
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="eventType" className="form-label">
            Event Type <span className="req" aria-hidden="true">*</span>
          </label>
          <select
            id="eventType"
            name="eventType"
            className={`form-select ${errors.eventType ? 'is-invalid' : ''}`}
            value={formData.eventType}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.eventType}
            aria-describedby={errors.eventType ? 'eventType-error' : undefined}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.eventType && (
            <p id="eventType-error" className="form-error" role="alert">
              {errors.eventType}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="eventName" className="form-label">
            Event Name <span className="hint">(Optional)</span>
          </label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            maxLength={80}
            className={`form-input ${errors.eventName ? 'is-invalid' : ''}`}
            placeholder="e.g. Maya & Leo's Wedding"
            value={formData.eventName}
            onChange={handleChange}
            aria-invalid={!!errors.eventName}
            aria-describedby={errors.eventName ? 'eventName-error' : undefined}
          />
          {errors.eventName && (
            <p id="eventName-error" className="form-error" role="alert">
              {errors.eventName}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date" className="form-label">
            Event Date <span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className={`form-input ${errors.date ? 'is-invalid' : ''}`}
            value={formData.date}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          {errors.date && (
            <p id="date-error" className="form-error" role="alert">
              {errors.date}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Guests, Budget, Currency, Setting */}
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="guestCount" className="form-label">
            Guest Count <span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id="guestCount"
            name="guestCount"
            type="number"
            min={1}
            max={5000}
            className={`form-input ${errors.guestCount ? 'is-invalid' : ''}`}
            value={formData.guestCount}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.guestCount}
            aria-describedby={errors.guestCount ? 'guestCount-error' : undefined}
          />
          {errors.guestCount && (
            <p id="guestCount-error" className="form-error" role="alert">
              {errors.guestCount}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="budget" className="form-label">
            Total Budget <span className="req" aria-hidden="true">*</span>
          </label>
          <div className="input-group">
            <input
              id="budget"
              name="budget"
              type="number"
              min={50}
              step="any"
              className={`form-input ${errors.budget ? 'is-invalid' : ''}`}
              value={formData.budget}
              onChange={handleChange}
              aria-required="true"
              aria-invalid={!!errors.budget}
              aria-describedby={errors.budget ? 'budget-error' : undefined}
            />
            <select
              id="currency"
              name="currency"
              className="form-select select-inline"
              value={formData.currency}
              onChange={handleChange}
              aria-label="Budget Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {errors.budget && (
            <p id="budget-error" className="form-error" role="alert">
              {errors.budget}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="setting" className="form-label">
            Setting
          </label>
          <select
            id="setting"
            name="setting"
            className="form-select"
            value={formData.setting}
            onChange={handleChange}
          >
            {SETTINGS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {formData.eventType === 'birthday' && (
          <div className="form-group">
            <label htmlFor="honoreeAge" className="form-label">
              Turning Age
            </label>
            <input
              id="honoreeAge"
              name="honoreeAge"
              type="number"
              min={0}
              max={120}
              placeholder="e.g. 30"
              className={`form-input ${errors.honoreeAge ? 'is-invalid' : ''}`}
              value={formData.honoreeAge}
              onChange={handleChange}
              aria-invalid={!!errors.honoreeAge}
              aria-describedby={errors.honoreeAge ? 'honoreeAge-error' : undefined}
            />
            {errors.honoreeAge && (
              <p id="honoreeAge-error" className="form-error" role="alert">
                {errors.honoreeAge}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Style / Vibe */}
      <div className="form-group">
        <label htmlFor="vibe" className="form-label">
          Aesthetic or Vibe <span className="hint">(Up to 200 chars)</span>
        </label>
        <input
          id="vibe"
          name="vibe"
          type="text"
          maxLength={200}
          placeholder="e.g. Modern minimalist, candlelit romance, lots of live music"
          className={`form-input ${errors.vibe ? 'is-invalid' : ''}`}
          value={formData.vibe}
          onChange={handleChange}
          aria-invalid={!!errors.vibe}
          aria-describedby={errors.vibe ? 'vibe-error' : undefined}
        />
        {errors.vibe && (
          <p id="vibe-error" className="form-error" role="alert">
            {errors.vibe}
          </p>
        )}
      </div>

      {/* Priorities Selection */}
      <fieldset className="form-group">
        <legend className="form-label mb-2">
          What matters most?{' '}
          <span className="hint">(Selected categories get boosted budget allocation)</span>
        </legend>
        <div className="chips-container" role="group" aria-label="Priorities selection">
          {PRIORITIES.map((p) => {
            const isSelected = formData.priorities.includes(p.value);
            return (
              <button
                type="button"
                key={p.value}
                className={`chip ${isSelected ? 'chip-active' : ''}`}
                onClick={() => handlePriorityToggle(p.value)}
                aria-pressed={isSelected}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Considerations Selection */}
      <fieldset className="form-group">
        <legend className="form-label mb-2">Key Considerations &amp; Inclusivity</legend>
        <div className="chips-container" role="group" aria-label="Key considerations and inclusivity">
          {CONSIDERATIONS.map((c) => {
            const isSelected = formData.considerations.includes(c.value);
            return (
              <button
                type="button"
                key={c.value}
                className={`chip ${isSelected ? 'chip-active' : ''}`}
                onClick={() => handleConsiderationToggle(c.value)}
                aria-pressed={isSelected}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes" className="form-label">
          Additional Details &amp; Notes <span className="hint">(Up to 500 characters)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className={`form-textarea ${errors.notes ? 'is-invalid' : ''}`}
          placeholder="Specific dietary preferences, cultural rituals, special surprises..."
          value={formData.notes}
          onChange={handleChange}
          aria-invalid={!!errors.notes}
          aria-describedby="notes-count"
        />
        <div className="textarea-footer">
          {errors.notes ? (
            <p id="notes-error" className="form-error" role="alert">
              {errors.notes}
            </p>
          ) : (
            <span id="notes-count" className="hint" aria-live="polite">
              {formData.notes.length}/500 characters
            </span>
          )}
        </div>
      </div>

      {/* AI Personalization Toggle */}
      <div className="ai-toggle-box">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="useAI"
            checked={formData.useAI}
            onChange={handleChange}
            className="form-checkbox"
          />
          <span className="checkbox-text">
            <Sparkles size={16} className="inline-icon text-primary" aria-hidden="true" />
            Personalize plan themes, activities, and ideas with AI
          </span>
        </label>
        <p className="ai-privacy-note">
          <Info size={14} className="inline-icon" aria-hidden="true" /> Event specifics and vibe are processed by AI.
          Personal names are omitted.
        </p>
      </div>

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <div className="spinner-inline" aria-hidden="true" />
              <span>Synthesizing Plan &amp; AI Ideas...</span>
              <span className="sr-only">Please wait, your plan is being calculated</span>
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              <span>Generate My Event Plan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

