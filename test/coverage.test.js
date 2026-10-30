/**
 * coverage.test.js
 * Targets the most significant uncovered code paths identified from the
 * coverage report: createEvent, chat service, poster suggestions,
 * sanitizeSvg edge cases, and branch conditions in sub-services.
 */
import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import Event from '../src/models/Event.model.js';
import ChatHistory from '../src/models/ChatHistory.model.js';
import * as eventService from '../src/services/event.service.js';
import * as chatService from '../src/services/chat.service.js';
import * as expenseService from '../src/services/expense.service.js';
import * as vendorService from '../src/services/vendor.service.js';
import * as guestService from '../src/services/guest.service.js';
import { buildPosterSuggestions } from '../src/services/poster.service.js';
import { sanitizeSvg } from '../src/utils/sanitizeSvg.js';
import {
  buildEventsSummary,
  buildActiveEventContext,
  buildChatSystemPrompt,
} from '../src/utils/promptBuilder.js';
import { HTTP_STATUS } from '../src/constants/httpStatus.js';
import { sendResponse } from '../src/utils/sendResponse.js';

/* ============================================================
   Shared mock event factory
   ============================================================ */
function makeMockEvent(overrides) {
  overrides = overrides || {};
  return {
    _id: 'evt-test',
    user: 'usr-test',
    type: 'wedding',
    input: {
      eventName: 'Priya & Arjun Wedding',
      eventType: 'wedding',
      budget: 50000,
      currency: 'USD',
      date: '2027-06-15',
      guestCount: 150,
      setting: 'outdoor',
      priorities: ['food', 'photography'],
      considerations: ['accessibility'],
      vibe: 'romantic garden',
      notes: '',
      useAI: false,
    },
    plan: {
      summary: { daysToGo: 230, tier: 'premium', eventName: 'Priya & Arjun Wedding', date: '2027-06-15' },
      budget: { total: 50000, currency: 'USD', perGuest: 333, tier: 'premium', items: [] },
      timeline: { tasks: [] },
      vendors: [],
      insights: [],
    },
    tasks: [],
    vendors: [],
    expenses: [],
    guests: [],
    schedule: [],
    posters: [],
    ideas: null,
    async save() { return this; },
    toObject() {
      const copy = Object.assign({}, this);
      delete copy.save;
      delete copy.toObject;
      return JSON.parse(JSON.stringify(copy));
    },
    ...overrides,
  };
}

/* ============================================================
   createEvent — covers lines 148-185 of event.service.js
   ============================================================ */
