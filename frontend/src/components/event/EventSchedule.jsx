import React, { useState, useEffect } from 'react';
import {
  MapPin,
  User,
  Plus,
  Briefcase,
  CheckCircle2,
  Circle,
  Printer,
  Trash2,
  Edit2,
  X,
  CalendarCheck,
} from 'lucide-react';

export default function EventSchedule({
  schedule = [],
  vendors = [],
  _eventName = '',
  _eventDate = '',
  onAddScheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formActivity, setFormActivity] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formRelatedVendorId, setFormRelatedVendorId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormStartTime('');
    setFormEndTime('');
    setFormActivity('');
    setFormLocation('');
    setFormResponsible('');
    setFormRelatedVendorId('');
    setFormNotes('');
    setFormCompleted(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormStartTime(item.startTime || '');
    setFormEndTime(item.endTime || '');
    setFormActivity(item.activity || '');
    setFormLocation(item.location || '');
    setFormResponsible(item.responsiblePerson || '');
    setFormRelatedVendorId(item.relatedVendorId || '');
    setFormNotes(item.notes || '');
    setFormCompleted(Boolean(item.completed));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formStartTime.trim() || !formActivity.trim()) return;

    const payload = {
      startTime: formStartTime.trim(),
      endTime: formEndTime.trim(),
      activity: formActivity.trim(),
      location: formLocation.trim(),
      responsiblePerson: formResponsible.trim(),
      relatedVendorId: formRelatedVendorId || null,
      notes: formNotes.trim(),
      completed: formCompleted,
    };

    if (editingItem) {
      await onUpdateScheduleItem(editingItem.id, payload);
    } else {
      await onAddScheduleItem(payload);
    }
    setShowModal(false);
  };

  const completedCount = schedule.filter((s) => s.completed).length;

  return (
    <div className="card plan-section event-schedule-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <CalendarCheck className="section-icon text-primary" size={22} />
          <div>
            <h3 className="section-heading mb-0">Event-Day Run Sheet & Schedule</h3>
            <p className="text-xs text-muted mt-1">
              Time-blocked itinerary with designated leads, venues, and coordinating vendors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Run Sheet</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add Timeline Event</span>
          </button>
        </div>
      </div>

      {/* Schedule Readiness Pill */}
      <div className="flex items-center justify-between text-xs my-4 p-3 bg-bg-input/60 rounded border border-subtle">
        <span className="text-muted">
          Day-of Progress: <strong className="text-main">{completedCount} of {schedule.length} Milestones Achieved</strong>
        </span>
        <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${schedule.length > 0 ? (completedCount / schedule.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Itinerary Timeline */}
      {schedule.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No itinerary milestones created yet. Click "Add Timeline Event" to start your run sheet.</p>
        </div>
      ) : (
        <div className="schedule-timeline-container relative pl-6 border-l-2 border-primary/30 space-y-4 my-6">
          {schedule.map((item) => {
            const linkedVendor = vendors.find((v) => v.id === item.relatedVendorId);
            const isCompleted = Boolean(item.completed);

            return (
              <div
                key={item.id}
                className={`schedule-timeline-item relative bg-card-solid border border-subtle p-4 rounded-lg transition hover:border-card ${
                  isCompleted ? 'opacity-70 bg-bg-input/40' : ''
                }`}
              >
                {/* Timeline node circle */}
                <div
                  className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 transition ${
                    isCompleted
                      ? 'bg-success border-success'
                      : 'bg-card border-primary'
                  }`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Time & Title */}
                    <div className="flex items-baseline flex-wrap gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-dim text-primary">
                        {item.startTime} {item.endTime ? `– ${item.endTime}` : ''}
                      </span>
                      <h4 className={`font-bold text-base ${isCompleted ? 'line-through text-muted' : 'text-main'}`}>
                        {item.activity}
                      </h4>
                    </div>

                    {/* Meta info: Location, Lead, Vendor */}
                    <div className="flex flex-wrap items-center gap-4 text-xs my-2">
                      {item.location && (
                        <span className="flex items-center gap-1.5 text-main font-medium">
                          <MapPin size={13} className="text-accent" /> {item.location}
                        </span>
                      )}
                      {item.responsiblePerson && (
                        <span className="flex items-center gap-1.5 text-main font-medium">
                          <User size={13} className="text-primary" /> Lead: {item.responsiblePerson}
                        </span>
                      )}
                      {linkedVendor && (
                        <span className="flex items-center gap-1.5 text-secondary font-medium">
                          <Briefcase size={13} /> Vendor: {linkedVendor.vendorName || linkedVendor.name}
                        </span>
                      )}
                    </div>

                    {/* Notes / Cues */}
                    {item.notes && (
                      <p className="text-xs text-muted bg-hover/80 p-2.5 rounded mt-2 border-l-2 border-primary/50">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-success"
                      onClick={() =>
                        onUpdateScheduleItem(item.id, {
                          completed: !isCompleted,
                        })
                      }
                      title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      aria-label={isCompleted ? `Mark ${item.activity} pending` : `Mark ${item.activity} completed`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-primary"
                      onClick={() => openEditModal(item)}
                      title="Edit milestone"
                      aria-label={`Edit milestone: ${item.activity}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-error"
                      onClick={() => onDeleteScheduleItem(item.id)}
                      title="Delete milestone"
                      aria-label={`Delete milestone: ${item.activity}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Milestone Modal */}
      {showModal && (
        <div
          className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-card card max-w-lg w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h4 id="schedule-modal-title" className="font-bold text-lg">
                {editingItem ? 'Edit Itinerary Milestone' : 'Add Run Sheet Milestone'}
              </h4>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sch-form-start-time" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Start Time *
                  </label>
                  <input
                    id="sch-form-start-time"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. 04:00 PM"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="sch-form-end-time" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    End Time
                  </label>
                  <input
                    id="sch-form-end-time"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. 05:00 PM"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sch-form-activity" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Activity / Program Segment *
                </label>
                <input
                  id="sch-form-activity"
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Exchange of Vows & Ring Ceremony"
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sch-form-location" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Location / Zone
                  </label>
                  <input
                    id="sch-form-location"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Main Garden Arch or Grand Ballroom"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sch-form-responsible" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Responsible Lead
                  </label>
                  <input
                    id="sch-form-responsible"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Officiant or Event Coordinator"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sch-form-vendor" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Coordinating Vendor (Optional)
                </label>
                <select
                  id="sch-form-vendor"
                  className="input w-full text-xs"
                  value={formRelatedVendorId}
                  onChange={(e) => setFormRelatedVendorId(e.target.value)}
                >
                  <option value="">None (Self-managed)</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName || v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sch-form-notes" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Cues, Notes & Stage Instructions
                </label>
                <textarea
                  id="sch-form-notes"
                  className="input w-full min-h-[80px]"
                  placeholder="e.g. Cue soft acoustic track 2 when bride enters..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingItem ? 'Save Milestone' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
