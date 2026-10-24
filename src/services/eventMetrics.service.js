/**
 * Progress weighting ratios for overall preparation index.
 */
export const PROGRESS_WEIGHTS = Object.freeze({
  TASKS: 0.45,
  VENDORS: 0.45,
  SCHEDULE: 10,
});

/** Default sample run-sheet activities by event type */
export function getDefaultSchedule(eventType) {
  if (eventType === "wedding") {
    return [
      { id: "sch-1", startTime: "10:00 AM", endTime: "12:00 PM", activity: "Bridal Party & Groom Preparation", location: "Dressing Suites", responsiblePerson: "Wedding Coordinator", notes: "Hair and makeup arrival", completed: false },
      { id: "sch-2", startTime: "01:00 PM", endTime: "02:00 PM", activity: "First Look & Couple Portraits", location: "Main Gardens", responsiblePerson: "Photographer", notes: "Prepare floral bouquets", completed: false },
      { id: "sch-3", startTime: "03:00 PM", endTime: "04:00 PM", activity: "Guest Arrival & Welcome Refreshments", location: "Foyer / Lawn", responsiblePerson: "Usher Team", notes: "Ambient acoustic music", completed: false },
      { id: "sch-4", startTime: "04:00 PM", endTime: "04:45 PM", activity: "Ceremony & Exchange of Vows", location: "Ceremony Arch", responsiblePerson: "Officiant", notes: "Microphone check 30m prior", completed: false },
      { id: "sch-5", startTime: "05:00 PM", endTime: "06:30 PM", activity: "Cocktail Hour & Passed Hors d'oeuvres", location: "Terrace Bar", responsiblePerson: "Catering Lead", notes: "Signature mocktails/drinks", completed: false },
      { id: "sch-6", startTime: "06:30 PM", endTime: "08:30 PM", activity: "Grand Entrance, Toasts & Dinner Service", location: "Ballroom", responsiblePerson: "Maid of Honor / Best Man", notes: "Toasts capped at 3m each", completed: false },
      { id: "sch-7", startTime: "08:30 PM", endTime: "11:00 PM", activity: "Cake Cutting, First Dance & Party", location: "Dance Floor", responsiblePerson: "DJ / Band", notes: "Lighting transition", completed: false },
    ];
  }
  if (eventType === "birthday") {
    return [
      { id: "sch-1", startTime: "02:00 PM", endTime: "03:00 PM", activity: "Venue Setup & Decor Styling", location: "Party Space", responsiblePerson: "Host & Decorator", notes: "Balloons and backdrop", completed: false },
      { id: "sch-2", startTime: "03:30 PM", endTime: "04:00 PM", activity: "Guest Arrival & Welcome Drinks", location: "Entrance / Lounge", responsiblePerson: "Host", notes: "Sign-in guestbook", completed: false },
      { id: "sch-3", startTime: "04:00 PM", endTime: "05:30 PM", activity: "Interactive Games & Activities", location: "Main Hall / Yard", responsiblePerson: "Activity Host", notes: "Music playlist ready", completed: false },
      { id: "sch-4", startTime: "05:30 PM", endTime: "06:45 PM", activity: "Buffet Dinner / Food Service", location: "Dining Area", responsiblePerson: "Caterer", notes: "Dietary tags labeled", completed: false },
      { id: "sch-5", startTime: "06:45 PM", endTime: "07:15 PM", activity: "Cake Cutting & Birthday Toast", location: "Center Stage", responsiblePerson: "Honoree & Family", notes: "Candles and lighter ready", completed: false },
      { id: "sch-6", startTime: "07:15 PM", endTime: "09:00 PM", activity: "Open Dance Floor & Dessert Bar", location: "Dance Floor", responsiblePerson: "DJ", notes: "Party favors distributed", completed: false },
    ];
  }
  return [
    { id: "sch-1", startTime: "08:00 AM", endTime: "09:30 AM", activity: "Logistics Setup & Safety Inspection", location: "Event Grounds", responsiblePerson: "Logistics Lead", notes: "Tables, tents & power supply", completed: false },
    { id: "sch-2", startTime: "09:30 AM", endTime: "10:00 AM", activity: "Volunteer & Staff Briefing", location: "Information Desk", responsiblePerson: "Event Director", notes: "Handout walkie-talkies", completed: false },
    { id: "sch-3", startTime: "10:00 AM", endTime: "10:30 AM", activity: "Gates Open & Welcome Speech", location: "Main Stage", responsiblePerson: "Community Chair", notes: "PA system check", completed: false },
    { id: "sch-4", startTime: "10:30 AM", endTime: "01:00 PM", activity: "Workshops, Stalls & Performances", location: "Activity Zones", responsiblePerson: "Zone Coordinators", notes: "Rotate safety staff", completed: false },
    { id: "sch-5", startTime: "01:00 PM", endTime: "02:30 PM", activity: "Community Feast & Music", location: "Dining Tents", responsiblePerson: "Food Vendors", notes: "Recycling stations active", completed: false },
    { id: "sch-6", startTime: "03:00 PM", endTime: "04:00 PM", activity: "Closing Remarks & Awards", location: "Main Stage", responsiblePerson: "Organizing Committee", notes: "Trophy presentations", completed: false },
    { id: "sch-7", startTime: "04:00 PM", endTime: "06:00 PM", activity: "Teardown, Clean-up & Waste Audit", location: "Entire Grounds", responsiblePerson: "Clean-up Volunteers", notes: "Leave-no-trace check", completed: false },
  ];
}

