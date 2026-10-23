import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Link as LinkIcon,
} from 'lucide-react';

export default function ExpenseTracker({
  expenses = [],
  budgetTotal = 0,
  currency = 'USD',
  vendors = [],
  tasks = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const [filter, setFilter] = useState('all'); // all | unpaid | partially_paid | paid
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formEstimated, setFormEstimated] = useState(0);
  const [formActual, setFormActual] = useState(0);
  const [formPaid, setFormPaid] = useState(0);
  const [formDueDate, setFormDueDate] = useState('');
  const [formPaidDate, setFormPaidDate] = useState('');
  const [formLinkedVendorId, setFormLinkedVendorId] = useState('');
  const [formLinkedTaskId, setFormLinkedTaskId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Calculations strictly from unique expense entries — zero double counting guaranteed!
  const totalEstimated = expenses.reduce((sum, e) => sum + (Number(e.estimatedCost) || 0), 0);
  const totalActual = expenses.reduce((sum, e) => sum + (Number(e.actualCost) || 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const totalOutstanding = Math.max(0, totalActual - totalPaid);
  const remainingBudget = Number(budgetTotal) - totalActual;
  const isOverBudget = remainingBudget < 0;

  const filteredExpenses = expenses.filter((e) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const openAddModal = () => {
    setEditingExpense(null);
    setFormTitle('');
    setFormCategory('General');
    setFormEstimated(0);
    setFormActual(0);
    setFormPaid(0);
    setFormDueDate('');
    setFormPaidDate('');
    setFormLinkedVendorId('');
    setFormLinkedTaskId('');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormTitle(exp.title || '');
    setFormCategory(exp.category || 'General');
    setFormEstimated(exp.estimatedCost || 0);
    setFormActual(exp.actualCost || 0);
    setFormPaid(exp.paidAmount || 0);
    setFormDueDate(exp.dueDate || '');
    setFormPaidDate(exp.paidDate || '');
    setFormLinkedVendorId(exp.linkedVendorId || '');
    setFormLinkedTaskId(exp.linkedTaskId || '');
    setFormNotes(exp.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      estimatedCost: Number(formEstimated) || 0,
      actualCost: Number(formActual) || 0,
      paidAmount: Number(formPaid) || 0,
      dueDate: formDueDate,
      paidDate: formPaidDate,
      linkedVendorId: formLinkedVendorId || null,
      linkedTaskId: formLinkedTaskId || null,
      notes: formNotes,
    };

    if (editingExpense) {
      await onUpdateExpense(editingExpense.id, payload);
    } else {
      await onAddExpense(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="card plan-section expense-tracker-card">
      {/* Header */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <DollarSign className="section-icon text-accent" size={22} />
          <div>
            <h3 className="section-heading mb-0">Individual Expense Records & Budget Balance</h3>
            <p className="text-xs text-muted mt-1">
              Accurate itemized ledger. Linking expenses to vendors or tasks provides cross-reference without duplicating totals.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Expense Item</span>
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-4">
        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Total Budget</div>
          <div className="text-2xl font-bold text-main">
            {currency} {Number(budgetTotal).toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-1.5">Allocated limit</div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Total Actual Cost</div>
          <div className="text-2xl font-bold text-accent">
            {currency} {totalActual.toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-1.5">Est: {currency} {totalEstimated.toLocaleString()}</div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Amount Paid</div>
          <div className="text-2xl font-bold text-success">
            {currency} {totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-warning mt-1.5 font-medium">
            Bal: {currency} {totalOutstanding.toLocaleString()}
          </div>
        </div>

        <div className="bg-card-solid border border-subtle rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-faint uppercase font-semibold tracking-wider mb-1.5">Remaining Budget</div>
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-error' : 'text-main'}`}>
            {currency} {remainingBudget.toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-1.5">
            {isOverBudget ? 'Exceeds budget limit' : 'Under allocated budget'}
          </div>
        </div>
      </div>

      {/* Progress Bar of Budget Utilization */}
      <div className="mb-6 p-4 rounded-lg bg-bg-input/60 border border-subtle">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted font-medium">Budget Spending Progress</span>
          <span className="font-semibold text-main">
            {budgetTotal > 0 ? Math.round((totalActual / budgetTotal) * 100) : 0}% Allocated
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-success transition-all duration-300"
            style={{ width: `${Math.min(100, budgetTotal > 0 ? (totalPaid / budgetTotal) * 100 : 0)}%` }}
            title="Paid"
          />
          <div
            className="h-full bg-warning transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                budgetTotal > 0 ? (totalOutstanding / budgetTotal) * 100 : 0,
              )}%`,
            }}
            title="Unpaid Balance"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-faint mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success inline-block" /> Paid ({currency} {totalPaid.toLocaleString()})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Outstanding ({currency} {totalOutstanding.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-subtle pb-3">
        <button
          type="button"
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Items ({expenses.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          Fully Paid ({expenses.filter((e) => e.status === 'paid').length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'partially_paid' ? 'active' : ''}`}
          onClick={() => setFilter('partially_paid')}
        >
          Partially Paid ({expenses.filter((e) => e.status === 'partially_paid').length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'unpaid' ? 'active' : ''}`}
          onClick={() => setFilter('unpaid')}
        >
          Unpaid ({expenses.filter((e) => e.status === 'unpaid').length})
        </button>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No expense records found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table w-full text-left" aria-label="Individual Expense Ledger">
            <thead>
              <tr>
                <th scope="col">Expense Item</th>
                <th scope="col">Category</th>
                <th scope="col" className="text-right">Estimated</th>
                <th scope="col" className="text-right">Actual Cost</th>
                <th scope="col" className="text-right">Paid</th>
                <th scope="col" className="text-right">Outstanding</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => {
                const actual = Number(exp.actualCost) || 0;
                const paid = Number(exp.paidAmount) || 0;
                const balance = Math.max(0, actual - paid);
                const linkedVendor = vendors.find((v) => v.id === exp.linkedVendorId);
                const linkedTask = tasks.find((t) => t.id === exp.linkedTaskId);

                return (
                  <tr key={exp.id} className="hover:bg-hover transition">
                    <td>
                      <span className="font-semibold text-main block">{exp.title}</span>
                      {(linkedVendor || linkedTask) && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-faint">
                          {linkedVendor && (
                            <span className="flex items-center gap-1 text-primary">
                              <LinkIcon size={10} /> Vendor: {linkedVendor.vendorName || linkedVendor.name}
                            </span>
                          )}
                          {linkedTask && (
                            <span className="flex items-center gap-1 text-muted">
                              <LinkIcon size={10} /> Task: {linkedTask.title.slice(0, 20)}...
                            </span>
                          )}
                        </div>
                      )}
                      {exp.notes && <p className="text-xs text-muted mt-0.5">{exp.notes}</p>}
                    </td>
                    <td>
                      <span className="badge badge-sm badge-outline">{exp.category}</span>
                    </td>
                    <td className="text-right text-muted text-xs font-mono">
                      {currency} {(Number(exp.estimatedCost) || 0).toLocaleString()}
                    </td>
                    <td className="text-right font-bold text-main font-mono">
                      {currency} {actual.toLocaleString()}
                    </td>
                    <td className="text-right text-success font-semibold font-mono">
                      {currency} {paid.toLocaleString()}
                    </td>
                    <td className="text-right font-mono">
                      <span className={balance > 0 ? 'text-warning font-semibold' : 'text-muted'}>
                        {currency} {balance.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {exp.status === 'paid' && (
                        <span className="badge badge-sm badge-success flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10} /> Paid
                        </span>
                      )}
                      {exp.status === 'partially_paid' && (
                        <span className="badge badge-sm badge-accent w-fit">Partially Paid</span>
                      )}
                      {exp.status === 'unpaid' && (
                        <span className="badge badge-sm badge-warning w-fit">Unpaid</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-primary"
                          onClick={() => openEditModal(exp)}
                          title="Edit expense"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-error"
                          onClick={() => onDeleteExpense(exp.id)}
                          title="Delete expense"
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

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
          className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowModal(false);
          }}
        >
          <div className="modal-card card max-w-lg w-full p-6 bg-card-solid border border-card shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h4 id="expense-modal-title" className="font-bold text-lg">
                {editingExpense ? 'Edit Expense Record' : 'Add Expense Record'}
              </h4>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowModal(false)}
                aria-label="Close expense modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Expense Description *
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Catering deposit, Sound system rental"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Category
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Venue, Catering, Music"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Estimated Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-full"
                    value={formEstimated}
                    onChange={(e) => setFormEstimated(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Actual Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-full"
                    value={formActual}
                    onChange={(e) => setFormActual(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Paid Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-full"
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formPaidDate}
                    onChange={(e) => setFormPaidDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Linking to Vendor & Task */}
              <div className="p-3 bg-bg-input rounded border border-subtle space-y-3">
                <span className="text-xs uppercase tracking-wider text-muted font-semibold block">
                  Link to Vendor or Task (Cross-Reference Only — No Double Counting)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs text-faint">Linked Vendor</label>
                    <select
                      className="input w-full text-xs"
                      value={formLinkedVendorId}
                      onChange={(e) => setFormLinkedVendorId(e.target.value)}
                    >
                      <option value="">None (Independent expense)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vendorName || v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs text-faint">Linked Task</label>
                    <select
                      className="input w-full text-xs"
                      value={formLinkedTaskId}
                      onChange={(e) => setFormLinkedTaskId(e.target.value)}
                    >
                      <option value="">None</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Notes
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Receipt #1042 or payment method"
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
                  {editingExpense ? 'Save Changes' : 'Create Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
