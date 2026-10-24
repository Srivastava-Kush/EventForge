import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

function VendorModalForm({
  onClose,
  onSave,
  vendor = null,
  currency = 'USD',
}) {
  const [formName, setFormName] = useState(vendor?.name || '');
  const [formPriority, setFormPriority] = useState(vendor?.priority || 'recommended');
  const [formBookingStatus, setFormBookingStatus] = useState(vendor?.bookingStatus || 'pending');
  const [formVendorName, setFormVendorName] = useState(vendor?.vendorName || '');
  const [formContactPerson, setFormContactPerson] = useState(vendor?.contactPerson || '');
  const [formContactPhone, setFormContactPhone] = useState(vendor?.contactPhone || '');
  const [formContactEmail, setFormContactEmail] = useState(vendor?.contactEmail || '');
  const [formQuotationAmount, setFormQuotationAmount] = useState(vendor?.quotationAmount || 0);
  const [formAgreedAmount, setFormAgreedAmount] = useState(vendor?.agreedAmount || 0);
  const [formPaidAmount, setFormPaidAmount] = useState(vendor?.paidAmount || 0);
  const [formBookBy, setFormBookBy] = useState(vendor?.bookBy || '');
  const [formNotes, setFormNotes] = useState(vendor?.notes || '');
  const [formDocName, setFormDocName] = useState('');
  const [formDocUrl, setFormDocUrl] = useState('');
  const [documents, setDocuments] = useState(vendor?.documents || []);

  const handleAddDocument = () => {
    if (!formDocName.trim() || !formDocUrl.trim()) return;
    setDocuments((prev) => [...prev, { name: formDocName.trim(), url: formDocUrl.trim() }]);
    setFormDocName('');
    setFormDocUrl('');
  };

  const handleRemoveDocument = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onSave({
      name: formName.trim(),
      priority: formPriority,
      bookingStatus: formBookingStatus,
      vendorName: formVendorName.trim(),
      contactPerson: formContactPerson.trim(),
      contactPhone: formContactPhone.trim(),
      contactEmail: formContactEmail.trim(),
      quotationAmount: Number(formQuotationAmount) || 0,
      agreedAmount: Number(formAgreedAmount) || 0,
      paidAmount: Number(formPaidAmount) || 0,
      bookBy: formBookBy,
      notes: formNotes.trim(),
      documents,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-modal-title"
      className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card card max-w-xl w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
          <h4 id="vendor-modal-title" className="font-bold text-lg">
            {vendor ? 'Edit Vendor Record' : 'Add Vendor Record'}
          </h4>
          <button
            type="button"
            className="btn btn-ghost p-1 text-muted hover:text-main"
            onClick={onClose}
            aria-label="Close vendor modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-category-name" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Category Name *
              </label>
              <input
                id="vendor-category-name"
                type="text"
                className="input w-full"
                placeholder="e.g. Wedding Photography or Catering"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="vendor-priority" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Priority
              </label>
              <select
                id="vendor-priority"
                className="input w-full"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
              >
                <option value="essential">Essential</option>
                <option value="recommended">Recommended</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-booking-status" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Booking Status
              </label>
              <select
                id="vendor-booking-status"
                className="input w-full"
                value={formBookingStatus}
                onChange={(e) => setFormBookingStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="contacted">In Discussion / Contacted</option>
                <option value="booked">Booked & Arranged</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label htmlFor="vendor-business-name" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Vendor Business Name
              </label>
              <input
                id="vendor-business-name"
                type="text"
                className="input w-full"
                placeholder="e.g. Silver Screen Studios"
                value={formVendorName}
                onChange={(e) => setFormVendorName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="vendor-contact-person" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Contact Person
              </label>
              <input
                id="vendor-contact-person"
                type="text"
                className="input w-full"
                placeholder="e.g. John Doe"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vendor-contact-phone" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Phone
              </label>
              <input
                id="vendor-contact-phone"
                type="text"
                className="input w-full"
                placeholder="+1 555-0192"
                value={formContactPhone}
                onChange={(e) => setFormContactPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vendor-contact-email" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Email
              </label>
              <input
                id="vendor-contact-email"
                type="email"
                className="input w-full"
                placeholder="vendor@mail.com"
                value={formContactEmail}
                onChange={(e) => setFormContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="vendor-quoted-amount" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Quoted ({currency})
              </label>
              <input
                id="vendor-quoted-amount"
                type="number"
                min="0"
                className="input w-full"
                value={formQuotationAmount}
                onChange={(e) => setFormQuotationAmount(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vendor-agreed-amount" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Agreed Fee ({currency})
              </label>
              <input
                id="vendor-agreed-amount"
                type="number"
                min="0"
                className="input w-full"
                value={formAgreedAmount}
                onChange={(e) => setFormAgreedAmount(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vendor-paid-amount" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Amount Paid ({currency})
              </label>
              <input
                id="vendor-paid-amount"
                type="number"
                min="0"
                className="input w-full"
                value={formPaidAmount}
                onChange={(e) => setFormPaidAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-target-date" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Target Booking Date
              </label>
              <input
                id="vendor-target-date"
                type="date"
                className="input w-full"
                value={formBookBy}
                onChange={(e) => setFormBookBy(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="vendor-notes" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                Notes
              </label>
              <input
                id="vendor-notes"
                type="text"
                className="input w-full"
                placeholder="e.g. Requires 50% deposit upon contract"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Attachments / Document Links */}
          <div className="p-3 bg-bg-input rounded border border-subtle">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
              Attach Contract / Quotation Document Link
            </span>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="input input-sm flex-1"
                placeholder="Doc label (e.g. Contract v1.pdf)"
                value={formDocName}
                onChange={(e) => setFormDocName(e.target.value)}
              />
              <input
                type="text"
                className="input input-sm flex-1"
                placeholder="URL / link or file ref"
                value={formDocUrl}
                onChange={(e) => setFormDocUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddDocument}
              >
                Add
              </button>
            </div>

            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {documents.map((doc, idx) => (
                  <span
                    key={idx}
                    className="badge badge-sm badge-outline flex items-center gap-1.5"
                  >
                    <FileText size={10} />
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      className="hover:text-error ml-1"
                      onClick={() => handleRemoveDocument(idx)}
                      aria-label={`Remove document ${doc.name}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              {vendor ? 'Save Changes' : 'Create Vendor Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorModal({
  isOpen,
  onClose,
  onSave,
  vendor = null,
  currency = 'USD',
}) {
  if (!isOpen) return null;
  return (
    <VendorModalForm
      key={vendor?.id || 'new-vendor'}
      onClose={onClose}
      onSave={onSave}
      vendor={vendor}
      currency={currency}
    />
  );
}
