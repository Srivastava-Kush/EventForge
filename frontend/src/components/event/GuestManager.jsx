import React, { useState } from 'react';
import {
  Users,
  Plus,
  Download,
  Upload,
  Mail,
  Phone,
  Trash2,
  Edit2,
} from 'lucide-react';
import { exportGuestListCsv } from '../../utils/csvHelper.js';
import GuestModal from './GuestModal.jsx';
import GuestImportModal from './GuestImportModal.jsx';

const RSVP_BADGES = {
  attending: { label: 'Attending', class: 'badge-success' },
  declined: { label: 'Declined', class: 'badge-error' },
  pending: { label: 'Pending RSVP', class: 'badge-warning' },
  tentative: { label: 'Tentative', class: 'badge-accent' },
};

const INVITE_BADGES = {
  not_sent: { label: 'Not Sent', class: 'badge-outline text-faint' },
  sent: { label: 'Sent', class: 'badge-accent' },
  opened: { label: 'Opened', class: 'badge-primary' },
};

export default function GuestManager({
  guests = [],
  targetCount = 0,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest,
  onImportGuests,
}) {
  const [filter, setFilter] = useState('all'); // all | attending | pending | declined
  const [groupFilter, setGroupFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  // Derived statistics
  const totalInvited = guests.length;
  const attendingGuests = guests.filter((g) => g.rsvpStatus === 'attending');
  const totalHeadcount = attendingGuests.reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);
  const declinedCount = guests.filter((g) => g.rsvpStatus === 'declined').length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'pending' || g.rsvpStatus === 'tentative').length;

  const groups = Array.from(new Set(guests.map((g) => g.group || 'General')));

  const filteredGuests = guests.filter((g) => {
    if (filter === 'attending' && g.rsvpStatus !== 'attending') return false;
    if (filter === 'pending' && g.rsvpStatus !== 'pending' && g.rsvpStatus !== 'tentative') return false;
    if (filter === 'declined' && g.rsvpStatus !== 'declined') return false;
    if (groupFilter !== 'all' && (g.group || 'General') !== groupFilter) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingGuest(null);
    setShowModal(true);
  };

  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setShowModal(true);
  };

  const handleSaveGuest = async (payload) => {
    if (editingGuest) {
      await onUpdateGuest(editingGuest.id, payload);
    } else {
      await onAddGuest(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="card plan-section guest-manager-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <Users className="section-icon text-emerald" size={22} />
          <div>
            <h3 className="section-heading mb-0">Guest Management & RSVPs</h3>
            <p className="text-xs text-muted mt-1">
              Track invitations, attendance confirmations, dietary preferences, and seating plans.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => exportGuestListCsv(guests)}
            disabled={guests.length === 0}
            title="Download guest list as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Guest Attendance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-4">
        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Total Invited</div>
          <div className="text-2xl font-bold text-main">{totalInvited}</div>
          <div className="text-xs text-muted mt-1.5">Capacity Target: {targetCount || 'N/A'}</div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Confirmed Attending</div>
          <div className="text-2xl font-bold text-success">{totalHeadcount}</div>
          <div className="text-xs text-muted mt-1.5">Includes plus-ones</div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Pending RSVP</div>
          <div className="text-2xl font-bold text-warning">{pendingCount}</div>
          <div className="text-xs text-muted mt-1.5">Awaiting reply</div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Declined</div>
          <div className="text-2xl font-bold text-error">{declinedCount}</div>
          <div className="text-xs text-muted mt-1.5">Unable to attend</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-subtle pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Guests ({guests.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'attending' ? 'active' : ''}`}
            onClick={() => setFilter('attending')}
          >
            Attending ({attendingGuests.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'declined' ? 'active' : ''}`}
            onClick={() => setFilter('declined')}
          >
            Declined ({declinedCount})
          </button>
        </div>

        {groups.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-faint">Group:</span>
            <select
              className="input input-sm py-1 px-2 text-xs"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">All Groups</option>
              {groups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Guests Table */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No guest records found matching the current filters.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table w-full text-left" aria-label="Event Guest Roster">
            <thead>
              <tr>
                <th scope="col">Guest Name</th>
                <th scope="col">Group</th>
                <th scope="col">Invitation</th>
                <th scope="col">RSVP</th>
                <th scope="col">Plus Ones</th>
                <th scope="col">Dietary / Seating</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => {
                const rsvpConfig = RSVP_BADGES[guest.rsvpStatus || 'pending'] || RSVP_BADGES.pending;
                const inviteConfig = INVITE_BADGES[guest.invitationStatus || 'not_sent'] || INVITE_BADGES.not_sent;

                return (
                  <tr key={guest.id} className="hover:bg-hover transition">
                    <td>
                      <span className="font-semibold text-main block">{guest.name}</span>
                      <div className="flex items-center gap-3 text-xs text-faint mt-0.5">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} /> {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {guest.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm badge-outline">{guest.group || 'General'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${inviteConfig.class}`}>
                        {inviteConfig.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${rsvpConfig.class}`}>
                        {rsvpConfig.label}
                      </span>
                    </td>
                    <td>
                      {guest.plusOnes > 0 ? (
                        <div>
                          <span className="font-semibold text-main">+{guest.plusOnes}</span>
                          {guest.plusOneNames && (
                            <span className="text-xs text-faint block">{guest.plusOneNames}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-faint text-xs">None</span>
                      )}
                    </td>
                    <td className="text-xs">
                      {guest.dietary && (
                        <span className="block text-warning font-medium">Dietary: {guest.dietary}</span>
                      )}
                      {guest.tableOrSeating && (
                        <span className="block text-muted">Table: {guest.tableOrSeating}</span>
                      )}
                      {!guest.dietary && !guest.tableOrSeating && (
                        <span className="text-faint">Standard</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-primary"
                          onClick={() => openEditModal(guest)}
                          title="Edit guest"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-error"
                          onClick={() => onDeleteGuest(guest.id)}
                          title="Delete guest"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      <GuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveGuest}
        guest={editingGuest}
      />

      {/* CSV Import Modal */}
      <GuestImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImportGuests}
      />
    </div>
  );
}
