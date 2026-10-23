import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service.js';

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
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

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

  /* ========================================================================
     TASK HANDLERS
     ======================================================================== */
  const handleToggleTask = async (taskId, updates) => {
    try {
      const res = await eventService.updateTask(id, taskId, updates);
      setEventData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? res.data.task : t)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const res = await eventService.createTask(id, taskData);
      setEventData((prev) => ({
        ...prev,
        tasks: [...(prev.tasks || []), res.data.task],
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add task.');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await eventService.updateTask(id, taskId, updates);
      setEventData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? res.data.task : t)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await eventService.deleteTask(id, taskId);
      setEventData((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  /* ========================================================================
     VENDOR HANDLERS
     ======================================================================== */
  const handleAddVendor = async (vendorData) => {
    try {
      const res = await eventService.createVendor(id, vendorData);
      setEventData((prev) => ({
        ...prev,
        vendors: [...(prev.vendors || []), res.data.vendor],
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add vendor record.');
    }
  };

  const handleUpdateVendor = async (vendorId, updates) => {
    try {
      const res = await eventService.updateVendor(id, vendorId, updates);
      setEventData((prev) => ({
        ...prev,
        vendors: prev.vendors.map((v) => (v.id === vendorId ? res.data.vendor : v)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update vendor record.');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to remove this vendor record?')) return;
    try {
      const res = await eventService.deleteVendor(id, vendorId);
      setEventData((prev) => ({
        ...prev,
        vendors: prev.vendors.filter((v) => v.id !== vendorId),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete vendor record.');
    }
  };

  /* ========================================================================
     EXPENSE HANDLERS
     ======================================================================== */
  const handleAddExpense = async (expenseData) => {
    try {
      const res = await eventService.createExpense(id, expenseData);
      setEventData((prev) => ({
        ...prev,
        expenses: [...(prev.expenses || []), res.data.expense],
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add expense.');
    }
  };

  const handleUpdateExpense = async (expenseId, updates) => {
    try {
      const res = await eventService.updateExpense(id, expenseId, updates);
      setEventData((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) => (e.id === expenseId ? res.data.expense : e)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update expense.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to remove this expense record?')) return;
    try {
      const res = await eventService.deleteExpense(id, expenseId);
      setEventData((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expenseId),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  /* ========================================================================
     GUEST HANDLERS
     ======================================================================== */
  const handleAddGuest = async (guestData) => {
    try {
      const res = await eventService.createGuest(id, guestData);
      setEventData((prev) => ({
        ...prev,
        guests: [...(prev.guests || []), res.data.guest],
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add guest.');
    }
  };

  const handleUpdateGuest = async (guestId, updates) => {
    try {
      const res = await eventService.updateGuest(id, guestId, updates);
      setEventData((prev) => ({
        ...prev,
        guests: prev.guests.map((g) => (g.id === guestId ? res.data.guest : g)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update guest.');
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('Are you sure you want to remove this guest?')) return;
    try {
      const res = await eventService.deleteGuest(id, guestId);
      setEventData((prev) => ({
        ...prev,
        guests: prev.guests.filter((g) => g.id !== guestId),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete guest.');
    }
  };

  const handleImportGuests = async (guestsList) => {
    try {
      const res = await eventService.importGuests(id, guestsList);
      setEventData((prev) => ({
        ...prev,
        guests: res.data.guests,
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to import guests.');
    }
  };

  /* ========================================================================
     SCHEDULE / RUN SHEET HANDLERS
     ======================================================================== */
  const handleAddScheduleItem = async (itemData) => {
    try {
      const res = await eventService.createScheduleItem(id, itemData);
      setEventData((prev) => ({
        ...prev,
        schedule: [...(prev.schedule || []), res.data.item],
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add schedule item.');
    }
  };

  const handleUpdateScheduleItem = async (itemId, updates) => {
    try {
      const res = await eventService.updateScheduleItem(id, itemId, updates);
      setEventData((prev) => ({
        ...prev,
        schedule: prev.schedule.map((s) => (s.id === itemId ? res.data.item : s)),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update schedule item.');
    }
  };

  const handleDeleteScheduleItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this schedule item?')) return;
    try {
      const res = await eventService.deleteScheduleItem(id, itemId);
      setEventData((prev) => ({
        ...prev,
        schedule: prev.schedule.filter((s) => s.id !== itemId),
        metrics: res.data.metrics,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete schedule item.');
    }
  };

  /* ========================================================================
     POSTER HANDLERS
     ======================================================================== */
  const handleSavePoster = async (posterData) => {
    const res = await eventService.savePoster(id, posterData);
    setEventData((prev) => ({
      ...prev,
      posters: res.data.posters,
    }));
  };

  const handleDeletePoster = async (posterId) => {
    if (!window.confirm('Are you sure you want to remove this saved poster?')) return;
    try {
      const res = await eventService.deletePoster(id, posterId);
      setEventData((prev) => ({
        ...prev,
        posters: res.data.posters,
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete poster.');
    }
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const res = await eventService.generateIdeas(id);
      setEventData((prev) => ({
        ...prev,
        ideas: res.data.ideas,
      }));
    } catch (err) {
      alert(err.message || 'Failed to synthesize creative ideas.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

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
    </div>
  );
}
