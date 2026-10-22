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
  X,
  FileSpreadsheet,
} from 'lucide-react';

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

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGroup, setFormGroup] = useState('General');
  const [formInviteStatus, setFormInviteStatus] = useState('not_sent');
  const [formRsvpStatus, setFormRsvpStatus] = useState('pending');
  const [formPlusOnes, setFormPlusOnes] = useState(0);
  const [formPlusOneNames, setFormPlusOneNames] = useState('');
  const [formDietary, setFormDietary] = useState('');
  const [formTable, setFormTable] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importError, setImportError] = useState('');

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
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormGroup('General');
    setFormInviteStatus('not_sent');
    setFormRsvpStatus('pending');
    setFormPlusOnes(0);
    setFormPlusOneNames('');
    setFormDietary('');
    setFormTable('');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setFormName(guest.name || '');
    setFormEmail(guest.email || '');
    setFormPhone(guest.phone || '');
    setFormGroup(guest.group || 'General');
    setFormInviteStatus(guest.invitationStatus || 'not_sent');
    setFormRsvpStatus(guest.rsvpStatus || 'pending');
    setFormPlusOnes(guest.plusOnes || 0);
    setFormPlusOneNames(guest.plusOneNames || '');
    setFormDietary(guest.dietary || '');
    setFormTable(guest.tableOrSeating || '');
    setFormNotes(guest.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
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
    };

    if (editingGuest) {
      await onUpdateGuest(editingGuest.id, payload);
    } else {
      await onAddGuest(payload);
    }
    setShowModal(false);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Group',
      'Invitation Status',
      'RSVP Status',
      'Plus Ones',
      'Plus One Names',
      'Dietary',
      'Table/Seating',
      'Notes',
    ];

    const rows = guests.map((g) => [
      `"${(g.name || '').replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      `"${(g.group || '').replace(/"/g, '""')}"`,
      `"${g.invitationStatus || 'not_sent'}"`,
      `"${g.rsvpStatus || 'pending'}"`,
      g.plusOnes || 0,
      `"${(g.plusOneNames || '').replace(/"/g, '""')}"`,
      `"${(g.dietary || '').replace(/"/g, '""')}"`,
      `"${(g.tableOrSeating || '').replace(/"/g, '""')}"`,
      `"${(g.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'guest_list_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Parsing
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportError('');
    if (!csvText.trim()) {
      setImportError('Please paste CSV text or select a file.');
      return;
    }

    try {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setImportError('CSV must have a header row and at least one data row.');
        return;
      }

      // Simple CSV parser supporting quotes
      const parseLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const parsedGuests = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (!cols[0]) continue;
        parsedGuests.push({
          name: cols[0],
          email: cols[1] || '',
          phone: cols[2] || '',
          group: cols[3] || 'General',
          invitationStatus: cols[4] || 'not_sent',
          rsvpStatus: cols[5] || 'pending',
          plusOnes: parseInt(cols[6], 10) || 0,
          plusOneNames: cols[7] || '',
          dietary: cols[8] || '',
          tableOrSeating: cols[9] || '',
          notes: cols[10] || '',
        });
      }

      if (parsedGuests.length === 0) {
        setImportError('No valid guest records found in CSV.');
        return;
      }

      await onImportGuests(parsedGuests);
      setShowImportModal(false);
      setCsvText('');
    } catch (err) {
      setImportError(err.message || 'Failed to parse CSV.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result || '');
    };
    reader.readAsText(file);
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
            onClick={handleExportCsv}
            disabled={guests.length === 0}
            title="Download guest list as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => {
              setCsvText('');
              setImportError('');
              setShowImportModal(true);
            }}
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
      {showModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="modal-card card max-w-lg w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h4 className="font-bold text-lg">{editingGuest ? 'Edit Guest Record' : 'Add Guest Record'}</h4>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Maya Lin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    placeholder="maya@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Phone Number
                  </label>
                  <input
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Group / Circle
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Family, VIP"
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Invitation Status
                  </label>
                  <select
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    RSVP Status
                  </label>
                  <select
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Plus-Ones Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="input w-full"
                    value={formPlusOnes}
                    onChange={(e) => setFormPlusOnes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Plus-One Names
                  </label>
                  <input
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
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Dietary Requirements
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Vegan, Gluten-free, Nut allergy"
                    value={formDietary}
                    onChange={(e) => setFormDietary(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Table / Seating Assignment
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Table 4 or Lawn Row A"
                    value={formTable}
                    onChange={(e) => setFormTable(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Notes
                </label>
                <input
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
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingGuest ? 'Save Changes' : 'Create Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="modal-card card max-w-xl w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald" size={20} />
                <h4 className="font-bold text-lg">Bulk Import Guests from CSV</h4>
              </div>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowImportModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {importError && (
              <div className="alert alert-error mb-4 text-xs py-2">
                <span>{importError}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="input w-full text-xs"
                  onChange={handleFileUpload}
                />
              </div>

              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
                  Or Paste CSV Text Directly
                </label>
                <textarea
                  className="input w-full font-mono text-xs min-h-[140px]"
                  placeholder={`Name,Email,Phone,Group,Invitation Status,RSVP Status,Plus Ones,Plus One Names,Dietary,Table,Notes\nJane Doe,jane@example.com,555-1234,Friends,sent,attending,1,John Doe,Vegetarian,Table 2,VIP guest\nMark Smith,mark@example.com,,Family,sent,pending,0,,Standard,Table 1,`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>

              <div className="text-xs text-muted bg-bg-input p-3 rounded border border-subtle space-y-1">
                <span className="font-semibold block text-main">Supported CSV Header:</span>
                <code>Name, Email, Phone, Group, Invitation Status, RSVP Status, Plus Ones, Plus One Names, Dietary, Table, Notes</code>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                  <Upload size={14} />
                  <span>Parse & Import Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
