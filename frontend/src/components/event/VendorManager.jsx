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
  CheckCircle,
} from 'lucide-react';
import VendorModal from './VendorModal.jsx';

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

  const filteredVendors = vendors.filter((v) => {
    if (filter === 'all') return true;
    return v.bookingStatus === filter;
  });

  const openAddModal = () => {
    setEditingVendor(null);
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setShowModal(true);
  };

  const handleSaveVendor = async (payload) => {
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

  return (
    <div className="card plan-section vendor-manager-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <Briefcase className="section-icon text-indigo" size={22} />
          <div>
            <h3 className="section-heading mb-0">Vendor Contracts & Procurement</h3>
            <p className="text-xs text-muted mt-1">
              Manage quotes, assigned contacts, agreed amounts, documents, and booking milestones.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm flex items-center gap-1.5"
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Add Custom Vendor</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 my-4 border-b border-subtle pb-3">
        <button
          type="button"
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Categories ({vendors.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'booked' ? 'active' : ''}`}
          onClick={() => setFilter('booked')}
        >
          Booked ({vendors.filter((v) => v.bookingStatus === 'booked').length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'contacted' ? 'active' : ''}`}
          onClick={() => setFilter('contacted')}
        >
          In Discussion ({vendors.filter((v) => v.bookingStatus === 'contacted').length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Action ({vendors.filter((v) => !v.bookingStatus || v.bookingStatus === 'pending').length})
        </button>
      </div>

      {/* Vendor Cards List */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No vendor entries found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map((vendor) => {
            const statusConfig = STATUS_LABELS[vendor.bookingStatus || 'pending'] || STATUS_LABELS.pending;
            const isBooked = vendor.bookingStatus === 'booked';

            return (
              <div
                key={vendor.id}
                className="bg-card-solid border border-card rounded-xl p-4 flex flex-col justify-between hover:border-subtle transition-shadow shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-bold text-main text-base block">{vendor.name}</span>
                      {vendor.vendorName && (
                        <span className="text-sm text-primary font-medium block">
                          {vendor.vendorName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {vendor.priority && (
                        <span
                          className={`badge badge-sm ${
                            vendor.priority === 'essential'
                              ? 'badge-error'
                              : vendor.priority === 'recommended'
                              ? 'badge-warning'
                              : 'badge-outline'
                          }`}
                        >
                          {vendor.priority}
                        </span>
                      )}
                      <span className={`badge badge-sm ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Booking timeline nudge */}
                  {vendor.bookBy && (
                    <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                      <Clock size={12} className={vendor.bookNow ? 'text-error' : 'text-faint'} />
                      <span>
                        Target booking:{' '}
                        <strong className={vendor.bookNow ? 'text-error font-semibold' : 'text-main'}>
                          {vendor.bookBy}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Financials pill */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-bg-input rounded-lg text-xs my-3 border border-subtle">
                    <div>
                      <span className="text-faint block text-[10px] uppercase font-semibold">Quote</span>
                      <span className="font-semibold text-main">
                        {currency} {(vendor.quotationAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-faint block text-[10px] uppercase font-semibold">Agreed</span>
                      <span className="font-semibold text-primary">
                        {currency} {(vendor.agreedAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-faint block text-[10px] uppercase font-semibold">Paid</span>
                      <span
                        className={`font-semibold ${
                          vendor.paidAmount >= vendor.agreedAmount && vendor.agreedAmount > 0
                            ? 'text-success'
                            : 'text-muted'
                        }`}
                      >
                        {currency} {(vendor.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Contact details if available */}
                  {(vendor.contactPerson || vendor.contactPhone || vendor.contactEmail) && (
                    <div className="text-xs text-muted space-y-1 mb-3 pt-1 border-t border-subtle">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-faint" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.contactPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-faint" />
                          <span>{vendor.contactPhone}</span>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-faint" />
                          <span className="truncate">{vendor.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents & notes */}
                  {vendor.documents && vendor.documents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {vendor.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-sm badge-outline hover:badge-primary transition flex items-center gap-1"
                        >
                          <FileText size={10} />
                          <span className="truncate max-w-[120px]">{doc.name}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {vendor.notes && (
                    <p className="text-xs text-faint italic mb-3">"{vendor.notes}"</p>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="flex items-center justify-between pt-3 border-t border-subtle mt-2">
                  <div className="flex items-center gap-1.5">
                    {!isBooked ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1"
                        onClick={() => handleQuickStatus(vendor.id, 'booked')}
                      >
                        <CheckCircle size={12} className="text-success" />
                        <span>Mark Booked</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-xs py-1 px-2 text-faint hover:text-warning"
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
      <VendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveVendor}
        vendor={editingVendor}
        currency={currency}
      />
    </div>
  );
}
