/* ═══════════════════════════════════════════════════════════
   ProposalForge — proposal-data.js
   Default data structures, template definitions, and
   accent color palette
═══════════════════════════════════════════════════════════ */

/**
 * Returns a fresh, empty proposal object with sensible defaults.
 */
function createNewProposal() {
  return {
    id: uid(),
    title: 'New Proposal',
    date: todayISO(),
    validUntil: futureDateISO(30),
    savedAt: null,
    template: 'modern',
    accentColor: '#7c5cff',

    client: {
      name: '',
      email: '',
      company: '',
      budget: '',
    },

    sender: {
      name: '',
      email: '',
      website: '',
      phone: '',
    },

    logoUrl: '',

    sections: {
      intro: '',
      scope: '',
      timeline: '',
      terms: '',
    },

    packages: [
      {
        name: 'Starter',
        description: 'Perfect for getting started with core features.',
        price: 2500,
        duration: '3 weeks',
        featured: false,
      },
      {
        name: 'Professional',
        description: 'Our most popular package — ideal for growing businesses.',
        price: 5500,
        duration: '6 weeks',
        featured: true,
      },
      {
        name: 'Enterprise',
        description: 'Full-service delivery with priority support and extras.',
        price: 9500,
        duration: '10 weeks',
        featured: false,
      },
    ],

    lineItems: [],

    taxRate: 0,
    discount: 0,

    totals: {
      subtotal: 0,
      tax: 0,
      grand: 0,
    },
  };
}

/* ─────────────────────────────────────────────
   Template definitions
   Each entry describes a visual theme applied
   to the proposal preview render.
───────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    vibe: 'Clean & sharp',
    icon: '◼',
    bg: 'linear-gradient(135deg, #f0f0f0, #e8e8e8)',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    vibe: 'Elevated & refined',
    icon: '◈',
    bg: 'linear-gradient(135deg, #f5f0e8, #ede5d5)',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    vibe: 'Bold & authoritative',
    icon: '▣',
    bg: 'linear-gradient(135deg, #0f172a, #1e293b)',
  },
  {
    id: 'creative',
    name: 'Creative',
    vibe: 'Vibrant & expressive',
    icon: '✦',
    bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    vibe: 'Quiet & precise',
    icon: '○',
    bg: 'linear-gradient(135deg, #ffffff, #f4f4f4)',
  },
  {
    id: 'tech',
    name: 'Tech',
    vibe: 'Dark & technical',
    icon: '⬡',
    bg: 'linear-gradient(135deg, #0a0a0f, #111827)',
  },
];

/* ─────────────────────────────────────────────
   Accent color palette
───────────────────────────────────────────── */
const ACCENT_COLORS = [
  '#7c5cff', // Electric violet
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#1e293b', // Slate (dark, minimal)
  '#292524', // Warm black
];

/* ─────────────────────────────────────────────
   Landing page feature pills
───────────────────────────────────────────── */
const LANDING_FEATURES = [
  'AI Smart Builder',
  '6 Luxury Templates',
  'Live Preview',
  'One-click PDF Export',
  'Pricing Packages',
  'No Login Required',
  'Fully Client-side',
  'Dark & Light Mode',
  'Save Locally',
  'Mobile Friendly',
];

/* ─────────────────────────────────────────────
   Demo packages shown on landing preview card
───────────────────────────────────────────── */
const DEMO_PACKAGES = [
  { name: 'Starter', price: '$3,500', featured: false },
  { name: 'Professional', price: '$7,500', featured: true },
  { name: 'Enterprise', price: '$12,500', featured: false },
];

/* ─────────────────────────────────────────────
   Editor tab definitions
───────────────────────────────────────────── */
const EDITOR_TABS = [
  { id: 'details',  label: 'Details'  },
  { id: 'content',  label: 'Content'  },
  { id: 'pricing',  label: 'Pricing'  },
  { id: 'style',    label: 'Style'    },
];
