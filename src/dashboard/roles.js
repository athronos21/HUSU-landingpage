/**
 * Central roles configuration for HUSU dashboard.
 * Import from here instead of hardcoding role strings everywhere.
 */

// All possible roles
export const ROLES = {
  ADMIN:          'admin',
  MEMBER:         'member',
  // Higher management
  PRESIDENT:      'president',
  VICE_PRESIDENT: 'vice_president',
  GEN_SECRETARY:  'general_secretary',
  GEN_SPEAKER:    'general_speaker',
  GEN_AUDITOR:    'general_auditor',
  // Affair roles
  AFFAIR_HEAD:    'affair_head',
  ASSOC_HEAD:     'assoc_head',
  // Organizers
  NEWS_ORG:       'news_org',
  EVENTS_ORG:     'events_org',
}

// Human-readable labels
export const ROLE_LABELS = {
  admin:             'Administrator',
  member:            'Member',
  president:         'President',
  vice_president:    'Vice President',
  general_secretary: 'General Secretary',
  general_speaker:   'General Speaker',
  general_auditor:   'General Auditor',
  affair_head:       'Affair Head',
  assoc_head:        'Associative Head',
  news_org:          'News Organizer',
  events_org:        'Events Organizer',
}

// Colors for role badges
export const ROLE_COLORS = {
  admin:             '#e8a020',
  member:            '#64748b',
  president:         '#f59e0b',
  vice_president:    '#f59e0b',
  general_secretary: '#f59e0b',
  general_speaker:   '#f59e0b',
  general_auditor:   '#f59e0b',
  affair_head:       '#4a7fd4',
  assoc_head:        '#60a5fa',
  news_org:          '#10b981',
  events_org:        '#a78bfa',
}

// Higher management positions
export const HIGHER_MGMT_ROLES = [
  'president', 'vice_president', 'general_secretary',
  'general_speaker', 'general_auditor',
]

// Roles that can access the dashboard (non-members)
export const DASHBOARD_ROLES = [
  'admin', 'president', 'vice_president', 'general_secretary',
  'general_speaker', 'general_auditor', 'affair_head', 'assoc_head',
  'news_org', 'events_org',
]

// Roles that can access letters + messages
export const COMMS_ROLES = [
  'admin', 'president', 'vice_president', 'general_secretary',
  'general_speaker', 'general_auditor', 'affair_head', 'assoc_head',
]

// Nav items access map
export const NAV_ACCESS = {
  overview:  [...DASHBOARD_ROLES, 'member'],
  site:      ['admin'],
  news:      ['admin', 'news_org', 'affair_head', 'assoc_head', ...HIGHER_MGMT_ROLES],
  events:    ['admin', 'events_org', 'affair_head', 'assoc_head', ...HIGHER_MGMT_ROLES],
  affairs:   ['admin', 'affair_head', 'assoc_head'],
  team:      ['admin'],
  contact:   ['admin'],
  users:     ['admin'],
  elections: ['admin'],
  vote:      [...DASHBOARD_ROLES, 'member'],
  letters:   [...COMMS_ROLES, 'member'],
  messages:  [...COMMS_ROLES],
  profile:   [...DASHBOARD_ROLES, 'member'],
}
