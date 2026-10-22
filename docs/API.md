# EventForge REST API Documentation

This document describes the REST API endpoints provided by the EventForge backend.

---

## 1. Overview & Conventions

- **Base URL:** `/api`
- **Default Format:** JSON (`Content-Type: application/json`)
- **Authentication:** Bearer token in HTTP header:
  ```http
  Authorization: Bearer <jwt-token>
  ```
- **Error Format:** All errors return a uniform JSON error payload:
  ```json
  {
    "error": {
      "message": "Human-readable explanation of error",
      "status": 400
    }
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Register New User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Auth Required:** No
- **Rate Limit:** 15 requests / minute
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "user": {
      "id": "67b93a1c8f123456789abcde",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2.2 Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth Required:** No
- **Rate Limit:** 15 requests / minute
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "user": {
      "id": "67b93a1c8f123456789abcde",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2.3 Get Current User Profile
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Auth Required:** Yes (Bearer Token)
- **Response:** `200 OK`
  ```json
  {
    "user": {
      "id": "67b93a1c8f123456789abcde",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-10-22T10:00:00.000Z"
    }
  }
  ```

### 2.4 Logout
- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Auth Required:** No
- **Response:** `200 OK`
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

---

## 3. Events & Planning Endpoints (`/api/events`)

All endpoints in this section require Bearer token authentication unless explicitly noted.

### 3.1 Generate & Persist Event Plan
- **Method:** `POST`
- **Path:** `/api/events/plan` (or `/api/events`)
- **Auth Required:** Optional (stores in database if authenticated; returns in-memory plan if unauthenticated)
- **Request Body:**
  ```json
  {
    "eventType": "wedding",
    "eventName": "Maya & Liam Nuptials",
    "date": "2026-10-24",
    "guestCount": 120,
    "budget": 25000,
    "currency": "USD",
    "setting": "outdoor",
    "priorities": ["photography", "food"],
    "considerations": ["accessibility"],
    "vibe": "Rustic garden romance with twilight fairy lights",
    "notes": "Ceremony starts at 4 PM",
    "useAI": true
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "plan": { ... },
    "ideas": { ... },
    "event": {
      "_id": "6ad85e4f9daccf259db55d5a",
      "type": "wedding",
      "input": { ... },
      "tasks": [ ... ],
      "vendors": [ ... ],
      "expenses": [ ... ],
      "schedule": [ ... ],
      "guests": [],
      "posters": []
    }
  }
  ```

### 3.2 List User Events
- **Method:** `GET`
- **Path:** `/api/events`
- **Auth Required:** Yes
- **Response:** `200 OK`
  ```json
  {
    "events": [
      {
        "_id": "6ad85e4f9daccf259db55d5a",
        "type": "wedding",
        "input": { ... },
        "plan": { "summary": { ... }, "budget": { ... } },
        "metrics": {
          "overallProgress": 42,
          "tasks": { "total": 14, "completed": 6, "percentage": 43 },
          "vendors": { "total": 8, "booked": 4, "percentage": 50 },
          "budget": { "total": 25000, "spent": 12000, "committed": 18000, "percentage": 48 },
          "guests": { "total": 120, "confirmed": 85, "declined": 10, "pending": 25 }
        },
        "createdAt": "2026-10-22T10:00:00.000Z"
      }
    ]
  }
  ```

### 3.3 Get Event Detail by ID
- **Method:** `GET`
- **Path:** `/api/events/:id`
- **Auth Required:** Yes (Ownership enforced)
- **Response:** `200 OK` (returns full event document with live computed `metrics`)

### 3.4 Delete Event
- **Method:** `DELETE`
- **Path:** `/api/events/:id`
- **Auth Required:** Yes (Ownership enforced)
- **Response:** `200 OK`
  ```json
  {
    "message": "Event deleted successfully."
  }
  ```

---

## 4. Sub-Entity Operations

### 4.1 Task Management
- `POST /api/events/:id/tasks`
  - Body: `{ title, phase, dueDate, urgent, status, notes, assignedTo }`
  - Response: `{ task, metrics }`
- `PATCH /api/events/:id/tasks/:taskId`
  - Body: `{ title?, phase?, dueDate?, urgent?, status?, notes?, assignedTo? }`
  - Response: `{ task, metrics }`
- `DELETE /api/events/:id/tasks/:taskId`
  - Response: `{ metrics }`

### 4.2 Vendor Management
- `POST /api/events/:id/vendors`
  - Body: `{ name, priority, bookBy, tip, bookingStatus, vendorName, contactPerson, contactEmail, contactPhone, quotationAmount, agreedAmount, paidAmount, notes }`
  - Response: `{ vendor, metrics }`
- `PATCH /api/events/:id/vendors/:vendorId`
  - Body: fields to update
  - Response: `{ vendor, metrics }`
- `DELETE /api/events/:id/vendors/:vendorId`
  - Response: `{ metrics }`

### 4.3 Expenses & Budget Tracking
- `POST /api/events/:id/expenses`
  - Body: `{ title, category, estimatedCost, actualCost, paidAmount, status, dueDate, paidDate, linkedVendorId, linkedTaskId, notes }`
  - Response: `{ expense, metrics }`
- `PATCH /api/events/:id/expenses/:expenseId`
  - Body: fields to update
  - Response: `{ expense, metrics }`
- `DELETE /api/events/:id/expenses/:expenseId`
  - Response: `{ metrics }`

### 4.4 Guest List & CSV Import
- `POST /api/events/:id/guests`
  - Body: `{ name, email, phone, group, invitationStatus, rsvpStatus, plusOnes, plusOneNames, dietary, tableOrSeating, notes }`
  - Response: `{ guest, metrics }`
- `POST /api/events/:id/guests/import`
  - Body: `[ { name, email, phone, group, invitationStatus, rsvpStatus, plusOnes, dietary, notes } ]`
  - Bounded Limits: Max 500 records per import; max 5,000 guests per event.
  - Response: `{ addedCount, guests, metrics }`
- `PATCH /api/events/:id/guests/:guestId`
  - Response: `{ guest, metrics }`
- `DELETE /api/events/:id/guests/:guestId`
  - Response: `{ metrics }`

### 4.5 Run Sheet & Schedule
- `POST /api/events/:id/schedule`
  - Body: `{ startTime, endTime, activity, location, responsiblePerson, relatedVendorId, notes, completed }`
  - Response: `{ item, metrics }`
- `PATCH /api/events/:id/schedule/:itemId`
  - Response: `{ item, metrics }`
- `DELETE /api/events/:id/schedule/:itemId`
  - Response: `{ metrics }`

---

## 5. AI Features

### 5.1 Poster Suggestions & Generation
- `GET /api/events/:id/posters/suggestions`: Returns 4 curated style presets and tailored prompts.
- `POST /api/events/:id/posters/generate`: (Rate limited: 10/min)
  - Body: `{ title, subtitle, date, location, style, prompt, engine }` (`engine`: `'flux'` for photorealistic PNG or `'svg'` for bespoke vector artwork).
  - Response: `{ type: "svg"|"image", data: "<sanitized-svg-or-url>" }`
- `POST /api/events/:id/posters`: Saves poster to event. Sanitizes SVG vectors to eliminate stored XSS.
- `DELETE /api/events/:id/posters/:posterId`: Removes poster from event.

### 5.2 AI Creative Inspirations
- `POST /api/events/:id/generate-ideas`: (Rate limited: 10/min)
  - Generates or regenerates personalized creative themes, entertainment ideas, and decorative concepts.

### 5.3 Interactive Chat Assistant (`/api/chat`)
- `POST /api/chat`: (Authenticated, rate limited)
  - Body:
    ```json
    {
      "message": "Can you recommend a playlist vibe for cocktail hour?",
      "eventContext": { ... },
      "history": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
    ```
  - Response: `{ reply: "...", model: "gemini-2.5-flash", timestamp: "..." }`
- `GET /api/chat/history`: Returns user's recent chat trajectory.
