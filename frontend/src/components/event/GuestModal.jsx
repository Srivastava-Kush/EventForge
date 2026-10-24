import React, { useState } from 'react';
import { X } from 'lucide-react';

function GuestModalForm({
  onClose,
  onSave,
  guest = null,
}) {
  const [formName, setFormName] = useState(guest?.name || '');
  const [formEmail, setFormEmail] = useState(guest?.email || '');
  const [formPhone, setFormPhone] = useState(guest?.phone || '');
  const [formGroup, setFormGroup] = useState(guest?.group || 'General');
  const [formInviteStatus, setFormInviteStatus] = useState(guest?.invitationStatus || 'not_sent');
  const [formRsvpStatus, setFormRsvpStatus] = useState(guest?.rsvpStatus || 'pending');
  const [formPlusOnes, setFormPlusOnes] = useState(guest?.plusOnes || 0);
  const [formPlusOneNames, setFormPlusOneNames] = useState(guest?.plusOneNames || '');
  const [formDietary, setFormDietary] = useState(guest?.dietary || '');
  const [formTable, setFormTable] = useState(guest?.tableOrSeating || '');
  const [formNotes, setFormNotes] = useState(guest?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onSave({
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      group: formGroup.trim() || 'General',
      invitationStatus: formInviteStatus,
      rsvpStatus: formRsvpStatus,
      plusOnes: Number(formPlusOnes) || 0,
      plusOneNames: formPlusOneNames.trim(),
      dietary: formDietary.trim(),
      tableOrSeating: formTable.trim(),
      notes: formNotes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card card max-w-lg w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
          <h4 id="guest-modal-title" className="font-bold text-lg">
            {guest ? 'Edit Guest Record' : 'Add Guest Record'}
          </h4>
          <button
            type="button"
            className="btn btn-ghost p-1 text-muted hover:text-main"
            onClick={onClose}
            aria-label="Close guest modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guest-full-name" className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Full Name *
            </label>
            <input
              id="guest-full-name"
              type="text"
              className="input w-full"
              placeholder="e.g. Maya Lin"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guest-email" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Email
              </label>
              <input
                id="guest-email"
                type="email"
                className="input w-full"
                placeholder="maya@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="guest-phone" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Phone Number
              </label>
              <input
                id="guest-phone"
                type="text"
                className="input w-full"
                placeholder="+1 (555) 012-3456"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="guest-group" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Group / Circle
              </label>
              <input
                id="guest-group"
                type="text"
                className="input w-full"
                placeholder="e.g. Family, VIP"
                value={formGroup}
                onChange={(e) => setFormGroup(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="guest-invite-status" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Invitation Status
              </label>
              <select
                id="guest-invite-status"
                className="input w-full"
                value={formInviteStatus}
                onChange={(e) => setFormInviteStatus(e.target.value)}
              >
                <option value="not_sent">Not Sent</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
              </select>
            </div>

            <div>
              <label htmlFor="guest-rsvp-status" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                RSVP Status
              </label>
              <select
                id="guest-rsvp-status"
                className="input w-full"
                value={formRsvpStatus}
                onChange={(e) => setFormRsvpStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="attending">Attending</option>
                <option value="declined">Declined</option>
                <option value="tentative">Tentative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guest-plus-ones" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Plus-Ones Count
              </label>
              <input
                id="guest-plus-ones"
                type="number"
                min="0"
                max="10"
                className="input w-full"
                value={formPlusOnes}
                onChange={(e) => setFormPlusOnes(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="guest-plus-one-names" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Plus-One Names
              </label>
              <input
                id="guest-plus-one-names"
                type="text"
                className="input w-full"
                placeholder="e.g. Partner, child"
                value={formPlusOneNames}
                onChange={(e) => setFormPlusOneNames(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="guest-dietary" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Dietary Requirements
              </label>
              <input
                id="guest-dietary"
                type="text"
                className="input w-full"
                placeholder="e.g. Vegan, Gluten-free, Nut allergy"
                value={formDietary}
                onChange={(e) => setFormDietary(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="guest-table" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Table / Seating Assignment
              </label>
              <input
                id="guest-table"
                type="text"
                className="input w-full"
                placeholder="e.g. Table 4 or Lawn Row A"
                value={formTable}
                onChange={(e) => setFormTable(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="guest-notes" className="label text-xs uppercase tracking-wider text-muted font-semibold">
              Notes
            </label>
            <input
              id="guest-notes"
              type="text"
              className="input w-full"
              placeholder="e.g. VIP speaker, requires airport shuttle"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {guest ? 'Save Changes' : 'Create Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GuestModal({
  isOpen,
  onClose,
  onSave,
  guest = null,
}) {
  if (!isOpen) return null;
  return (
    <GuestModalForm
      key={guest?.id || 'new-guest'}
      onClose={onClose}
      onSave={onSave}
      guest={guest}
    />
  );
}
