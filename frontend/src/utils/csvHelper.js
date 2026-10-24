/**
 * Generates and downloads a clean, RFC-4180 compliant CSV file of the guest list.
 * @param {Array<object>} guests
 */
export function exportGuestListCsv(guests = []) {
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
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV text into a structured list of guest objects.
 * Supports quote escaping and comma separation.
 * @param {string} csvText
 * @returns {Array<object>}
 */
export function parseGuestListCsv(csvText = '') {
  const trimmed = csvText.trim();
  if (!trimmed) {
    throw new Error('Please paste CSV text or select a file.');
  }

  const lines = trimmed.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row.');
  }

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
  // Skip header row
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
    throw new Error('No valid guest records found in CSV.');
  }

  return parsedGuests;
}