/**
 * Computes live derived progress metrics for an event without mutating data.
 * Guarantees no double counting: expenses are summed strictly from the expenses list.
 *
 * @param {object} event
 * @returns {object} Derived metrics
 */
export function computeMetrics(event) {
  const tasks = event.tasks || [];
  const vendors = event.vendors || [];
  const expenses = event.expenses || [];
  const guests = event.guests || [];
  const schedule = event.schedule || [];

  // 1. Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const todayIso = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status === "pending" && t.dueDate && t.dueDate < todayIso,
  ).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Vendor metrics
  const totalVendors = vendors.length;
  const bookedVendors = vendors.filter((v) => v.bookingStatus === "booked").length;
  const contactedVendors = vendors.filter((v) => v.bookingStatus === "contacted").length;
  const pendingVendors = vendors.filter(
    (v) => !v.bookingStatus || v.bookingStatus === "pending",
  ).length;
  const declinedVendors = vendors.filter((v) => v.bookingStatus === "declined").length;
  const vendorProgress = totalVendors > 0 ? Math.round((bookedVendors / totalVendors) * 100) : 0;

  // 3. Accurate Budget & Expenses (strictly 1:1, never double counted)
  const totalBudget = Number(event.plan?.budget?.total || event.input?.budget || 0);
  const totalEstimatedCost = expenses.reduce((sum, e) => sum + (Number(e.estimatedCost) || 0), 0);
  const totalActualCost = expenses.reduce((sum, e) => sum + (Number(e.actualCost) || 0), 0);
  const totalPaidAmount = expenses.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const outstandingBalance = Math.max(0, totalActualCost - totalPaidAmount);
  const remainingBudget = totalBudget - totalActualCost;

  // 4. Guest metrics
  const totalInvited = guests.length;
  const attendingGuests = guests.filter((g) => g.rsvpStatus === "attending");
  const attendingCount = attendingGuests.reduce(
    (sum, g) => sum + 1 + (Number(g.plusOnes) || 0),
    0,
  );
  const declinedCount = guests.filter((g) => g.rsvpStatus === "declined").length;
  const pendingRsvpCount = guests.filter(
    (g) => g.rsvpStatus === "pending" || g.rsvpStatus === "tentative",
  ).length;

  // 5. Schedule metrics
  const totalScheduleItems = schedule.length;
  const completedScheduleItems = schedule.filter((s) => s.completed).length;

  // 6. Overall Weighted Preparation Progress (Tasks 45%, Vendors 45%, Schedule 10%)
  let overallProgress = 0;
  if (totalTasks > 0 && totalVendors > 0) {
    const scheduleContrib = totalScheduleItems > 0
      ? (completedScheduleItems / totalScheduleItems) * PROGRESS_WEIGHTS.SCHEDULE
      : PROGRESS_WEIGHTS.SCHEDULE;
    overallProgress = Math.round(
      taskProgress * PROGRESS_WEIGHTS.TASKS +
      vendorProgress * PROGRESS_WEIGHTS.VENDORS +
      scheduleContrib,
    );
  } else if (totalTasks > 0) {
    overallProgress = taskProgress;
  } else if (totalVendors > 0) {
    overallProgress = vendorProgress;
  }

  return {
    overallProgress: Math.min(100, Math.max(0, overallProgress)),
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      progressPercent: taskProgress,
    },
    vendors: {
      total: totalVendors,
      booked: bookedVendors,
      contacted: contactedVendors,
      pending: pendingVendors,
      declined: declinedVendors,
      progressPercent: vendorProgress,
    },
    budget: {
      totalBudget,
      currency: event.plan?.budget?.currency || event.input?.currency || "USD",
      totalEstimatedCost,
      totalActualCost,
      totalPaidAmount,
      outstandingBalance,
      remainingBudget,
      isOverBudget: remainingBudget < 0,
      spentPercentage: totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0,
    },
    guests: {
      totalInvited,
      attending: attendingCount,
      declined: declinedCount,
      pending: pendingRsvpCount,
    },
    schedule: {
      total: totalScheduleItems,
      completed: completedScheduleItems,
    },
  };
}