describe('createEvent service', () => {
  const origCreate = Event.create;

  afterEach(() => {
    Event.create = origCreate;
    eventService.configureEventService({ ideasService: null });
  });

  test('validates input and throws 422 on invalid data', async () => {
    await assert.rejects(
      () => eventService.createEvent({ eventType: 'invalid', guestCount: -1 }),
      (err) => err.statusCode === HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  });

  test('builds a plan and returns curated ideas without a user (no DB save)', async () => {
    const body = {
      eventType: 'birthday',
      date: '2027-03-15',
      guestCount: 30,
      budget: 2000,
      currency: 'USD',
      setting: 'indoor',
      useAI: false,
    };

    const result = await eventService.createEvent(body);
    assert.ok(result.plan);
    assert.ok(result.ideas);
    assert.equal(result.event, null);
    assert.equal(result.ideas.source, 'curated');
    assert.equal(result.plan.budget.total, 2000);
  });

  test('saves event to DB when user is provided', async () => {
    let savedDoc = null;
    Event.create = async (data) => {
      savedDoc = data;
      return Object.assign({ _id: 'new-evt-id' }, data);
    };

    const body = {
      eventType: 'community',
      date: '2027-09-20',
      guestCount: 200,
      budget: 10000,
      currency: 'USD',
      setting: 'outdoor',
      useAI: false,
    };

    const result = await eventService.createEvent(body, { user: { _id: 'user-abc' } });
    assert.ok(savedDoc);
    assert.equal(savedDoc.user, 'user-abc');
    assert.equal(savedDoc.type, 'community');
    assert.ok(Array.isArray(savedDoc.tasks));
    assert.ok(Array.isArray(savedDoc.vendors));
    assert.ok(Array.isArray(savedDoc.expenses));
    assert.equal(result.event._id, 'new-evt-id');
  });

  test('createEvent uses injected ideasService for AI ideas', async () => {
    Event.create = async (data) => Object.assign({ _id: 'evt-ai' }, data);

    const fakeIdeas = { themes: [{ name: 'Elegant', description: 'Beautiful' }], decor: ['Flowers'] };
    const mockIdeasService = {
      async getIdeas() { return { source: 'ai', ideas: fakeIdeas }; },
    };
    eventService.configureEventService({ ideasService: mockIdeasService });

    const body = {
      eventType: 'wedding',
      date: '2027-05-10',
      guestCount: 100,
      budget: 30000,
      currency: 'USD',
      setting: 'indoor',
      useAI: true,
    };

    const result = await eventService.createEvent(body, { user: { _id: 'usr-1' } });
    assert.equal(result.ideas.source, 'ai');
    assert.deepEqual(result.ideas.ideas, fakeIdeas);
  });
});

/* ============================================================
   Poster suggestions — covers lines 14-48 of poster.service.js
   ============================================================ */
describe('Poster service buildPosterSuggestions', () => {
  test('returns 4 styled suggestions with correct ids and palettes', () => {
    const event = makeMockEvent();
    const suggestions = buildPosterSuggestions(event);
    assert.equal(suggestions.length, 4);
    const ids = suggestions.map((s) => s.id);
    assert.ok(ids.includes('style-1'));
    assert.ok(ids.includes('style-4'));
    for (const s of suggestions) {
      assert.ok(s.name);
      assert.ok(s.style);
      assert.ok(s.prompt.length > 10);
      assert.ok(Array.isArray(s.palette) && s.palette.length > 0);
    }
  });

  test('uses eventName from plan summary when available', () => {
    const event = makeMockEvent({
      plan: {
        summary: { eventName: 'Starlight Gala' },
        budget: { total: 10000 },
        timeline: { tasks: [] },
        vendors: [],
        insights: [],
      },
    });
    const suggestions = buildPosterSuggestions(event);
    assert.ok(suggestions[0].prompt.includes('Starlight Gala'));
  });

  test('falls back without crashing when plan has no eventName', () => {
    const event = makeMockEvent({
      plan: {
        summary: {},
        budget: { total: 10000 },
        timeline: { tasks: [] },
        vendors: [],
        insights: [],
      },
      input: {
        eventType: 'birthday',
        vibe: 'retro',
        budget: 2000,
        currency: 'USD',
        date: '2027-01-01',
        guestCount: 20,
      },
    });
    const suggestions = buildPosterSuggestions(event);
    assert.equal(suggestions.length, 4);
    assert.ok(suggestions[0].prompt);
  });
});

/* ============================================================
   sanitizeSvg — covers branches at lines 11-26
   ============================================================ */
describe('sanitizeSvg edge cases', () => {
  test('returns empty string for null/undefined/non-string inputs', () => {
    assert.equal(sanitizeSvg(null), '');
    assert.equal(sanitizeSvg(undefined), '');
    assert.equal(sanitizeSvg(42), '');
  });

  test('passes through safe raster data: URLs unchanged', () => {
    const pngUrl = 'data:image/png;base64,abc123';
    assert.equal(sanitizeSvg(pngUrl), pngUrl);
  });

  test('passes through https image URLs unchanged', () => {
    const url = 'https://example.com/image.jpg';
    assert.equal(sanitizeSvg(url), url);
  });

  test('passes through plain text that contains no svg tag', () => {
    assert.equal(sanitizeSvg('hello world'), 'hello world');
  });

  test('removes script tags from SVG', () => {
    const svg = '<svg><script>alert(1)</script><text>hello</text></svg>';
    const result = sanitizeSvg(svg);
    assert.ok(!result.includes('<script'));
    assert.ok(!result.includes('alert'));
    assert.ok(result.includes('<text>hello</text>'));
  });

  test('removes onload event handlers', () => {
    const svg = '<svg><rect onload="evil()" /></svg>';
    const result = sanitizeSvg(svg);
    assert.ok(!result.includes('onload'));
  });

  test('removes javascript: href attributes', () => {
    const svg = '<svg><a href="javascript:alert(1)">click</a></svg>';
    const result = sanitizeSvg(svg);
    assert.ok(!result.includes('javascript:'));
  });

  test('removes foreignObject tags', () => {
    const svg = '<svg><foreignObject><div>hi</div></foreignObject></svg>';
    const result = sanitizeSvg(svg);
    assert.ok(!result.includes('foreignObject'));
  });

  test('strips DOCTYPE declarations', () => {
    const svg = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg><text>ok</text></svg>';
    const result = sanitizeSvg(svg);
    assert.ok(!result.includes('DOCTYPE'));
    assert.ok(result.includes('<text>ok</text>'));
  });
});

/* ============================================================
   Expense service branch coverage
   ============================================================ */
describe('Expense service status derivation', () => {
  let mockEvent;
  const origFindOne = Event.findOne;

  beforeEach(() => {
    mockEvent = makeMockEvent();
    Event.findOne = async () => mockEvent;
  });

  afterEach(() => {
    Event.findOne = origFindOne;
  });

  test('createExpense: sets status=paid when paidAmount >= actualCost > 0', async () => {
    const result = await expenseService.createExpense(
      'evt-test',
      { title: 'Venue', actualCost: 5000, paidAmount: 5000 },
      'usr-test',
    );
    assert.equal(result.expense.status, 'paid');
  });

  test('createExpense: sets status=partially_paid when 0 < paidAmount < actualCost', async () => {
    const result = await expenseService.createExpense(
      'evt-test',
      { title: 'Catering', actualCost: 3000, paidAmount: 1000 },
      'usr-test',
    );
    assert.equal(result.expense.status, 'partially_paid');
  });

  test('createExpense: sets status=unpaid when paidAmount=0', async () => {
    const result = await expenseService.createExpense(
      'evt-test',
      { title: 'DJ', actualCost: 1000, paidAmount: 0 },
      'usr-test',
    );
    assert.equal(result.expense.status, 'unpaid');
  });

  test('updateExpense: auto-derives partially_paid when no status field given', async () => {
    const created = await expenseService.createExpense(
      'evt-test',
      { title: 'Florist', actualCost: 2000, paidAmount: 0 },
      'usr-test',
    );
    const updated = await expenseService.updateExpense(
      'evt-test',
      created.expense.id,
      { paidAmount: 1000 },
      'usr-test',
    );
    assert.equal(updated.expense.status, 'partially_paid');
  });

  test('updateExpense: respects explicit status override', async () => {
    const created = await expenseService.createExpense(
      'evt-test',
      { title: 'Photographer', actualCost: 3000, paidAmount: 0 },
      'usr-test',
    );
    const updated = await expenseService.updateExpense(
      'evt-test',
      created.expense.id,
      { status: 'paid' },
      'usr-test',
    );
    assert.equal(updated.expense.status, 'paid');
  });
});

/* ============================================================
   Vendor service initializeVendorsFromPlan
   ============================================================ */
describe('Vendor service initializeVendorsFromPlan', () => {
  const { initializeVendorsFromPlan } = vendorService;

  test('handles empty or null plan vendors gracefully', () => {
    assert.deepEqual(initializeVendorsFromPlan([]), []);
    assert.deepEqual(initializeVendorsFromPlan(null), []);
    assert.deepEqual(initializeVendorsFromPlan(undefined), []);
  });

  test('maps plan vendors to interactive vendor records', () => {
    const planVendors = [
      { id: 'v1', name: 'Caterer', priority: 'essential', matchesPriority: true, bookBy: '2027-01-01', bookNow: false, tip: 'Get quotes' },
    ];
    const result = initializeVendorsFromPlan(planVendors);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Caterer');
    assert.equal(result[0].bookingStatus, 'pending');
    assert.equal(result[0].priority, 'essential');
  });
});

/* ============================================================
   Guest service importGuests validation branches
   ============================================================ */
describe('Guest service importGuests validation branches', () => {
  let mockEvent;
  const origFindOne = Event.findOne;

  beforeEach(() => {
    mockEvent = makeMockEvent();
    Event.findOne = async () => mockEvent;
  });

  afterEach(() => {
    Event.findOne = origFindOne;
  });

  test('rejects empty array', async () => {
    await assert.rejects(
      () => guestService.importGuests('evt-test', [], 'usr-test'),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST && /non-empty/i.test(err.message),
    );
  });

  test('rejects batches over MAX_IMPORT_BATCH (500)', async () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({ name: 'G' + i }));
    await assert.rejects(
      () => guestService.importGuests('evt-test', tooMany, 'usr-test'),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST && /500/.test(err.message),
    );
  });

  test('rejects when adding guests would exceed MAX_EVENT_TOTAL (5000)', async () => {
    mockEvent.guests = Array.from({ length: 4999 }, (_, i) => ({ id: 'g-' + i, name: 'G' + i }));
    const guests = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    await assert.rejects(
      () => guestService.importGuests('evt-test', guests, 'usr-test'),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST && /5000/.test(err.message),
    );
  });

  test('skips entries without a name, imports only valid ones', async () => {
    const list = [
      { name: 'Alice' },
      { email: 'no-name@example.com' },
      { name: '' },
      { name: 'Bob' },
    ];
    const result = await guestService.importGuests('evt-test', list, 'usr-test');
    assert.equal(result.addedCount, 2);
    assert.ok(mockEvent.guests.some((g) => g.name === 'Alice'));
    assert.ok(mockEvent.guests.some((g) => g.name === 'Bob'));
  });
});

