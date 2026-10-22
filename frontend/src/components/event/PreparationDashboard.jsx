import React from 'react';
import { CheckCircle2, Briefcase, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';

export default function PreparationDashboard({ metrics, _eventType, onTabChange }) {
  if (!metrics) return null;

  const { overallProgress, tasks, vendors, budget, guests } = metrics;

  return (
    <div className="card prep-dashboard-card mb-8">
      {/* Top Banner with Overall Progress */}
      <div className="prep-header-row">
        <div>
          <div className="prep-title-badge">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">Preparation Readiness</span>
          </div>
          <h2 className="prep-headline">Overall Event Progress: {overallProgress}%</h2>
        </div>

        <div className="prep-progress-wrapper">
          <div className="prep-progress-track" aria-hidden="true">
            <div
              className="prep-progress-fill"
              style={{
                width: `${overallProgress}%`,
                background:
                  overallProgress >= 80
                    ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                    : overallProgress >= 40
                    ? 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                    : 'linear-gradient(90deg, #f59e0b, #ef4444)',
              }}
            />
          </div>
          <span className="prep-progress-text">{overallProgress}% Arranged</span>
        </div>
      </div>

      {/* Overdue alert if any */}
      {tasks.overdue > 0 && (
        <div className="alert alert-warning mb-6 py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            <span>
              <strong>{tasks.overdue} task{tasks.overdue > 1 ? 's are' : ' is'} overdue!</strong> Review your target dates to stay on track.
            </span>
          </div>
          {onTabChange && (
            <button
              type="button"
              className="btn btn-secondary btn-sm py-1 px-3 text-xs"
              onClick={() => onTabChange('tasks')}
            >
              View Overdue Tasks
            </button>
          )}
        </div>
      )}

      {/* 4 Core Readiness Pillars */}
      <div className="prep-kpi-grid">
        {/* 1. Tasks */}
        <div
          className="kpi-card cursor-pointer hover:border-primary transition"
          onClick={() => onTabChange && onTabChange('tasks')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Checklist Tasks</span>
            <div className="kpi-icon-wrap bg-primary-dim">
              <CheckCircle2 size={18} className="text-primary" />
            </div>
          </div>
          <div className="kpi-value">
            {tasks.completed} <span className="kpi-total">/ {tasks.total}</span>
          </div>
          <div className="kpi-footer">
            <span className={tasks.overdue > 0 ? 'text-warning font-medium' : 'text-muted'}>
              {tasks.pending} pending {tasks.overdue > 0 && `(${tasks.overdue} overdue)`}
            </span>
            <span className="badge badge-sm">{tasks.progressPercent}%</span>
          </div>
        </div>

        {/* 2. Vendors */}
        <div
          className="kpi-card cursor-pointer hover:border-primary transition"
          onClick={() => onTabChange && onTabChange('vendors')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Vendor Bookings</span>
            <div className="kpi-icon-wrap bg-secondary-dim">
              <Briefcase size={18} className="text-secondary" />
            </div>
          </div>
          <div className="kpi-value">
            {vendors.booked} <span className="kpi-total">/ {vendors.total}</span>
          </div>
          <div className="kpi-footer">
            <span className="text-muted">
              {vendors.contacted} in talks, {vendors.pending} pending
            </span>
            <span className="badge badge-sm">{vendors.progressPercent}%</span>
          </div>
        </div>

        {/* 3. Budget & Expenses */}
        <div
          className="kpi-card cursor-pointer hover:border-primary transition"
          onClick={() => onTabChange && onTabChange('budget')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Budget & Spending</span>
            <div className="kpi-icon-wrap bg-accent-dim">
              <DollarSign size={18} className="text-accent" />
            </div>
          </div>
          <div className="kpi-value text-accent">
            {budget.currency} {budget.totalActualCost.toLocaleString()}
          </div>
          <div className="kpi-footer">
            <span className={budget.isOverBudget ? 'text-error font-medium' : 'text-muted'}>
              {budget.remainingBudget >= 0
                ? `${budget.currency} ${budget.remainingBudget.toLocaleString()} left`
                : `${budget.currency} ${Math.abs(budget.remainingBudget).toLocaleString()} over budget`}
            </span>
            {budget.outstandingBalance > 0 && (
              <span className="text-warning text-xs font-semibold">
                Unpaid: {budget.currency} {budget.outstandingBalance.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* 4. Guests & RSVP */}
        <div
          className="kpi-card cursor-pointer hover:border-primary transition"
          onClick={() => onTabChange && onTabChange('guests')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Guest Attendance</span>
            <div className="kpi-icon-wrap bg-emerald-dim">
              <Users size={18} className="text-emerald" />
            </div>
          </div>
          <div className="kpi-value text-emerald">
            {guests.attending} <span className="kpi-total">/ {guests.targetGuestCount || guests.totalInvited}</span>
          </div>
          <div className="kpi-footer">
            <span className="text-muted">
              {guests.pending} pending RSVP ({guests.declined} declined)
            </span>
            <span className="badge badge-sm badge-success">{guests.attending} Confirmed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
