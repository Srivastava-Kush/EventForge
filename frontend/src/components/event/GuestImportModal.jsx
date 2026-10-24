import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload } from 'lucide-react';
import { parseGuestListCsv } from '../../utils/csvHelper.js';

export default function GuestImportModal({
  isOpen,
  onClose,
  onImport,
}) {
  const [csvText, setCsvText] = useState('');
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result || '');
      setImportError('');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportError('');

    try {
      const parsedGuests = parseGuestListCsv(csvText);
      await onImport(parsedGuests);
      setCsvText('');
      onClose();
    } catch (err) {
      setImportError(err.message || 'Failed to parse CSV.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-modal-title"
      className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal-card card max-w-xl w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-emerald" size={20} />
            <h4 id="csv-import-modal-title" className="font-bold text-lg">Bulk Import Guests from CSV</h4>
          </div>
          <button
            type="button"
            className="btn btn-ghost p-1 text-muted hover:text-main"
            onClick={onClose}
            aria-label="Close import modal"
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
            <label htmlFor="csv-file-upload" className="label text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Upload CSV File
            </label>
            <input
              id="csv-file-upload"
              type="file"
              accept=".csv,text/csv"
              className="input w-full text-xs"
              onChange={handleFileUpload}
            />
          </div>

          <div>
            <label htmlFor="csv-text-paste" className="label text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Or Paste CSV Text Directly
            </label>
            <textarea
              id="csv-text-paste"
              className="input w-full font-mono text-xs min-h-[140px]"
              placeholder={`Name,Email,Phone,Group,Invitation Status,RSVP Status,Plus Ones,Plus One Names,Dietary,Table,Notes\nJane Doe,jane@example.com,555-1234,Friends,sent,attending,1,John Doe,Vegetarian,Table 2,VIP guest\nMark Smith,mark@example.com,,Family,sent,pending,0,,Standard,Table 1,`}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setImportError('');
              }}
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
              onClick={onClose}
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
  );
}
