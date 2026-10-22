import React from 'react';
import { PieChart } from 'lucide-react';


export default function BudgetBreakdown({ budget }) {
  if (!budget || !budget.items) return null;

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: budget.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${budget.currency || '$'} ${amount.toLocaleString()}`;
    }
  };

  return (
    <section className="card plan-section" aria-labelledby="budget-heading">
      <div className="section-header">
        <div className="section-title-wrap">
          <PieChart className="section-icon" size={20} />
          <h3 id="budget-heading">Budget Breakdown</h3>
        </div>
        <span className={`badge tier-badge tier-${budget.tier}`}>
          {budget.tier?.toUpperCase()} TIER
        </span>
      </div>

      <div className="budget-meta-grid">
        <div className="budget-stat-card">
          <span className="stat-label">Total Allocated</span>
          <span className="stat-value">{formatCurrency(budget.total)}</span>
        </div>
        <div className="budget-stat-card">
          <span className="stat-label">Per Guest</span>
          <span className="stat-value">{formatCurrency(budget.perGuest)}</span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table" aria-label="Detailed Budget Allocations by Category">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" className="text-right">Allocation</th>
              <th scope="col" className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => (
              <tr key={item.key} className={item.prioritized ? 'row-prioritized' : ''}>
                <td>
                  <span className="category-name">{item.label}</span>
                  {item.prioritized && <span className="badge badge-priority ml-2">Priority Focus</span>}
                </td>
                <td className="text-right">
                  <div className="percent-bar-wrapper">
                    <span className="percent-num">{item.percent}%</span>
                    <div className="percent-track" aria-hidden="true">
                      <div
                        className="percent-fill"
                        style={{ width: `${Math.min(item.percent * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="text-right font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
