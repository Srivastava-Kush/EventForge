import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/event.service.js';
import EventCard from '../components/event/EventCard.jsx';
import Loader from '../components/common/Loader.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import {
  PlusCircle,
  Calendar,
  Sparkles,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    eventId: null,
  });

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await eventService.getEvents();
        if (!ignore) {
          setEvents(res.data || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Could not load your saved events.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = (eventId) => {
    setConfirmModal({
      isOpen: true,
      eventId,
    });
  };

  const handleConfirmDelete = async () => {
    const eventId = confirmModal.eventId;
    if (!eventId) return;
    setDeleteError('');
    try {
      await eventService.deleteEvent(eventId);
      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete event plan.');
    }
  };

  // Derive aggregate portfolio readiness metrics from stored database data
  const totalEvents = events.length;
  const totalTasks = events.reduce((sum, e) => sum + (e.metrics?.tasks?.total || 0), 0);
  const totalTasksCompleted = events.reduce((sum, e) => sum + (e.metrics?.tasks?.completed || 0), 0);
  const totalOverdueTasks = events.reduce((sum, e) => sum + (e.metrics?.tasks?.overdue || 0), 0);

  const totalVendors = events.reduce((sum, e) => sum + (e.metrics?.vendors?.total || 0), 0);
  const totalVendorsBooked = events.reduce((sum, e) => sum + (e.metrics?.vendors?.booked || 0), 0);

  const totalActualSpent = events.reduce((sum, e) => sum + (e.metrics?.budget?.totalActualCost || 0), 0);
  const totalAllocatedBudget = events.reduce((sum, e) => sum + (e.metrics?.budget?.totalBudget || 0), 0);

  const totalConfirmedGuests = events.reduce((sum, e) => sum + (e.metrics?.guests?.attending || 0), 0);

  const overallAvgProgress =
    totalEvents > 0
      ? Math.round(events.reduce((sum, e) => sum + (e.metrics?.overallProgress || 0), 0) / totalEvents)
      : 0;

  return (
    <div className="dashboard-page container py-8">
      <div className="dashboard-header flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">My Event Portfolio</h1>
          <p className="page-subtitle text-sm text-muted mt-1">
            Real-time tracking of tasks, vendor contracts, itemized expenses, and guest RSVPs.
          </p>
        </div>
        <Link to="/create-event" className="btn btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          <span>Plan New Event</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-error my-4">
          <AlertCircle size={16} className="inline-icon" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="my-12">
          <Loader text="Retrieving your event portfolio..." />
        </div>
      ) : events.length === 0 ? (
        <div className="card empty-dashboard-card text-center my-8 p-12">
          <Calendar size={48} className="empty-icon mx-auto text-primary-dim mb-4" />
          <h2 className="empty-title text-xl font-bold mb-2">No events planned yet</h2>
          <p className="empty-desc text-muted mb-6 max-w-md mx-auto">
            Get started by creating your first personalized event plan. Our AI will craft vendor
            timelines, budget breakdowns, and creative themes.
          </p>
          <Link to="/create-event" className="btn btn-primary inline-flex items-center gap-2">
            <Sparkles size={18} />
            <span>Create Your First Plan</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Overdue alert if any event has overdue items */}
          {totalOverdueTasks > 0 && (
            <div className="alert alert-warning mb-6 py-2.5 px-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-warning flex-shrink-0" />
              <span className="text-sm">
                <strong>Attention:</strong> You have <strong>{totalOverdueTasks} overdue task{totalOverdueTasks > 1 ? 's' : ''}</strong> across your active events. Open your event plans to review deadlines.
              </span>
            </div>
          )}

          {/* Aggregate Portfolio Command Center Card */}
          <div className="card bg-card-solid border border-card p-5 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-main">
                  Portfolio Readiness & Execution Summary
                </h3>
              </div>
              <span className="badge badge-sm badge-outline">
                {totalEvents} Active Event{totalEvents > 1 ? 's' : ''} • Avg {overallAvgProgress}% Prepared
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-bg-input/60 p-3.5 rounded-lg border border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-faint uppercase font-semibold">Checklist Tasks</span>
                  <CheckCircle2 size={15} className="text-primary" />
                </div>
                <span className="text-lg font-bold text-main">
                  {totalTasksCompleted} / {totalTasks}
                </span>
                <span className="text-xs text-muted block mt-0.5">
                  {totalTasks - totalTasksCompleted} pending across portfolio
                </span>
              </div>

              <div className="bg-bg-input/60 p-3.5 rounded-lg border border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-faint uppercase font-semibold">Vendor Bookings</span>
                  <Briefcase size={15} className="text-secondary" />
                </div>
                <span className="text-lg font-bold text-main">
                  {totalVendorsBooked} / {totalVendors}
                </span>
                <span className="text-xs text-muted block mt-0.5">
                  {totalVendors - totalVendorsBooked} pending contracts
                </span>
              </div>

              <div className="bg-bg-input/60 p-3.5 rounded-lg border border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-faint uppercase font-semibold">Total Spending</span>
                  <DollarSign size={15} className="text-accent" />
                </div>
                <span className="text-lg font-bold text-accent">
                  ${totalActualSpent.toLocaleString()}
                </span>
                <span className="text-xs text-muted block mt-0.5">
                  Allocated: ${totalAllocatedBudget.toLocaleString()}
                </span>
              </div>

              <div className="bg-bg-input/60 p-3.5 rounded-lg border border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-faint uppercase font-semibold">Confirmed Guests</span>
                  <Users size={15} className="text-emerald" />
                </div>
                <span className="text-lg font-bold text-emerald">
                  {totalConfirmedGuests}
                </span>
                <span className="text-xs text-muted block mt-0.5">
                  Confirmed attendance
                </span>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="events-grid my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

      {deleteError && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 shadow-lg"
        >
          <AlertCircle size={18} />
          <span className="text-sm">{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError('')}
            className="text-xs font-bold px-1.5 py-0.5 ml-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Event Plan"
        message="Are you sure you want to permanently delete this event plan and all associated tasks, vendors, and expenses?"
        confirmLabel="Delete Plan"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, eventId: null })}
      />
    </div>
  );
}
