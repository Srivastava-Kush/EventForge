import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, PieChart, Bot } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';


export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="text-primary" />
            <span>Next-Generation Event Intelligence</span>
          </div>

          <h1 className="hero-title">
            Flawless Events, <br />
            <span className="text-gradient">Engineered to Perfection.</span>
          </h1>

          <p className="hero-subtitle">
            Combines rigorous budget algorithms with generative AI inspiration. From intimate
            birthdays to grand weddings and community gatherings, calculate timelines, vendor costs,
            and creative themes effortlessly.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <span>Go to Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/create-event" className="btn btn-secondary btn-lg">
                  <span>Plan a New Event</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <span>Get Started Free</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="features-section">
        <div className="container">
          <div className="section-title-center">
            <h2 className="section-heading">Why EventForge?</h2>
            <p className="section-subheading">
              A balanced approach between mathematical precision and boundless creativity.
            </p>
          </div>

          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon feature-icon-purple">
                <PieChart size={24} />
              </div>
              <h3 className="feature-title">Algorithmic Budgeting</h3>
              <p className="feature-desc">
                Mathematical allocations based on guest count, tier, and your personal priorities.
                Ensures every dollar is accounted for with zero surprises.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon feature-icon-pink">
                <Sparkles size={24} />
              </div>
              <h3 className="feature-title">GenAI Theme &amp; Idea Suite</h3>
              <p className="feature-desc">
                Leverages advanced LLMs to create tailored themes, activities, and design palettes
                matched directly to your event vibe and venue constraints.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon feature-icon-blue">
                <Bot size={24} />
              </div>
              <h3 className="feature-title">Context-Aware Chatbot</h3>
              <p className="feature-desc">
                Our embedded conversational assistant knows all your saved events, timelines, and
                budgets, giving immediate answers and contract negotiations tips.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
