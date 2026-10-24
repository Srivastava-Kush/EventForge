import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  Filter,
} from 'lucide-react';

const PHASES = [
  'Plan & book',
  'Design & invite',
  'Final details',
  'Event day',
  'Wrap-up',
];

export default function TaskChecklist({ tasks = [], onToggleTask, onAddTask, onUpdateTask, onDeleteTask }) {
  const [filter, setFilter] = useState('all'); // all | pending | completed | urgent
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formPhase, setFormPhase] = useState('Plan & book');
  const [formDueDate, setFormDueDate] = useState('');
  const [formUrgent, setFormUrgent] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');

  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.status === 'completed') return false;
    if (filter === 'completed' && t.status !== 'completed') return false;
    if (filter === 'urgent' && !t.urgent) return false;
    if (phaseFilter !== 'all' && t.phase !== phaseFilter) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormPhase('Plan & book');
    setFormDueDate('');
    setFormUrgent(false);
    setFormNotes('');
    setFormAssignedTo('');
    setShowAddModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormTitle(task.title || '');
    setFormPhase(task.phase || 'Plan & book');
    setFormDueDate(task.dueDate || '');
    setFormUrgent(Boolean(task.urgent));
    setFormNotes(task.notes || '');
    setFormAssignedTo(task.assignedTo || '');
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      title: formTitle.trim(),
      phase: formPhase,
      dueDate: formDueDate,
      urgent: formUrgent,
      notes: formNotes,
      assignedTo: formAssignedTo,
    };

    if (editingTask) {
      await onUpdateTask(editingTask.id, payload);
    } else {
      await onAddTask(payload);
    }

    setShowAddModal(false);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="card plan-section task-checklist-card">
      {/* Header with Title and Add Button */}
      <div className="section-header flex-wrap gap-4">
        <div className="section-title-wrap">
          <CheckCircle2 className="section-icon text-primary" size={22} />
          <div>
            <h3 className="section-heading mb-0">Actionable Event Checklist</h3>
            <p className="text-xs text-muted mt-1">
              Keep tasks separate from vendor contracts. Check off milestones as you make progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Custom Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Phase Controls */}
      <div className="checklist-controls-row my-4 flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
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
            className={`filter-pill ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            Urgent ({tasks.filter((t) => t.urgent).length})
          </button>
        </div>

        {/* Phase selector */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted" />
          <select
            className="input input-sm py-1 px-2 text-xs"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <option value="all">All Phases</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No tasks match your selected filter.</p>
        </div>
      ) : (
        <ul className="interactive-task-list divide-y divide-subtle" role="list">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.dueDate && task.dueDate < todayIso;

            return (
              <li
                key={task.id}
                className={`task-row py-3.5 px-3 rounded transition flex items-start gap-3 hover:bg-hover ${
                  isCompleted ? 'task-completed opacity-75' : ''
                }`}
              >
                {/* Toggle Button */}
                <button
                  type="button"
                  className="task-toggle-btn mt-0.5 text-muted hover:text-primary transition"
                  onClick={() =>
                    onToggleTask(task.id, {
                      status: isCompleted ? 'pending' : 'completed',
                    })
                  }
                  aria-label={isCompleted ? 'Mark task pending' : 'Mark task completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-success fill-success/20" />
                  ) : (
                    <Circle size={20} className="hover:text-primary" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline flex-wrap gap-2">
                    <span
                      className={`task-title font-medium text-sm ${
                        isCompleted ? 'line-through text-muted' : 'text-main'
                      }`}
                    >
                      {task.title}
                    </span>

                    <span className="badge badge-sm badge-outline text-xs">{task.phase}</span>

                    {task.urgent && (
                      <span className="badge badge-sm badge-urgent flex items-center gap-1">
                        <AlertCircle size={10} /> Urgent
                      </span>
                    )}

                    {isOverdue && (
                      <span className="badge badge-sm badge-error text-xs">Overdue</span>
                    )}

                    {task.isCustom && (
                      <span className="badge badge-sm bg-purple-900/40 text-purple-300 text-xs">
                        Custom
                      </span>
                    )}
                  </div>

                  {task.notes && <p className="text-xs text-muted mt-1">{task.notes}</p>}

                  <div className="task-meta-row flex items-center gap-4 text-xs text-faint mt-1.5">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-error font-medium' : ''}`}>
                        <Clock size={12} /> Target Due: {task.dueDate}
                      </span>
                    )}
                    {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                    {task.completedAt && (
                      <span className="text-success">
                        Completed on {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="task-actions flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-primary"
                    onClick={() => openEditModal(task)}
                    title="Edit task"
                    aria-label={`Edit task: ${task.title}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm p-1.5 text-muted hover:text-error"
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                    aria-label={`Delete task: ${task.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="modal-card card max-w-lg w-full p-6 bg-card-solid border border-card shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h4 id="task-modal-title" className="font-bold text-lg">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h4>
              <button
                type="button"
                className="btn btn-ghost p-1 text-muted hover:text-main"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="task-title-input" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Task Title *
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Confirm wedding cake tasting flavors"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-phase-select" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Planning Phase
                  </label>
                  <select
                    id="task-phase-select"
                    className="input w-full"
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                  >
                    {PHASES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due-date-input" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Due Date
                  </label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    className="input w-full"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-assigned-to-input" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                    Assigned Person
                  </label>
                  <input
                    id="task-assigned-to-input"
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Alex or Host"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="formUrgent"
                    className="checkbox"
                    checked={formUrgent}
                    onChange={(e) => setFormUrgent(e.target.checked)}
                  />
                  <label htmlFor="formUrgent" className="text-sm cursor-pointer select-none">
                    Mark as Urgent Priority
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="task-notes-input" className="label text-xs uppercase tracking-wider text-muted font-semibold">
                  Notes & Details
                </label>
                <textarea
                  id="task-notes-input"
                  className="input w-full min-h-[80px]"
                  placeholder="Add specific instructions, contact references, or checklists..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
