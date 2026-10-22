import { useState } from 'react';
import { eventService } from '../services/event.service.js';
import { validateEventForm } from '../utils/validators.js';

const INITIAL_FORM = {
  eventType: 'wedding',
  eventName: '',
  date: '',
  guestCount: 100,
  budget: 20000,
  currency: 'USD',
  setting: 'indoor',
  vibe: '',
  honoreeAge: '',
  priorities: [],
  considerations: [],
  notes: '',
  useAI: true,
};

export function useEventForm(onSuccess) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [planResult, setPlanResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePriorityToggle = (priorityValue) => {
    setFormData((prev) => {
      const exists = prev.priorities.includes(priorityValue);
      const nextPriorities = exists
        ? prev.priorities.filter((p) => p !== priorityValue)
        : [...prev.priorities, priorityValue];
      return { ...prev, priorities: nextPriorities };
    });
  };

  const handleConsiderationToggle = (consValue) => {
    setFormData((prev) => {
      const exists = prev.considerations.includes(consValue);
      const nextCons = exists
        ? prev.considerations.filter((c) => c !== consValue)
        : [...prev.considerations, consValue];
      return { ...prev, considerations: nextCons };
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setApiError('');

    const validationErrors = validateEventForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        guestCount: Number(formData.guestCount),
        budget: Number(formData.budget),
      };

      if (payload.eventType === 'birthday' && payload.honoreeAge !== '') {
        payload.honoreeAge = Number(payload.honoreeAge);
      } else {
        delete payload.honoreeAge;
      }

      const res = await eventService.createEvent(payload);
      setPlanResult(res.data);
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
      setApiError(err.message || 'Failed to generate event plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setPlanResult(null);
    setApiError('');
  };

  return {
    formData,
    errors,
    submitting,
    apiError,
    planResult,
    handleChange,
    handlePriorityToggle,
    handleConsiderationToggle,
    handleSubmit,
    resetForm,
  };
}

export default useEventForm;
