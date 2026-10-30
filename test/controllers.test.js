import { describe, test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import * as authController from '../src/controllers/auth.controller.js';
import * as chatController from '../src/controllers/chat.controller.js';
import * as eventController from '../src/controllers/event.controller.js';

import User from '../src/models/User.model.js';
import Event from '../src/models/Event.model.js';
import ChatHistory from '../src/models/ChatHistory.model.js';
import { requestIdMiddleware } from '../src/middlewares/requestId.middleware.js';
import { HTTP_STATUS } from '../src/constants/httpStatus.js';

function makeMockRes() {
  return {
    _status: 200,
    _body: null,
    _cookies: {},
    _clearedCookies: [],
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
    cookie(name, val, opts) {
      this._cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name, opts) {
      this._clearedCookies.push({ name, opts });
      return this;
    },
  };
}

function makeMockEvent(overrides = {}) {
  return {
    _id: 'evt-1',
    user: 'u1',
    type: 'wedding',
    input: {
      eventType: 'wedding',
      eventName: 'Grand Wedding',
      date: '2027-06-01',
      guestCount: 100,
      budget: 30000,
      currency: 'USD',
      setting: 'indoor',
      considerations: [],
      priorities: [],
      vibe: 'festive',
    },
    plan: {
      summary: { eventName: 'Grand Wedding', daysToGo: 120 },
      budget: { total: 30000, tier: 'moderate', categories: [] },
      timeline: { tasks: [] },
      vendors: [],
      insights: [],
    },
    tasks: [{ id: 't1', title: 'Task 1', status: 'pending' }],
    vendors: [{ id: 'v1', name: 'Vendor 1', bookingStatus: 'pending' }],
    expenses: [{ id: 'exp1', title: 'Expense 1', actualCost: 100, paidAmount: 0 }],
    guests: [{ id: 'g1', name: 'Guest 1', rsvpStatus: 'pending' }],
    schedule: [{ id: 's1', activity: 'Welcome', startTime: '10:00' }],
    posters: [{ id: 'p1', title: 'Poster 1', url: 'http://img' }],
    async save() {
      return this;
    },
    toObject() {
      return { ...this };
    },
    ...overrides,
  };
}

describe('Auth Controller Integration', () => {
  const origFindOne = User.findOne;
  const origCreate = User.create;

  afterEach(() => {
    User.findOne = origFindOne;
    User.create = origCreate;
  });

  test('register sets cookie and returns formatted user payload', async () => {
    User.findOne = () => ({
      select: () => ({
        lean: async () => null,
      }),
    });
    User.create = async (data) => ({
      _id: 'usr-1',
      name: data.name,
      email: data.email,
      createdAt: new Date(),
    });

    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'Password123!' } };
    const res = makeMockRes();
    await authController.register(req, res);

    assert.equal(res._status, HTTP_STATUS.CREATED);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.name, 'Alice');
    assert.ok(res._cookies.token);
  });

  test('login sets cookie and returns user payload', async () => {
    User.findOne = () => ({
      select: async () => ({
        _id: 'usr-2',
        name: 'Bob',
        email: 'bob@example.com',
        comparePassword: async (pwd) => pwd === 'Password123!',
      }),
    });

    const req = { body: { email: 'bob@example.com', password: 'Password123!' } };
    const res = makeMockRes();
    await authController.login(req, res);

    assert.equal(res._status, HTTP_STATUS.OK);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.name, 'Bob');
    assert.ok(res._cookies.token);
  });

  test('logout clears auth cookie', async () => {
    const req = {};
    const res = makeMockRes();
    await authController.logout(req, res);

    assert.equal(res._status, HTTP_STATUS.OK);
    assert.equal(res._body.success, true);
    assert.equal(res._clearedCookies.length, 1);
    assert.equal(res._clearedCookies[0].name, 'token');
  });

  test('getMe returns current user payload', async () => {
    const req = { user: { id: 'usr-me', name: 'Charlie', email: 'charlie@example.com' } };
    const res = makeMockRes();
    await authController.getMe(req, res);

    assert.equal(res._status, HTTP_STATUS.OK);
    assert.equal(res._body.data.id, 'usr-me');
  });
});