/* ============================================================
   promptBuilder utility functions
   ============================================================ */
describe('promptBuilder utility functions', () => {
  test('buildEventsSummary returns placeholder when no events', () => {
    assert.equal(buildEventsSummary([]), '(No saved events yet.)');
    assert.equal(buildEventsSummary(null), '(No saved events yet.)');
  });

  test('buildEventsSummary formats multiple events correctly', () => {
    const events = [
      {
        input: { eventName: 'Garden Party', eventType: 'birthday', date: '2027-06-01', guestCount: 50, budget: 3000, currency: 'USD' },
        plan: { budget: { tier: 'lean' } },
      },
      {
        input: { eventType: 'wedding', date: '2027-12-20', guestCount: 100, budget: 20000, currency: 'USD' },
        plan: { budget: { tier: 'premium' } },
      },
    ];
    const summary = buildEventsSummary(events);
    assert.ok(summary.includes('Garden Party'));
    assert.ok(summary.includes('birthday'));
    assert.ok(summary.includes('wedding'));
    assert.ok(summary.includes('lean'));
    assert.ok(summary.includes('premium'));
  });

  test('buildActiveEventContext returns empty string when no event', () => {
    assert.equal(buildActiveEventContext(null, {}), '');
    assert.equal(buildActiveEventContext(undefined, {}), '');
  });

  test('buildActiveEventContext returns a rich context string for a valid event', () => {
    const event = makeMockEvent();
    const metrics = {
      budget: { totalBudget: 50000, currency: 'USD', totalActualCost: 10000, remainingBudget: 40000 },
      tasks: { total: 10, pending: 3, overdue: 1 },
      vendors: { total: 5, booked: 2, pending: 3 },
      guests: { attending: 80, totalInvited: 150 },
    };
    const ctx = buildActiveEventContext(event, metrics);
    assert.ok(ctx.includes('ACTIVE EVENT'));
    assert.ok(ctx.includes('50000'));
    assert.ok(ctx.includes('1 OVERDUE'));
    assert.ok(ctx.includes('80 confirmed'));
  });

  test('buildChatSystemPrompt includes events summary and active context when provided', () => {
    const prompt = buildChatSystemPrompt('Event 1: wedding', '-- ACTIVE EVENT --');
    assert.ok(prompt.includes('Event 1: wedding'));
    assert.ok(prompt.includes('ACTIVE EVENT'));
  });

  test('buildChatSystemPrompt works without active context', () => {
    const prompt = buildChatSystemPrompt('No events');
    assert.ok(prompt.includes('No events'));
    assert.ok(!prompt.includes('undefined'));
  });
});

