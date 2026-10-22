import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventForm } from '../hooks/useEventForm.js';
import EventForm from '../components/event/EventForm.jsx';
import BudgetBreakdown from '../components/event/BudgetBreakdown.jsx';
import VendorChecklist from '../components/event/VendorChecklist.jsx';
import InsightsList from '../components/event/InsightsList.jsx';
import { Printer, Calendar, Users, DollarSign, Clock, RotateCcw } from 'lucide-react';


export default function CreateEvent() {
  const navigate = useNavigate();
  const formHook = useEventForm();
  const { planResult, resetForm } = formHook;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="create-event-page container py-8">
      {!planResult ? (
        <div className="form-page-layout">
          <div className="form-page-header">
            <h1 className="page-title">Design Your Next Event</h1>
            <p className="page-subtitle">
              Enter your event constraints, priorities, and vibe. We'll automatically calculate
              precise category allocations, vendor timelines, and personalized creative concepts.
            </p>
          </div>

          <div className="card form-card">
            <EventForm {...formHook} />
          </div>
        </div>
      ) : (
        <div className="plan-results-view">
          <div className="results-top-bar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              <RotateCcw size={16} />
              <span>Plan Another Event</span>
            </button>

            <div className="results-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePrint}
              >
                <Printer size={16} />
                <span>Print Plan</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/dashboard')}
              >
                <span>Go to Saved Events</span>
              </button>
            </div>
          </div>

          {/* Plan Summary Banner */}
          {(() => {
            const plan = planResult.plan || planResult || {};
            const summary = plan.summary || {};
            const budget = plan.budget || {};
            const vendors = plan.vendors || [];
            const insights = plan.insights || [];
            const ideas = planResult.ideas || plan.ideas;

            return (
              <>
                <div className="card summary-banner my-6">
                  <div className="summary-banner-content">
                    <span className={`badge badge-type badge-${summary.eventType || 'wedding'}`}>
                      {summary.eventLabel || summary.eventType || 'Event Plan'}
                    </span>
                    <h2 className="summary-title">
                      {summary.eventName || 'Your Tailored Event Plan'}
                    </h2>
                    <div className="summary-metrics-row">
                      <div className="metric-pill">
                        <Calendar size={16} />
                        <span>{summary.date || 'Scheduled'}</span>
                      </div>
                      {summary.daysToGo !== undefined && (
                        <div className="metric-pill">
                          <Clock size={16} />
                          <span>{summary.daysToGo} days to go</span>
                        </div>
                      )}
                      <div className="metric-pill">
                        <Users size={16} />
                        <span>{summary.guestCount} guests</span>
                      </div>
                      <div className="metric-pill">
                        <DollarSign size={16} />
                        <span>
                          {budget.currency || 'USD'} {budget.total ? Number(budget.total).toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sections: Insights & Ideas, Budget, Vendors */}
                <div className="plan-sections-stack">
                  <InsightsList insights={insights} ideas={ideas} />
                  <BudgetBreakdown budget={budget} />
                  <VendorChecklist vendors={vendors} />
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
