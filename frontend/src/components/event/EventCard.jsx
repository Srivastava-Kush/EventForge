import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export default function EventCard({ event, onDelete }) {
  const { _id, type, input, plan, metrics } = event;

  const eventName = input?.eventName || plan?.summary?.eventName || `${type} Celebration`;
  const guestCount = input?.guestCount || plan?.summary?.guestCount || 0;
  const budget = metrics?.budget?.totalBudget || input?.budget || plan?.budget?.total || 0;
  const currency = metrics?.budget?.currency || input?.currency || plan?.budget?.currency || 'USD';
  const eventDate = input?.date || plan?.summary?.date;

  const progress = metrics?.overallProgress ?? 0;
  const tasks = metrics?.tasks || { completed: 0, total: 0, overdue: 0 };
  const vendors = metrics?.vendors || { booked: 0, total: 0 };
  const budgetMetrics = metrics?.budget || { totalActualCost: 0, remainingBudget: budget };
  const guestMetrics = metrics?.guests || { attending: 0, totalInvited: 0 };

  return (
    <div className="card event-card flex flex-col justify-between hover:border-primary transition group">
      <div>
        {/* Top bar with event type and delete action */}
        <div className="event-card-top flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`badge badge-type badge-${type}`}>{type}</span>
            {tasks.overdue > 0 && (
              <span className="badge badge-sm badge-warning flex items-center gap-1 text-[11px]">
                <AlertTriangle size={11} /> {tasks.overdue} Overdue
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn-icon btn-delete p-1 text-muted hover:text-error transition"
            onClick={() => onDelete(_id)}
            aria-label={`Delete plan for ${eventName}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Title */}
        <h3 className="event-card-title text-lg font-bold text-main mb-3 line-clamp-1">{eventName}</h3>

        {/* Preparation Progress Bar */}
        <div className="event-progress-block mb-4 p-2.5 rounded-lg bg-bg-input/60 border border-subtle">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted font-medium">Preparation Progress</span>
            <span className="font-bold text-main">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background:
                  progress >= 80
                    ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                    : progress >= 40
                    ? 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                    : 'linear-gradient(90deg, #f59e0b, #ef4444)',
              }}
            />
          </div>
        </div>

        {/* Live Metrics Grid derived from actual stored database records */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="bg-bg-input/40 p-2 rounded border border-subtle flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
            <span className="truncate">
              <strong>{tasks.completed}</strong> / {tasks.total} Tasks Done
            </span>
          </div>

          <div className="bg-bg-input/40 p-2 rounded border border-subtle flex items-center gap-2">
            <Briefcase size={14} className="text-secondary flex-shrink-0" />
            <span className="truncate">
              <strong>{vendors.booked}</strong> / {vendors.total} Booked
            </span>
          </div>

          <div className="bg-bg-input/40 p-2 rounded border border-subtle flex items-center gap-2">
            <DollarSign size={14} className="text-accent flex-shrink-0" />
            <span className="truncate">
              <strong>{currency} {budgetMetrics.totalActualCost.toLocaleString()}</strong> spent
            </span>
          </div>

          <div className="bg-bg-input/40 p-2 rounded border border-subtle flex items-center gap-2">
            <Users size={14} className="text-emerald flex-shrink-0" />
            <span className="truncate">
              <strong>{guestMetrics.attending}</strong> attending
            </span>
          </div>
        </div>

        {/* Date and Target details */}
        <div className="flex items-center gap-3 text-xs text-muted mb-4 border-t border-subtle pt-3">
          <div className="flex items-center gap-1">
            <Calendar size={13} className="text-faint" />
            <span>{eventDate || 'Date not set'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={13} className="text-faint" />
            <span>Target: {guestCount}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="event-card-footer pt-2">
        <Link
          to={`/events/${_id}`}
          className="btn btn-outline btn-sm w-full flex items-center justify-center gap-2 group-hover:btn-primary transition"
          aria-label={`Open manager for ${eventName}`}
        >
          <span>Manage Event & Plan</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
