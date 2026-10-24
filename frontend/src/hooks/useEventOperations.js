import { useState, useCallback } from 'react';
import { eventService } from '../services/event.service.js';

/**
 * Custom hook to encapsulate all event sub-entity mutations and async operations.
 * Separates presentation logic in EventDetail from service communication and state management.
 */
export function useEventOperations(eventId, setEventData, setStatusAnnouncement) {
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [opError, setOpError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    onConfirm: null,
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  const announce = useCallback(
    (msg) => {
      if (setStatusAnnouncement) setStatusAnnouncement(msg);
    },
    [setStatusAnnouncement]
  );

  const handleError = useCallback(
    (err, fallbackMsg) => {
      const msg = err?.message || fallbackMsg;
      setOpError(msg);
      announce(`Error: ${msg}`);
    },
    [announce]
  );

  /* ========================================================================
     TASK HANDLERS
     ======================================================================== */
  const handleToggleTask = useCallback(
    async (taskId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateTask(eventId, taskId, updates);
        setEventData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? res.data.task : t)),
          metrics: res.data.metrics,
        }));
        announce(`Task marked ${updates.status || 'updated'}.`);
      } catch (err) {
        handleError(err, 'Failed to update task.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleAddTask = useCallback(
    async (taskData) => {
      setOpError('');
      try {
        const res = await eventService.createTask(eventId, taskData);
        setEventData((prev) => ({
          ...prev,
          tasks: [...(prev.tasks || []), res.data.task],
          metrics: res.data.metrics,
        }));
        announce('Task added successfully.');
      } catch (err) {
        handleError(err, 'Failed to add task.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleUpdateTask = useCallback(
    async (taskId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateTask(eventId, taskId, updates);
        setEventData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? res.data.task : t)),
          metrics: res.data.metrics,
        }));
        announce('Task details updated.');
      } catch (err) {
        handleError(err, 'Failed to update task.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeleteTask = useCallback(
    (taskId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Task',
        message: 'Are you sure you want to delete this task? This action cannot be undone.',
        confirmLabel: 'Delete Task',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deleteTask(eventId, taskId);
            setEventData((prev) => ({
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== taskId),
              metrics: res.data.metrics,
            }));
            announce('Task removed.');
          } catch (err) {
            handleError(err, 'Failed to delete task.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     VENDOR HANDLERS
     ======================================================================== */
  const handleAddVendor = useCallback(
    async (vendorData) => {
      setOpError('');
      try {
        const res = await eventService.createVendor(eventId, vendorData);
        setEventData((prev) => ({
          ...prev,
          vendors: [...(prev.vendors || []), res.data.vendor],
          metrics: res.data.metrics,
        }));
        announce('Vendor record added.');
      } catch (err) {
        handleError(err, 'Failed to add vendor record.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleUpdateVendor = useCallback(
    async (vendorId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateVendor(eventId, vendorId, updates);
        setEventData((prev) => ({
          ...prev,
          vendors: prev.vendors.map((v) => (v.id === vendorId ? res.data.vendor : v)),
          metrics: res.data.metrics,
        }));
        announce('Vendor record updated.');
      } catch (err) {
        handleError(err, 'Failed to update vendor record.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeleteVendor = useCallback(
    (vendorId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Remove Vendor',
        message: 'Are you sure you want to remove this vendor record? This action cannot be undone.',
        confirmLabel: 'Remove Vendor',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deleteVendor(eventId, vendorId);
            setEventData((prev) => ({
              ...prev,
              vendors: prev.vendors.filter((v) => v.id !== vendorId),
              metrics: res.data.metrics,
            }));
            announce('Vendor record removed.');
          } catch (err) {
            handleError(err, 'Failed to delete vendor record.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     EXPENSE HANDLERS
     ======================================================================== */
  const handleAddExpense = useCallback(
    async (expenseData) => {
      setOpError('');
      try {
        const res = await eventService.createExpense(eventId, expenseData);
        setEventData((prev) => ({
          ...prev,
          expenses: [...(prev.expenses || []), res.data.expense],
          metrics: res.data.metrics,
        }));
        announce('Expense recorded.');
      } catch (err) {
        handleError(err, 'Failed to add expense.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleUpdateExpense = useCallback(
    async (expenseId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateExpense(eventId, expenseId, updates);
        setEventData((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === expenseId ? res.data.expense : e)),
          metrics: res.data.metrics,
        }));
        announce('Expense updated.');
      } catch (err) {
        handleError(err, 'Failed to update expense.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeleteExpense = useCallback(
    (expenseId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Remove Expense',
        message: 'Are you sure you want to remove this expense record?',
        confirmLabel: 'Remove Expense',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deleteExpense(eventId, expenseId);
            setEventData((prev) => ({
              ...prev,
              expenses: prev.expenses.filter((e) => e.id !== expenseId),
              metrics: res.data.metrics,
            }));
            announce('Expense removed.');
          } catch (err) {
            handleError(err, 'Failed to delete expense.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     GUEST HANDLERS
     ======================================================================== */
  const handleAddGuest = useCallback(
    async (guestData) => {
      setOpError('');
      try {
        const res = await eventService.createGuest(eventId, guestData);
        setEventData((prev) => ({
          ...prev,
          guests: [...(prev.guests || []), res.data.guest],
          metrics: res.data.metrics,
        }));
        announce('Guest added successfully.');
      } catch (err) {
        handleError(err, 'Failed to add guest.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleUpdateGuest = useCallback(
    async (guestId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateGuest(eventId, guestId, updates);
        setEventData((prev) => ({
          ...prev,
          guests: prev.guests.map((g) => (g.id === guestId ? res.data.guest : g)),
          metrics: res.data.metrics,
        }));
        announce('Guest information updated.');
      } catch (err) {
        handleError(err, 'Failed to update guest.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeleteGuest = useCallback(
    (guestId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Remove Guest',
        message: 'Are you sure you want to remove this guest from the invitation list?',
        confirmLabel: 'Remove Guest',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deleteGuest(eventId, guestId);
            setEventData((prev) => ({
              ...prev,
              guests: prev.guests.filter((g) => g.id !== guestId),
              metrics: res.data.metrics,
            }));
            announce('Guest removed.');
          } catch (err) {
            handleError(err, 'Failed to delete guest.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleImportGuests = useCallback(
    async (guestsList) => {
      setOpError('');
      try {
        const res = await eventService.importGuests(eventId, guestsList);
        setEventData((prev) => ({
          ...prev,
          guests: res.data.guests,
          metrics: res.data.metrics,
        }));
        announce(`Successfully imported ${guestsList.length} guests.`);
      } catch (err) {
        handleError(err, 'Failed to import guests.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     SCHEDULE / RUN SHEET HANDLERS
     ======================================================================== */
  const handleAddScheduleItem = useCallback(
    async (itemData) => {
      setOpError('');
      try {
        const res = await eventService.createScheduleItem(eventId, itemData);
        setEventData((prev) => ({
          ...prev,
          schedule: [...(prev.schedule || []), res.data.item],
          metrics: res.data.metrics,
        }));
        announce('Schedule item added.');
      } catch (err) {
        handleError(err, 'Failed to add schedule item.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleUpdateScheduleItem = useCallback(
    async (itemId, updates) => {
      setOpError('');
      try {
        const res = await eventService.updateScheduleItem(eventId, itemId, updates);
        setEventData((prev) => ({
          ...prev,
          schedule: prev.schedule.map((s) => (s.id === itemId ? res.data.item : s)),
          metrics: res.data.metrics,
        }));
        announce('Schedule item updated.');
      } catch (err) {
        handleError(err, 'Failed to update schedule item.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeleteScheduleItem = useCallback(
    (itemId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Schedule Item',
        message: 'Are you sure you want to delete this schedule activity?',
        confirmLabel: 'Delete Item',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deleteScheduleItem(eventId, itemId);
            setEventData((prev) => ({
              ...prev,
              schedule: prev.schedule.filter((s) => s.id !== itemId),
              metrics: res.data.metrics,
            }));
            announce('Schedule item removed.');
          } catch (err) {
            handleError(err, 'Failed to delete schedule item.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     POSTER HANDLERS
     ======================================================================== */
  const handleSavePoster = useCallback(
    async (posterData) => {
      setOpError('');
      try {
        const res = await eventService.savePoster(eventId, posterData);
        setEventData((prev) => ({
          ...prev,
          posters: res.data.posters,
        }));
        announce('Poster design saved to portfolio.');
      } catch (err) {
        handleError(err, 'Failed to save poster.');
      }
    },
    [eventId, setEventData, announce, handleError]
  );

  const handleDeletePoster = useCallback(
    (posterId) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Saved Poster',
        message: 'Are you sure you want to remove this saved poster from your studio?',
        confirmLabel: 'Delete Poster',
        onConfirm: async () => {
          setOpError('');
          try {
            const res = await eventService.deletePoster(eventId, posterId);
            setEventData((prev) => ({
              ...prev,
              posters: res.data.posters,
            }));
            announce('Poster removed.');
          } catch (err) {
            handleError(err, 'Failed to delete poster.');
          }
        },
      });
    },
    [eventId, setEventData, announce, handleError]
  );

  /* ========================================================================
     AI IDEAS HANDLER
     ======================================================================== */
  const handleGenerateIdeas = useCallback(async () => {
    setOpError('');
    setIsGeneratingIdeas(true);
    try {
      const res = await eventService.generateIdeas(eventId);
      setEventData((prev) => ({
        ...prev,
        ideas: res.data.ideas,
      }));
      announce('New AI inspirations generated successfully.');
    } catch (err) {
      handleError(err, 'Failed to synthesize creative ideas.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [eventId, setEventData, announce, handleError]);

  return {
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
  };
}