/* ============================================================
   sendResponse utility — covers the null data branch (line 17)
   ============================================================ */
describe('sendResponse utility', () => {
  function makeFakeRes() {
    const res = {
      _status: null,
      _body: null,
      status(code) { this._status = code; return this; },
      json(body) { this._body = body; return this; },
    };
    return res;
  }

  test('sends success response with data', () => {
    const res = makeFakeRes();
    sendResponse(res, 200, true, { foo: 'bar' });
    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.deepEqual(res._body.data, { foo: 'bar' });
  });

  test('sends response with message when data is null', () => {
    const res = makeFakeRes();
    sendResponse(res, 200, true, null, 'Done.');
    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data, null);
  });

  test('sends error response with message', () => {
    const res = makeFakeRes();
    sendResponse(res, 400, false, null, 'Bad input.');
    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Bad input.');
  });
});

/* ============================================================
   Chat service sendMessage — covers lines 23-72 of chat.service.js
   ============================================================ */
describe('chatService sendMessage', () => {
  const origFind = Event.find;
  const origFindOne = Event.findOne;
  const origChatFindOne = ChatHistory.findOne;
  const origSave = ChatHistory.prototype.save;

  afterEach(() => {
    Event.find = origFind;
    Event.findOne = origFindOne;
    ChatHistory.findOne = origChatFindOne;
    ChatHistory.prototype.save = origSave;
  });

  test('throws 400 when message is empty or whitespace', async () => {
    await assert.rejects(
      () => chatService.sendMessage('user1', ''),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST,
    );
    await assert.rejects(
      () => chatService.sendMessage('user1', '   '),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST,
    );
  });

  test('creates new history, invokes LLM, appends messages, and saves', async () => {
    Event.find = () => ({
      select: () => ({
        lean: async () => [{ input: { eventType: 'wedding' }, plan: { budget: { tier: 'moderate' } } }],
      }),
    });
    ChatHistory.findOne = async () => null;
    let saved = false;
    ChatHistory.prototype.save = async function () {
      saved = true;
      return this;
    };

    const mockClient = {
      ai: {
        models: {
          generateContent: async () => ({ text: 'Here is a helpful suggestion for your wedding.' }),
        },
      },
      model: 'test-model',
    };

    const result = await chatService.sendMessage('user1', 'Hello assistant', {
      clientContext: mockClient,
    });

    assert.equal(result.reply, 'Here is a helpful suggestion for your wedding.');
    assert.equal(saved, true);
  });

  test('loads active event when eventId is provided', async () => {
    Event.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    Event.findOne = async () => makeMockEvent({
      input: { eventType: 'birthday', guestCount: 20 },
    });
    let savedDoc = null;
    ChatHistory.findOne = async () => ({
      user: 'user2',
      messages: [],
      async save() {
        savedDoc = this;
        return this;
      },
    });

    const mockClient = {
      ai: {
        models: {
          generateContent: async () => ({ text: 'Birthday advice provided.' }),
        },
      },
      model: 'test-model',
    };

    const result = await chatService.sendMessage('user2', 'Any birthday games?', {
      eventId: 'evt-123',
      clientContext: mockClient,
    });

    assert.equal(result.reply, 'Birthday advice provided.');
    assert.ok(savedDoc);
    assert.equal(savedDoc.messages.length, 2);
    assert.equal(savedDoc.messages[0].content, 'Any birthday games?');
    assert.equal(savedDoc.messages[1].content, 'Birthday advice provided.');
  });

  test('handles active event lookup failure gracefully and trims history beyond MAX_STORED_MESSAGES', async () => {
    Event.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    Event.findOne = async () => { throw new Error('DB error'); };

    const initialMessages = Array.from({ length: 205 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Msg ${i}`,
      timestamp: new Date(),
    }));

    let savedDoc = null;
    ChatHistory.findOne = async () => ({
      user: 'user3',
      messages: [...initialMessages],
      async save() {
        savedDoc = this;
        return this;
      },
    });

    const mockClient = {
      ai: {
        models: {
          generateContent: async () => ({ text: 'Trimming test response' }),
        },
      },
      model: 'test-model',
    };

    const result = await chatService.sendMessage('user3', 'Message 206', {
      eventId: 'bad-id',
      clientContext: mockClient,
    });

    assert.equal(result.reply, 'Trimming test response');
    assert.ok(savedDoc);
    assert.equal(savedDoc.messages.length, 200);
  });
});


