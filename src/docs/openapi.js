/**
 * OpenAPI 3.1.0 specification for EventForge API
 */
export const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "EventForge API",
    version: "1.0.0",
    description: "Production-grade GenAI planning assistant for weddings, birthdays, and community events with real-time metrics, budgets, and interactive subdocument management.",
  },
  servers: [{ url: "/api", description: "Current Environment" }],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", minLength: 8, example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created successfully" },
          "400": { description: "Validation error or email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in and obtain JWT token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Logged in successfully" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get authenticated user profile",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Log out and clear session cookie",
        tags: ["Auth"],
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/events": {
      get: {
        summary: "List all events for authenticated user",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of user events with computed live metrics" },
        },
      },
      post: {
        summary: "Generate plan and optionally save event",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eventType", "date", "guestCount", "budget", "currency", "setting"],
                properties: {
                  eventType: { type: "string", enum: ["wedding", "birthday", "community"] },
                  eventName: { type: "string", maxLength: 80 },
                  date: { type: "string", format: "date", example: "2027-06-01" },
                  guestCount: { type: "integer", minimum: 1, maximum: 5000 },
                  budget: { type: "number", minimum: 50 },
                  currency: { type: "string", enum: ["USD", "EUR", "GBP", "CAD", "AUD", "INR"] },
                  setting: { type: "string", enum: ["indoor", "outdoor", "hybrid"] },
                  vibe: { type: "string", maxLength: 200 },
                  useAI: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Plan generated and event saved" },
          "422": { description: "Validation error" },
        },
      },
    },
    "/events/{id}": {
      get: {
        summary: "Get full event detail with real-time metrics",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Event detail" },
          "404": { description: "Event not found" },
        },
      },
      delete: {
        summary: "Delete event",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Event deleted" },
          "404": { description: "Event not found" },
        },
      },
    },
    "/chat": {
      post: {
        summary: "Send grounded message to AI Assistant",
        tags: ["Chat"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string" },
                  eventId: { type: "string", description: "Optional active event context" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "AI Assistant response" },
        },
      },
    },
    "/healthz": {
      get: {
        summary: "Health check probe",
        tags: ["System"],
        responses: {
          "200": { description: "System healthy" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

export default openapiSpec;
