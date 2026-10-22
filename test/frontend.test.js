import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");

function readFrontendFile(relativePath) {
  const fullPath = path.join(FRONTEND_DIR, relativePath);
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${relativePath}`);
  return fs.readFileSync(fullPath, "utf-8");
}

describe("Frontend Architecture and Accessibility (A11y) Verification", () => {
  describe("Project Configuration & Build Setup", () => {
    test("frontend/package.json contains all required production dependencies", () => {
      const pkg = JSON.parse(readFrontendFile("package.json"));
      assert.ok(pkg.dependencies.react, "react is declared");
      assert.ok(pkg.dependencies["react-dom"], "react-dom is declared");
      assert.ok(pkg.dependencies["react-router-dom"], "react-router-dom is declared");
      assert.ok(pkg.dependencies.axios, "axios is declared");
      assert.ok(pkg.dependencies["lucide-react"], "lucide-react is declared");
    });

    test("frontend/vite.config.js configures Rollup manualChunks for optimized vendor splitting", () => {
      const config = readFrontendFile("vite.config.js");
      assert.match(config, /manualChunks/);
      assert.match(config, /vendor-react/);
      assert.match(config, /vendor-icons/);
    });
  });

  describe("Application Architecture and Core Components", () => {
    test("App.jsx wraps application routes with ErrorBoundary and AuthProvider", () => {
      const appJsx = readFrontendFile("src/App.jsx");
      assert.match(appJsx, /ErrorBoundary/);
      assert.match(appJsx, /AuthProvider/);
      assert.match(appJsx, /AppRoutes/);
    });

    test("AppRoutes.jsx uses React.lazy and Suspense for code-split route loading", () => {
      const routes = readFrontendFile("src/routes/AppRoutes.jsx");
      assert.match(routes, /lazy\(/);
      assert.match(routes, /Suspense/);
      assert.match(routes, /path="\/login"/);
      assert.match(routes, /path="\/register"/);
      assert.match(routes, /path="\/dashboard"/);
      assert.match(routes, /path="\/create-event"/);
      assert.match(routes, /path="\/events\/:id"/);
    });

    test("all key pages and modal components exist in source tree", () => {
      const expectedComponents = [
        "src/pages/Home.jsx",
        "src/pages/Login.jsx",
        "src/pages/Register.jsx",
        "src/pages/Dashboard.jsx",
        "src/pages/CreateEvent.jsx",
        "src/pages/EventDetail.jsx",
        "src/components/event/EventForm.jsx",
        "src/components/chatbot/ChatWindow.jsx",
        "src/components/common/ErrorBoundary.jsx",
        "src/layouts/MainLayout.jsx",
      ];
      for (const comp of expectedComponents) {
        assert.ok(fs.existsSync(path.join(FRONTEND_DIR, comp)), `Missing component: ${comp}`);
      }
    });
  });

  describe("WCAG 2.1 AA Accessibility (A11y) Standards", () => {
    test("index.css defines focus-visible, skip-link, and reduced-motion tokens", () => {
      const css = readFrontendFile("src/index.css");
      assert.match(css, /:focus-visible/, "Keyboard focus ring indicator defined");
      assert.match(css, /\.skip-link/, "Skip link styles defined");
      assert.match(css, /\.sr-only/, "Screen reader utility defined");
      assert.match(css, /prefers-reduced-motion/, "Reduced motion query supported");
    });

    test("MainLayout.jsx provides accessible skip link and main landmark", () => {
      const layout = readFrontendFile("src/layouts/MainLayout.jsx");
      assert.match(layout, /skip-link/, "Skip to main content link exists");
      assert.match(layout, /href="#main-content"/, "Skip link targets #main-content");
      assert.match(layout, /id="main-content"/, "Main landmark has id #main-content");
    });

    test("Login and Register forms use aria-invalid, aria-describedby, and role=alert", () => {
      const login = readFrontendFile("src/pages/Login.jsx");
      const register = readFrontendFile("src/pages/Register.jsx");
      assert.match(login, /aria-invalid/);
      assert.match(login, /aria-describedby/);
      assert.match(login, /role="alert"/);
      assert.match(register, /aria-invalid/);
      assert.match(register, /aria-describedby/);
      assert.match(register, /role="alert"/);
    });

    test("EventForm uses semantic fieldset and aria-pressed multi-select options", () => {
      const form = readFrontendFile("src/components/event/EventForm.jsx");
      assert.match(form, /<fieldset/);
      assert.match(form, /<legend/);
      assert.match(form, /aria-pressed/);
      assert.match(form, /role="alert"/);
    });

    test("ChatWindow implements WAI-ARIA dialog pattern with escape dismissal and polite log", () => {
      const chat = readFrontendFile("src/components/chatbot/ChatWindow.jsx");
      assert.match(chat, /role="dialog"/);
      assert.match(chat, /aria-modal=/);
      assert.match(chat, /role="log"/);
      assert.match(chat, /aria-live="polite"/);
      assert.match(chat, /Escape/);
    });
  });
});
