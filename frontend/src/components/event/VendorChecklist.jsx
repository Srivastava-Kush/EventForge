import React from 'react';
import { Briefcase, AlertCircle, Clock } from 'lucide-react';

export default function VendorChecklist({ vendors }) {
  if (!vendors || vendors.length === 0) return null;

  return (
    <section className="card plan-section" aria-labelledby="vendors-heading">
      <div className="section-header">
        <div className="section-title-wrap">
          <Briefcase className="section-icon" size={20} />
          <h3 id="vendors-heading">Recommended Vendor Checklist</h3>
        </div>
        <span className="section-count">{vendors.length} vendors identified</span>
      </div>

      <ul className="vendors-list" role="list" aria-label="Vendor recommendations checklist">
        {vendors.map((vendor) => (
          <li key={vendor.id} className={`vendor-item priority-${vendor.priority}`}>
            <div className="vendor-main">
              <div className="vendor-header">
                <h4 className="vendor-name">{vendor.name}</h4>
                <div className="vendor-badges">
                  <span className={`badge badge-${vendor.priority}`}>{vendor.priority}</span>
                  {vendor.matchesPriority && (
                    <span className="badge badge-priority">Matches your focus</span>
                  )}
                  {vendor.bookNow && (
                    <span className="badge badge-urgent">
                      <AlertCircle size={12} className="inline-icon" aria-hidden="true" /> Book Now
                    </span>
                  )}
                </div>
              </div>

              {vendor.tip && <p className="vendor-tip">{vendor.tip}</p>}
            </div>

            <div className="vendor-meta">
              <span className="vendor-date-label">
                <Clock size={14} className="inline-icon" aria-hidden="true" /> Target Book Date
              </span>
              <span className={`vendor-date ${vendor.bookNow ? 'text-urgent' : ''}`}>
                {vendor.bookBy}
              </span>
            </div>
          </li>
        ))}
      </ul>

    </section>
  );
}