describe('Chat Controller Integration', () => {
  const origFind = Event.find;
  const origChatFindOne = ChatHistory.findOne;
  const origSave = ChatHistory.prototype.save;

  afterEach(() => {
    Event.find = origFind;
    ChatHistory.findOne = origChatFindOne;
    ChatHistory.prototype.save = origSave;
  });

  test('sendMessage passes message to chatService and returns reply', async () => {
    Event.find = () => ({
      select: () => ({
        lean: async () => [],
      }),
    });
    ChatHistory.findOne = async () => null;
    ChatHistory.prototype.save = async function () {
      return this;
    };

    const req = {
      user: { _id: 'usr-1' },
      body: { message: 'Plan my birthday' },
    };
    const res = makeMockRes();
    await chatController.sendMessage(req, res);

    assert.equal(res._status, HTTP_STATUS.OK);
    assert.ok(res._body.data.reply);
  });

  test('getHistory returns user chat history', async () => {
    ChatHistory.findOne = () => ({
      lean: async () => ({
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const req = { user: { _id: 'usr-1' } };
    const res = makeMockRes();
    await chatController.getHistory(req, res);

    assert.equal(res._status, HTTP_STATUS.OK);
    assert.equal(res._body.data.messages.length, 1);
  });
});

describe('Event Controller Integration', () => {
  const origFindOne = Event.findOne;
  const origFind = Event.find;
  const origFindOneAndDelete = Event.findOneAndDelete;
  const origCreate = Event.create;

  afterEach(() => {
    Event.findOne = origFindOne;
    Event.find = origFind;
    Event.findOneAndDelete = origFindOneAndDelete;
    Event.create = origCreate;
  });

  test('createEvent returns plan and eventId', async () => {
    Event.create = async (data) => Object.assign({ _id: 'new-evt-123' }, data);

    const req = {
      body: {
        eventType: 'wedding',
        date: '2027-05-10',
        guestCount: 100,
        budget: 30000,
        currency: 'USD',
        setting: 'indoor',
        useAI: false,
      },
      user: { _id: 'u1' },
    };
    const res = makeMockRes();
    await eventController.createEvent(req, res);

    assert.equal(res._status, HTTP_STATUS.CREATED);
    assert.equal(res._body.data.eventId, 'new-evt-123');
  });

  test('listEvents, getEvent and deleteEvent', async () => {
    const mockEvt = makeMockEvent();
    mockEvt.lean = async () => mockEvt;

    Event.find = () => ({
      select: () => ({
        sort: async () => [mockEvt],
      }),
    });
    Event.findOne = () => Object.assign(Promise.resolve(mockEvt), {
      lean: async () => mockEvt,
    });
    Event.findOneAndDelete = async () => ({ _id: 'evt-1' });

    const req = { user: { _id: 'u1' }, params: { id: 'evt-1' } };
    const res1 = makeMockRes();
    await eventController.listEvents(req, res1);
    assert.equal(res1._body.data.length, 1);

    const res2 = makeMockRes();
    await eventController.getEvent(req, res2);
    assert.ok(res2._body.data);

    const res3 = makeMockRes();
    await eventController.deleteEvent(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);
    assert.equal(res3._body.success, true);
  });

  test('task CRUD controllers delegate properly', async () => {
    Event.findOne = async () => makeMockEvent();

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', taskId: 't1' },
      body: { title: 'New Task', status: 'completed' },
    };

    const res1 = makeMockRes();
    await eventController.createTask(req, res1);
    assert.equal(res1._status, HTTP_STATUS.CREATED);

    const res2 = makeMockRes();
    await eventController.updateTask(req, res2);
    assert.equal(res2._status, HTTP_STATUS.OK);

    const res3 = makeMockRes();
    await eventController.deleteTask(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);
  });

  test('vendor CRUD controllers delegate properly', async () => {
    Event.findOne = async () => makeMockEvent();

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', vendorId: 'v1' },
      body: { name: 'Catering', bookingStatus: 'booked' },
    };

    const res1 = makeMockRes();
    await eventController.createVendor(req, res1);
    assert.equal(res1._status, HTTP_STATUS.CREATED);

    const res2 = makeMockRes();
    await eventController.updateVendor(req, res2);
    assert.equal(res2._status, HTTP_STATUS.OK);

    const res3 = makeMockRes();
    await eventController.deleteVendor(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);
  });

  test('expense CRUD controllers delegate properly', async () => {
    Event.findOne = async () => makeMockEvent();

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', expenseId: 'exp1' },
      body: { title: 'Venue Fee', actualCost: 500, paidAmount: 500 },
    };

    const res1 = makeMockRes();
    await eventController.createExpense(req, res1);
    assert.equal(res1._status, HTTP_STATUS.CREATED);

    const res2 = makeMockRes();
    await eventController.updateExpense(req, res2);
    assert.equal(res2._status, HTTP_STATUS.OK);

    const res3 = makeMockRes();
    await eventController.deleteExpense(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);
  });

  test('guest CRUD and import controllers delegate properly', async () => {
    Event.findOne = async () => makeMockEvent();

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', guestId: 'g1' },
      body: { name: 'Guest 2', guests: [{ name: 'Friend A' }, { name: 'Friend B' }] },
    };

    const res1 = makeMockRes();
    await eventController.createGuest(req, res1);
    assert.equal(res1._status, HTTP_STATUS.CREATED);

    const res2 = makeMockRes();
    await eventController.updateGuest(req, res2);
    assert.equal(res2._status, HTTP_STATUS.OK);

    const res3 = makeMockRes();
    await eventController.deleteGuest(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);

    const res4 = makeMockRes();
    await eventController.importGuests(req, res4);
    assert.equal(res4._status, HTTP_STATUS.OK);
    assert.equal(res4._body.data.addedCount, 2);
  });

  test('schedule CRUD controllers delegate properly', async () => {
    Event.findOne = async () => makeMockEvent();

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', itemId: 's1' },
      body: { activity: 'Cake Cutting', startTime: '15:00' },
    };

    const res1 = makeMockRes();
    await eventController.createScheduleItem(req, res1);
    assert.equal(res1._status, HTTP_STATUS.CREATED);

    const res2 = makeMockRes();
    await eventController.updateScheduleItem(req, res2);
    assert.equal(res2._status, HTTP_STATUS.OK);

    const res3 = makeMockRes();
    await eventController.deleteScheduleItem(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);
  });

  test('poster controllers delegate properly', async () => {
    const mockEvt = makeMockEvent();
    Event.findOne = () => Object.assign(Promise.resolve(mockEvt), {
      lean: async () => mockEvt,
    });

    const req = {
      user: { _id: 'u1' },
      params: { id: 'evt-1', posterId: 'p1' },
      body: {
        prompt: 'Elegant gala poster',
        style: 'art_deco',
        useAI: false,
        imageData: 'data:image/svg+xml;utf8,<svg></svg>',
        title: 'Gala Night',
      },
    };

    const res1 = makeMockRes();
    await eventController.getPosterSuggestions(req, res1);
    assert.ok(Array.isArray(res1._body.data));

    const res2 = makeMockRes();
    await eventController.generatePoster(req, res2);
    assert.ok(res2._body.data);

    const res3 = makeMockRes();
    await eventController.generateEventIdeas(req, res3);
    assert.equal(res3._status, HTTP_STATUS.OK);

    const res4 = makeMockRes();
    await eventController.savePoster(req, res4);
    assert.equal(res4._status, HTTP_STATUS.CREATED);

    const res5 = makeMockRes();
    await eventController.deletePoster(req, res5);
    assert.equal(res5._status, HTTP_STATUS.OK);
  });
});

/* ============================================================
   RequestId Middleware Tests
   ============================================================ */
describe('RequestId Middleware', () => {
  test('generates a new UUID if no X-Request-Id header is sent', () => {
    const req = { headers: {} };
    let headerKey = null;
    let headerVal = null;
    const res = {
      setHeader(k, v) {
        headerKey = k;
        headerVal = v;
      },
    };
    let calledNext = false;
    requestIdMiddleware(req, res, () => {
      calledNext = true;
    });

    assert.ok(req.id);
    assert.equal(headerKey, 'X-Request-Id');
    assert.equal(headerVal, req.id);
    assert.equal(calledNext, true);
  });

  test('preserves existing X-Request-Id header from client', () => {
    const req = { headers: { 'x-request-id': 'client-correlation-id-999' } };
    let headerVal = null;
    const res = {
      setHeader(k, v) {
        headerVal = v;
      },
    };
    requestIdMiddleware(req, res, () => {});

    assert.equal(req.id, 'client-correlation-id-999');
    assert.equal(headerVal, 'client-correlation-id-999');
  });
});
