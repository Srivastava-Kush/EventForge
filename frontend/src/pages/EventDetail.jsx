import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service.js';
import { useEventOperations } from '../hooks/useEventOperations.js';

// Modular Feature Components
import PreparationDashboard from '../components/event/PreparationDashboard.jsx';
import TaskChecklist from '../components/event/TaskChecklist.jsx';
import VendorManager from '../components/event/VendorManager.jsx';
import ExpenseTracker from '../components/event/ExpenseTracker.jsx';
import GuestManager from '../components/event/GuestManager.jsx';
import EventSchedule from '../components/event/EventSchedule.jsx';
import PosterStudio from '../components/event/PosterStudio.jsx';
import InsightsList from '../components/event/InsightsList.jsx';
import BudgetBreakdown from '../components/event/BudgetBreakdown.jsx';
import Loader from '../components/common/Loader.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';

import {
  ArrowLeft,
  Printer,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  LayoutDashboard,
  CheckCircle2,
  Briefcase,
  Receipt,
  UserCheck,
  CalendarDays,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | tasks | vendors | expenses | guests | schedule | posters | ideas
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  const {
    isGeneratingIdeas,
    opError,
    setOpError,
    confirmModal,
    closeConfirmModal,
    handleToggleTask,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddVendor,
    handleUpdateVendor,
    handleDeleteVendor,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleAddGuest,
    handleUpdateGuest,
    handleDeleteGuest,
    handleImportGuests,
    handleAddScheduleItem,
    handleUpdateScheduleItem,
    handleDeleteScheduleItem,
    handleSavePoster,
    handleDeletePoster,
    handleGenerateIdeas,
  } = useEventOperations(id, setEventData, setStatusAnnouncement);

  const TAB_KEYS = ['dashboard', 'tasks', 'vendors', 'expenses', 'guests', 'schedule', 'posters', 'ideas'];

  const fetchEventData = useCallback(() => {
    eventService
      .getEventById(id)
      .then((res) => {
        setEventData(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Could not load event plan.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchEventData();
    const handleEventUpdated = () => {
      fetchEventData();
      setStatusAnnouncement('Event data updated in real time by AI Assistant.');
    };
    window.addEventListener('event-updated', handleEventUpdated);
    return () => {
      window.removeEventListener('event-updated', handleEventUpdated);
    };
  }, [fetchEventData]);

  const handleTabKeyDown = (e) => {
    const currentIndex = TAB_KEYS.indexOf(activeTab);
    if (currentIndex === -1) return;

    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % TAB_KEYS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = TAB_KEYS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TAB_KEYS[nextIndex];
      setActiveTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
      setStatusAnnouncement(`Switched to ${nextTab} section`);
    }
  };

  /* Sub-entity operations and confirmation flows are managed by useEventOperations */

  if (loading) {
    return (
      <div className="container py-16">
        <Loader text="Loading your event management portfolio..." />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="container py-12">
        <div className="card text-center p-8">
          <AlertCircle size={40} className="text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted mb-6">{error || 'Unable to locate this event plan.'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { plan, ideas, type, metrics } = eventData;
  const summary = plan?.summary || {};
  const budget = plan?.budget || {};

  return (
    <div className="container py-8 plan-results-view">
      {/* Accessible Non-blocking Error Banner */}
      {opError && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{opError}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpError('')}
            className="text-xs font-semibold hover:underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top action bar */}
      <div className="results-top-bar flex items-center justify-between">
        <button
          type="button"
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          onClick={() => window.print()}
        >
          <Printer size={16} />
          <span>Print Complete Plan</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="card summary-banner my-6">
        <div className="summary-banner-content">
          <span className={`badge badge-type badge-${type}`}>
            {summary.eventLabel || type}
          </span>
          <h1 className="summary-title">{summary.eventName || `${type} Plan`}</h1>
          <div className="summary-metrics-row">
            <div className="metric-pill">
              <Calendar size={16} />
              <span>{summary.date}</span>
            </div>
            {summary.daysToGo !== undefined && (
              <div className="metric-pill">
                <Clock size={16} />
                <span>{summary.daysToGo} days to go</span>
              </div>
            )}
            <div className="metric-pill">
              <Users size={16} />
              <span>{summary.guestCount} target guests</span>
            </div>
            <div className="metric-pill">
              <DollarSign size={16} />
              <span>
                {budget.currency} {budget.total?.toLocaleString()} budget
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Preparation Readiness Dashboard */}
      <PreparationDashboard
        metrics={metrics}
        eventType={type}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Screen reader live region status announcer */}
      <div className="sr-only" role="status" aria-live="polite" id="a11y-status-announcer">
        {statusAnnouncement}
      </div>

      {/* Modular Navigation Tabs with WAI-ARIA Arrow Keyboard Navigation */}
      <div
        className="plan-tabs-nav flex flex-wrap items-center gap-1.5 border-b border-subtle mb-6 pb-2"
        role="tablist"
        aria-label="Event management workspace sections"
        onKeyDown={handleTabKeyDown}
      >
        <button
          type="button"
          id="tab-dashboard"
          role="tab"
          aria-selected={activeTab === 'dashboard'}
          aria-controls="panel-dashboard"
          tabIndex={activeTab === 'dashboard' ? 0 : -1}
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          <span>Overview & Strategy</span>
        </button>

        <button
          type="button"
          id="tab-tasks"
          role="tab"
          aria-selected={activeTab === 'tasks'}
          aria-controls="panel-tasks"
          tabIndex={activeTab === 'tasks' ? 0 : -1}
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Checklist & Tasks ({eventData.tasks?.length || 0})</span>
        </button>

        <button
          type="button"
          id="tab-vendors"
          role="tab"
          aria-selected={activeTab === 'vendors'}
          aria-controls="panel-vendors"
          tabIndex={activeTab === 'vendors' ? 0 : -1}
          className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          <Briefcase size={16} aria-hidden="true" />
          <span>Vendors ({eventData.vendors?.length || 0})</span>
        </button>

        <button
          type="button"
          id="tab-expenses"
          role="tab"
          aria-selected={activeTab === 'expenses'}
          aria-controls="panel-expenses"
          tabIndex={activeTab === 'expenses' ? 0 : -1}
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={16} aria-hidden="true" />
          <span>Expenses & Ledger ({eventData.expenses?.length || 0})</span>
        </button>

        <button
          type="button"
          id="tab-guests"
          role="tab"
          aria-selected={activeTab === 'guests'}
          aria-controls="panel-guests"
          tabIndex={activeTab === 'guests' ? 0 : -1}
          className={`tab-btn ${activeTab === 'guests' ? 'active' : ''}`}
          onClick={() => setActiveTab('guests')}
        >
          <UserCheck size={16} aria-hidden="true" />
          <span>Guest Roster & RSVP ({eventData.guests?.length || 0})</span>
        </button>

        <button
          type="button"
          id="tab-schedule"
          role="tab"
          aria-selected={activeTab === 'schedule'}
          aria-controls="panel-schedule"
          tabIndex={activeTab === 'schedule' ? 0 : -1}
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays size={16} aria-hidden="true" />
          <span>Day-of Run Sheet ({eventData.schedule?.length || 0})</span>
        </button>

        <button
          type="button"
          id="tab-posters"
          role="tab"
          aria-selected={activeTab === 'posters'}
          aria-controls="panel-posters"
          tabIndex={activeTab === 'posters' ? 0 : -1}
          className={`tab-btn ${activeTab === 'posters' ? 'active' : ''}`}
          onClick={() => setActiveTab('posters')}
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>AI Poster Studio</span>
        </button>

        <button
          type="button"
          id="tab-ideas"
          role="tab"
          aria-selected={activeTab === 'ideas'}
          aria-controls="panel-ideas"
          tabIndex={activeTab === 'ideas' ? 0 : -1}
          className={`tab-btn ${activeTab === 'ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          <Lightbulb size={16} aria-hidden="true" />
          <span>AI Creative Themes</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content-area">
        {activeTab === 'dashboard' && (
          <div
            role="tabpanel"
            id="panel-dashboard"
            aria-labelledby="tab-dashboard"
            tabIndex={0}
            className="space-y-6 outline-none"
          >
            <InsightsList
              insights={plan?.insights}
              ideas={ideas}
              onGenerateIdeas={handleGenerateIdeas}
              isGenerating={isGeneratingIdeas}
            />
            <BudgetBreakdown budget={budget} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div
            role="tabpanel"
            id="panel-tasks"
            aria-labelledby="tab-tasks"
            tabIndex={0}
            className="outline-none"
          >
            <TaskChecklist
              tasks={eventData.tasks || []}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div
            role="tabpanel"
            id="panel-vendors"
            aria-labelledby="tab-vendors"
            tabIndex={0}
            className="outline-none"
          >
            <VendorManager
              vendors={eventData.vendors || []}
              currency={budget.currency || 'USD'}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div
            role="tabpanel"
            id="panel-expenses"
            aria-labelledby="tab-expenses"
            tabIndex={0}
            className="outline-none"
          >
            <ExpenseTracker
              expenses={eventData.expenses || []}
              budgetTotal={budget.total || 0}
              currency={budget.currency || 'USD'}
              vendors={eventData.vendors || []}
              tasks={eventData.tasks || []}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        )}

        {activeTab === 'guests' && (
          <div
            role="tabpanel"
            id="panel-guests"
            aria-labelledby="tab-guests"
            tabIndex={0}
            className="outline-none"
          >
            <GuestManager
              guests={eventData.guests || []}
              targetCount={summary.guestCount || 0}
              onAddGuest={handleAddGuest}
              onUpdateGuest={handleUpdateGuest}
              onDeleteGuest={handleDeleteGuest}
              onImportGuests={handleImportGuests}
            />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div
            role="tabpanel"
            id="panel-schedule"
            aria-labelledby="tab-schedule"
            tabIndex={0}
            className="outline-none"
          >
            <EventSchedule
              schedule={eventData.schedule || []}
              vendors={eventData.vendors || []}
              eventName={summary.eventName}
              eventDate={summary.date}
              onAddScheduleItem={handleAddScheduleItem}
              onUpdateScheduleItem={handleUpdateScheduleItem}
              onDeleteScheduleItem={handleDeleteScheduleItem}
            />
          </div>
        )}

        {activeTab === 'posters' && (
          <div
            role="tabpanel"
            id="panel-posters"
            aria-labelledby="tab-posters"
            tabIndex={0}
            className="outline-none"
          >
            <PosterStudio
              eventId={id}
              eventData={eventData}
              posters={eventData.posters || []}
              onSavePoster={handleSavePoster}
              onDeletePoster={handleDeletePoster}
            />
          </div>
        )}

        {activeTab === 'ideas' && (
          <div
            role="tabpanel"
            id="panel-ideas"
            aria-labelledby="tab-ideas"
            tabIndex={0}
            className="outline-none"
          >
            <InsightsList
              insights={plan?.insights}
              ideas={ideas}
              onGenerateIdeas={handleGenerateIdeas}
              isGenerating={isGeneratingIdeas}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
