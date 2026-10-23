import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  Plus,
  Phone,
  Mail,
  User,
  FileText,
  Edit2,
  Trash2,
  X,
  CheckCircle,
} from 'lucide-react';

const STATUS_LABELS = {
  pending: { label: 'Pending', badgeClass: 'badge-warning' },
  contacted: { label: 'In Discussion', badgeClass: 'badge-accent' },
  booked: { label: 'Booked & Arranged', badgeClass: 'badge-success' },
  declined: { label: 'Declined', badgeClass: 'badge-error' },
};

export default function VendorManager({
  vendors = [],
  currency = 'USD',
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}) {
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPriority, setFormPriority] = useState('recommended');
  const [formBookingStatus, setFormBookingStatus] = useState('pending');
  const [formVendorName, setFormVendorName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formQuotationAmount, setFormQuotationAmount] = useState(0);
  const [formAgreedAmount, setFormAgreedAmount] = useState(0);
  const [formPaidAmount, setFormPaidAmount] = useState(0);
  const [formBookBy, setFormBookBy] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDocName, setFormDocName] = useState('');
  const [formDocUrl, setFormDocUrl] = useState('');
  const [documents, setDocuments] = useState([]);

  const filteredVendors = vendors.filter((v) => {
    if (filter === 'all') return true;
    return v.bookingStatus === filter;
  });

  const openAddModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormPriority('recommended');
    setFormBookingStatus('pending');
    setFormVendorName('');
    setFormContactPerson('');
    setFormContactPhone('');
    setFormContactEmail('');
    setFormQuotationAmount(0);
    setFormAgreedAmount(0);
    setFormPaidAmount(0);
    setFormBookBy('');
    setFormNotes('');
    setDocuments([]);
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormName(vendor.name || '');
    setFormPriority(vendor.priority || 'recommended');
    setFormBookingStatus(vendor.bookingStatus || 'pending');
    setFormVendorName(vendor.vendorName || '');
    setFormContactPerson(vendor.contactPerson || '');
    setFormContactPhone(vendor.contactPhone || '');
    setFormContactEmail(vendor.contactEmail || '');
    setFormQuotationAmount(vendor.quotationAmount || 0);
    setFormAgreedAmount(vendor.agreedAmount || 0);
    setFormPaidAmount(vendor.paidAmount || 0);
    setFormBookBy(vendor.bookBy || '');
    setFormNotes(vendor.notes || '');
    setDocuments(vendor.documents || []);
    setShowModal(true);
  };

  const handleAddDocument = () => {
    if (!formDocName.trim()) return;
    setDocuments([
      ...documents,
      { name: formDocName.trim(), url: formDocUrl.trim() || '#', uploadedAt: new Date() },
    ]);
    setFormDocName('');
    setFormDocUrl('');
  };

  const handleRemoveDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
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
      notes: formNotes,
      documents,
    };

    if (editingVendor) {
      await onUpdateVendor(editingVendor.id, payload);
    } else {
      await onAddVendor(payload);
    }
    setShowModal(false);
  };

  const handleQuickStatus = async (vendorId, newStatus) => {
    await onUpdateVendor(vendorId, { bookingStatus: newStatus });
  };

  const bookedCount = vendors.filter((v) => v.bookingStatus === 'booked').length;
  const contactedCount = vendors.filter((v) => v.bookingStatus === 'contacted').length;
  const pendingCount = vendors.filter((v) => !v.bookingStatus || v.bookingStatus === 'pending').length;

  return (
    <div className="card plan-section vendor-manager-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <Briefcase className="section-icon text-secondary" size={22} />
          <div>
            <h3 className="section-heading mb-0">Vendor Records & Arrangements</h3>
            <p className="text-xs text-muted mt-1">
              Track quotations, booking contracts, point-of-contacts, and agreed fees.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 my-4 border-b border-subtle pb-4">
        <button
          type="button"
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Vendors ({vendors.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'booked' ? 'active' : ''}`}
          onClick={() => setFilter('booked')}
        >
          Booked & Arranged ({bookedCount})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'contacted' ? 'active' : ''}`}
          onClick={() => setFilter('contacted')}
        >
          In Discussion ({contactedCount})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({pendingCount})
        </button>
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No vendor records match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVendors.map((vendor) => {
            const statusConfig = STATUS_LABELS[vendor.bookingStatus || 'pending'] || STATUS_LABELS.pending;
            const outstanding = Math.max(0, (vendor.agreedAmount || 0) - (vendor.paidAmount || 0));

            return (
              <div
                key={vendor.id}
                className={`vendor-record-card p-5 rounded-lg border border-subtle bg-card-solid transition hover:border-card flex flex-col justify-between ${
                  vendor.bookingStatus === 'booked' ? 'border-success/30' : ''
                }`}
              >
                <div>
                  {/* Top Row: Category + Booking Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-main">{vendor.name}</h4>
                        <span className={`badge badge-sm badge-${vendor.priority}`}>{vendor.priority}</span>
                      </div>
                      {vendor.vendorName && (
                        <p className="text-sm font-semibold text-primary mt-0.5">{vendor.vendorName}</p>
                      )}
                    </div>

                    <span className={`badge badge-sm ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Planning Tip / Alert */}
                  {vendor.tip && <p className="text-xs text-muted mb-3 italic">"{vendor.tip}"</p>}

                  {/* Booking Date / Urgent flag */}
                  <div className="flex items-center gap-3 text-xs text-faint mb-3">
                    {vendor.bookBy && (
                      <span className={`flex items-center gap-1 ${vendor.bookNow ? 'text-urgent font-medium' : ''}`}>
                        <Clock size={12} /> Target: {vendor.bookBy}
                      </span>
                    )}
                    {vendor.matchesPriority && (
                      <span className="badge badge-sm badge-priority">Priority Match</span>
                    )}
                  </div>

                  {/* Contacts block */}
                  {(vendor.contactPerson || vendor.contactPhone || vendor.contactEmail) && (
                    <div className="bg-bg-input/60 rounded p-2.5 mb-3 text-xs space-y-1">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <User size={12} className="text-faint" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.contactPhone && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <Phone size={12} className="text-faint" />
                          <a href={`tel:${vendor.contactPhone}`} className="hover:underline">
                            {vendor.contactPhone}
                          </a>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <Mail size={12} className="text-faint" />
                          <a href={`mailto:${vendor.contactEmail}`} className="hover:underline">
                            {vendor.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financials Row */}
                  {(vendor.agreedAmount > 0 || vendor.quotationAmount > 0) && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-subtle my-3 text-center text-xs">
                      <div>
                        <span className="text-faint block">Quoted</span>
                        <span className="font-semibold text-main">
                          {currency} {(vendor.quotationAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-faint block">Agreed</span>
                        <span className="font-bold text-primary">
                          {currency} {(vendor.agreedAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-faint block">Paid / Balance</span>
                        <span className="font-semibold text-main">
                          {currency} {(vendor.paidAmount || 0).toLocaleString()} /{' '}
                          <span className={outstanding > 0 ? 'text-warning' : 'text-success'}>
                            {currency} {outstanding.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Documents & notes */}
                  {vendor.documents && vendor.documents.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-faint block mb-1">Attached Documents:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="badge badge-sm badge-outline flex items-center gap-1 hover:text-primary"
                          >
                            <FileText size={10} />
                            <span>{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {vendor.notes && <p className="text-xs text-muted mb-2 bg-hover p-2 rounded">{vendor.notes}</p>}
                </div>

                {/* Footer Controls: Quick status change & Edit/Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-subtle mt-2">
                  <div className="flex items-center gap-1">
                    {vendor.bookingStatus !== 'booked' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-xs text-success flex items-center gap-1 px-2 py-1"
                        onClick={() => handleQuickStatus(vendor.id, 'booked')}
                      >
                        <CheckCircle size={12} /> Mark Booked
                      </button>
                    )}
                    {vendor.bookingStatus !== 'contacted' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-xs text-accent px-2 py-1"
                        onClick={() => handleQuickStatus(vendor.id, 'contacted')}
                      >
                        In Talks
                      </button>
                    )}
                    {vendor.bookingStatus !== 'pending' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-xs text-muted px-2 py-1"
                        onClick={() => handleQuickStatus(vendor.id, 'pending')}
                      >
                        Pending
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-primary"
                      onClick={() => openEditModal(vendor)}
                      title="Edit vendor details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-error"
                      onClick={() => onDeleteVendor(vendor.id)}
                      title="Delete vendor"
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

      {/* Add / Edit Vendor Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowModal(false);
          }}
        >
          <div className="modal-card card max-w-xl w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h4 id="vendor-modal-title" className="font-bold text-lg">
                {editingVendor ? 'Edit Vendor Record' : 'Add Vendor Record'}
              </h4>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowModal(false)}
                aria-label="Close vendor modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Wedding Photography or Catering"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Priority
                  </label>
                  <select
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Booking Status
                  </label>
                  <select
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Vendor Business Name
                  </label>
                  <input
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. John Doe"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Phone
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="+1 555-0192"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Email
                  </label>
                  <input
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Quoted ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-full"
                    value={formQuotationAmount}
                    onChange={(e) => setFormQuotationAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Agreed Fee ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-full"
                    value={formAgreedAmount}
                    onChange={(e) => setFormAgreedAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Amount Paid ({currency})
                  </label>
                  <input
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Target Booking Date
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formBookBy}
                    onChange={(e) => setFormBookBy(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Notes
                  </label>
                  <input
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
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingVendor ? 'Save Changes' : 'Create Vendor Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
