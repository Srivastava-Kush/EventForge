import { CURRENCIES, EVENT_TYPES, SETTINGS } from '../constants/index.js';

export function validateEventForm(values) {
  const errors = {};

  if (!values.eventType || !EVENT_TYPES.some((t) => t.value === values.eventType)) {
    errors.eventType = 'Choose wedding, birthday or community event.';
  }

  if (values.eventName && values.eventName.length > 80) {
    errors.eventName = 'Event name cannot exceed 80 characters.';
  }

  if (!values.date) {
    errors.date = 'Choose the event date.';
  } else {
    const parsedDate = new Date(values.date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = 'Use a valid date in YYYY-MM-DD format.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // 1 day grace
      const graceDate = new Date(today);
      graceDate.setDate(graceDate.getDate() - 1);

      if (parsedDate < graceDate) {
        errors.date = 'The event date cannot be in the past.';
      }

      const maxDate = new Date(today);
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      if (parsedDate > maxDate) {
        errors.date = 'Events can only be planned up to 5 years in advance.';
      }
    }
  }

  const guestCount = Number(values.guestCount);
  if (!values.guestCount && values.guestCount !== 0) {
    errors.guestCount = 'Enter the number of guests.';
  } else if (!Number.isInteger(guestCount)) {
    errors.guestCount = 'Use a whole number of guests.';
  } else if (guestCount < 1) {
    errors.guestCount = 'Plan for at least 1 guest.';
  } else if (guestCount > 5000) {
    errors.guestCount = 'Plans support up to 5000 guests.';
  }

  const budget = Number(values.budget);
  if (!values.budget && values.budget !== 0) {
    errors.budget = 'Enter your total budget.';
  } else if (isNaN(budget) || budget < 50) {
    errors.budget = 'Enter a budget of at least 50.';
  } else if (budget > 100000000) {
    errors.budget = 'Enter a budget of at most 100,000,000.';
  }

  if (!values.currency || !CURRENCIES.includes(values.currency)) {
    errors.currency = `Choose one of: ${CURRENCIES.join(', ')}.`;
  }

  if (values.setting && !SETTINGS.some((s) => s.value === values.setting)) {
    errors.setting = 'Choose indoor, outdoor or hybrid.';
  }

  if (values.eventType === 'birthday' && values.honoreeAge !== undefined && values.honoreeAge !== '') {
    const age = Number(values.honoreeAge);
    if (isNaN(age) || !Number.isInteger(age)) {
      errors.honoreeAge = 'Use a whole number.';
    } else if (age < 0) {
      errors.honoreeAge = "Age can't be negative.";
    } else if (age > 120) {
      errors.honoreeAge = 'Enter an age up to 120.';
    }
  }

  if (values.vibe && values.vibe.length > 200) {
    errors.vibe = 'Vibe must be 200 characters or less.';
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or less.';
  }

  return errors;
}

export function validateAuthForm(values, mode = 'login') {
  const errors = {};

  if (mode === 'register') {
    if (!values.name || !values.name.trim()) {
      errors.name = 'Name is required.';
    } else if (values.name.trim().length > 80) {
      errors.name = 'Name must be at most 80 characters.';
    }
  }

  if (!values.email || !values.email.trim()) {
    errors.email = 'A valid email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'A valid email is required.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  return errors;
}
