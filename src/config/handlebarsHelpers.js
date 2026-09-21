/**
 * Reusable Handlebars Template Helpers
 * Provides robust logical, formatting, and rendering helpers for SSR views
 */

const helpers = {
  // Equality & Comparison
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),

  // Arithmetic
  add: (a, b) => Number(a) + Number(b),
  subtract: (a, b) => Number(a) - Number(b),

  // Logical operators (safely strips Handlebars options object from arguments)
  and: (...args) => {
    const values = args.slice(0, -1);
    return values.every(Boolean);
  },
  or: (...args) => {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  },
  not: (val) => !val,

  // UI Badges & Status mappings
  statusBadgeClass: (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'active':
        return 'badge-active';
      case 'draft':
        return 'badge-draft';
      case 'archived':
        return 'badge-archived';
      default:
        return 'badge-info';
    }
  },

  priorityBadgeClass: (priority) => {
    switch (String(priority || '').toLowerCase()) {
      case 'high':
        return 'badge-danger';
      case 'medium':
        return 'badge-warning';
      case 'low':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  },

  // Date and Time Formatting
  formatDate: (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(d);
    }
  },

  formatDateTime: (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(d);
    }
  },

  timeAgo: (d) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 30) return `${diffDay}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  },

  // String & User Utilities
  userInitial: (name) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.trim().charAt(0).toUpperCase();
  },

  capitalize: (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate: (str, len = 100) => {
    if (!str || typeof str !== 'string') return '';
    const limit = Number(len) || 100;
    return str.length > limit ? str.substring(0, limit) + '...' : str;
  },

  // JSON & Attribute Serialization
  json: (obj) => JSON.stringify(obj || {}),

  attrJson: (obj) => {
    try {
      return encodeURIComponent(JSON.stringify(obj || {}));
    } catch {
      return encodeURIComponent('{}');
    }
  },

  encodeUri: (str) => encodeURIComponent(str || ''),

  currentYear: () => new Date().getFullYear()
};

module.exports = helpers;
