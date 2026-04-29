/* ═══════════════════════════════════════════════════════════
   ProposalForge — smart-builder.js
   AI-powered proposal generator.

   Uses the Anthropic Claude API (via the embedded Artifact
   API proxy) when available, and falls back to an intelligent
   template-based offline generator so the app always works.
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   Main entry: called when user clicks "Generate"
───────────────────────────────────────────── */
async function runSmartBuilder(appState) {
  const { brief, proposal, onProgress, onComplete, onError } = appState;

  if (!brief || !brief.trim()) {
    onError('Please paste your project brief first.');
    return;
  }

  try {
    // Try to use the Claude API first
    await generateWithClaude(brief, proposal, onProgress, onComplete);
  } catch (err) {
    console.warn('Claude API unavailable, using offline generator:', err.message);
    // Graceful fallback to local template-based generation
    await generateOffline(brief, proposal, onProgress, onComplete);
  }
}

/* ─────────────────────────────────────────────
   Claude API generator
   Sends the brief to Claude via the Anthropic API
   and streams structured sections back.
───────────────────────────────────────────── */
async function generateWithClaude(brief, proposal, onProgress, onComplete) {
  onProgress(10, 'Reading your project brief…');

  const systemPrompt = `You are an expert business proposal writer for a premium agency. 
You write clear, professional, compelling proposals that win clients.
Your tone is confident, warm, and client-focused.
Always respond with a JSON object in this exact shape — no markdown fences, no extra text:
{
  "intro":    "<executive summary, 2-3 paragraphs>",
  "scope":    "<detailed scope of work, 4-6 bullet points as plain text with newlines>",
  "timeline": "<project timeline, one item per line, e.g.: Week 1: Discovery & Research>",
  "terms":    "<payment terms and next steps, 2-3 short paragraphs>",
  "packages": [
    {"name":"Starter","description":"<what's included>","price":<number>,"duration":"<e.g. 4 weeks>","featured":false},
    {"name":"Professional","description":"<what's included>","price":<number>,"duration":"<e.g. 7 weeks>","featured":true},
    {"name":"Enterprise","description":"<what's included>","price":<number>,"duration":"<e.g. 12 weeks>","featured":false}
  ]
}
Base pricing on typical agency rates for the described scope. Make pricing realistic and competitive.`;

  const userPrompt = `Project Brief:
${brief}

Client: ${proposal.client?.name || 'the client'}
Our company: ${proposal.sender?.name || 'our agency'}

Generate a complete, professional proposal for this project.`;

  onProgress(30, 'Connecting to Claude AI…');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  onProgress(70, 'Crafting your proposal…');

  const data = await response.json();
  const rawText = data?.content?.[0]?.text || '';

  // Strip possible markdown fences
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse AI response as JSON. Falling back to offline mode.');
  }

  onProgress(90, 'Applying finishing touches…');
  applyGeneratedContent(parsed, proposal);

  onProgress(100, 'Done!');
  setTimeout(() => onComplete(), 300);
}

/* ─────────────────────────────────────────────
   Offline (template-based) generator
   No network required — analyses keywords and
   produces a professional proposal instantly.
───────────────────────────────────────────── */
async function generateOffline(brief, proposal, onProgress, onComplete) {
  onProgress(15, 'Analysing your brief…');
  await sleep(400);

  onProgress(35, 'Structuring proposal sections…');
  await sleep(500);

  const analysis = analyseLocalBrief(brief);

  onProgress(60, 'Writing scope and timeline…');
  await sleep(400);

  const generated = buildOfflineProposal(brief, analysis, proposal);

  onProgress(85, 'Calculating pricing…');
  await sleep(350);

  applyGeneratedContent(generated, proposal);

  onProgress(100, 'Proposal ready!');
  await sleep(200);
  onComplete();
}

/* ─────────────────────────────────────────────
   Brief analyser — extracts signals from text
───────────────────────────────────────────── */
function analyseLocalBrief(brief) {
  const text = brief.toLowerCase();

  // Project type detection
  const types = {
    website:     ['website', 'web', 'site', 'landing page', 'web app', 'webapp', 'web design', 'wordpress', 'shopify'],
    branding:    ['brand', 'logo', 'identity', 'rebrand', 'visual identity', 'style guide'],
    mobile:      ['mobile', 'app', 'ios', 'android', 'react native', 'flutter'],
    marketing:   ['marketing', 'seo', 'campaign', 'social media', 'content', 'email'],
    consulting:  ['consulting', 'strategy', 'audit', 'research', 'analysis', 'advisory'],
    development: ['develop', 'code', 'build', 'software', 'platform', 'saas', 'api', 'backend', 'frontend'],
    design:      ['design', 'ui', 'ux', 'figma', 'prototype', 'mockup'],
    ecommerce:   ['ecommerce', 'e-commerce', 'shop', 'store', 'checkout', 'payments', 'woocommerce'],
  };

  const detectedTypes = [];
  for (const [type, signals] of Object.entries(types)) {
    if (signals.some(s => text.includes(s))) detectedTypes.push(type);
  }

  // Budget extraction
  const budgetMatch = text.match(/\$[\d,]+(?:k)?(?:\s*[-–]\s*\$[\d,]+(?:k)?)?/);
  const budget = budgetMatch ? budgetMatch[0] : null;

  // Timeline extraction
  const timelineMatch = text.match(/(\d+)\s*(week|month|day)/);
  const duration = timelineMatch ? `${timelineMatch[1]} ${timelineMatch[2]}s` : null;

  // Complexity signals
  const complexitySignals = {
    high:   ['enterprise', 'complex', 'large', 'multiple', 'full', 'comprehensive', 'complete', 'advanced'],
    low:    ['small', 'simple', 'quick', 'basic', 'minimal', 'mvp', 'starter'],
  };
  const highCount = complexitySignals.high.filter(s => text.includes(s)).length;
  const lowCount  = complexitySignals.low.filter(s => text.includes(s)).length;
  const complexity = highCount > lowCount ? 'high' : lowCount > highCount ? 'low' : 'medium';

  return { detectedTypes, budget, duration, complexity, text };
}

/* ─────────────────────────────────────────────
   Offline proposal builder
───────────────────────────────────────────── */
function buildOfflineProposal(brief, analysis, proposal) {
  const { detectedTypes, budget, duration, complexity } = analysis;
  const clientName = proposal.client?.name || 'your team';
  const senderName = proposal.sender?.name || 'our team';
  const primaryType = detectedTypes[0] || 'project';

  // ── Introduction ──
  const intro = buildOfflineIntro(primaryType, clientName, senderName, brief, complexity);

  // ── Scope ──
  const scope = buildOfflineScope(detectedTypes, complexity);

  // ── Timeline ──
  const timeline = buildOfflineTimeline(detectedTypes, duration, complexity);

  // ── Terms ──
  const terms = buildOfflineTerms();

  // ── Packages ──
  const packages = buildOfflinePackages(detectedTypes, complexity, budget);

  return { intro, scope, timeline, terms, packages };
}

function buildOfflineIntro(type, clientName, senderName, brief, complexity) {
  const typeLabel = {
    website:     'digital presence',
    branding:    'brand identity',
    mobile:      'mobile application',
    marketing:   'marketing initiative',
    consulting:  'strategic engagement',
    development: 'software solution',
    design:      'design project',
    ecommerce:   'e-commerce solution',
  }[type] || 'project';

  return `Thank you for considering ${senderName} for your ${typeLabel}. We've carefully reviewed your requirements and are excited about the opportunity to partner with ${clientName} on this initiative.

Our team brings deep expertise in delivering ${typeLabel}s that not only look exceptional but drive measurable business results. We understand that this investment is significant, and we are committed to delivering work that exceeds your expectations at every stage.

In this proposal, you'll find a clear breakdown of our recommended approach, timeline, and investment options. We believe in transparent communication and close collaboration — you'll always know exactly where the project stands and what comes next.`;
}

function buildOfflineScope(types, complexity) {
  const scopeMap = {
    website: [
      'Discovery & Strategy — Stakeholder interviews, competitor analysis, and sitemap planning',
      'UX & Information Architecture — Wireframes, user flows, and content structure',
      'Visual Design — High-fidelity mockups, responsive layouts, and design system creation',
      'Development — Clean, performant, and accessible code built to modern standards',
      'Content Integration — Copywriting support and media asset integration',
      'QA & Testing — Cross-browser and cross-device testing, performance optimisation',
      'Launch & Handover — Deployment, DNS configuration, and team training',
    ],
    branding: [
      'Brand Discovery — Values workshop, audience analysis, and competitive audit',
      'Logo Design — Multiple concept directions, refinement, and final mark delivery',
      'Color & Typography System — Primary palette, secondary palette, and font pairing',
      'Brand Guidelines — Comprehensive style guide for consistent application',
      'Collateral Design — Business cards, letterhead, email signature, and social templates',
    ],
    mobile: [
      'Product Discovery — User research, feature prioritisation, and technical scoping',
      'UX Design — User flows, information architecture, and interactive prototypes',
      'UI Design — Pixel-perfect screens aligned to platform guidelines (iOS / Android)',
      'Development — Native or cross-platform build with clean, maintainable code',
      'Backend & API Integration — Server-side logic, database design, and third-party APIs',
      'QA & Device Testing — Comprehensive testing across target devices and OS versions',
      'App Store Submission — Build configuration, metadata, and submission support',
    ],
    development: [
      'Technical Architecture — System design, technology selection, and infrastructure planning',
      'Backend Development — API design, database schema, authentication, and business logic',
      'Frontend Development — Responsive UI implementation with modern frameworks',
      'Integration & APIs — Third-party service integrations (payments, CRM, analytics)',
      'Security & Performance — Penetration testing, code review, and load optimisation',
      'Documentation — Technical documentation, API docs, and deployment runbooks',
    ],
  };

  const baseScope = scopeMap[types[0]] || scopeMap.website;
  const items = complexity === 'high' ? baseScope : baseScope.slice(0, Math.min(5, baseScope.length));

  return items.map(item => `• ${item}`).join('\n');
}

function buildOfflineTimeline(types, specifiedDuration, complexity) {
  const weeks = complexity === 'high' ? 10 : complexity === 'low' ? 4 : 6;

  const milestones = [
    'Week 1: Kickoff, Discovery & Deep-Dive Research',
    'Week 2: Strategy, Architecture & Initial Concepts',
    `Week 3${weeks > 5 ? '–4' : ''}: Design & Prototyping — Iterative Refinement`,
    `Week ${weeks > 5 ? '5–' + (weeks - 2) : '4'}: Development & Build Phase`,
    `Week ${weeks - 1}: Quality Assurance, Testing & Client Review`,
    `Week ${weeks}: Final Revisions, Launch Preparation & Handover`,
  ];

  return milestones.join('\n');
}

function buildOfflineTerms() {
  return `A 40% deposit is required to begin work, with the remaining 60% due upon project completion and final delivery. We accept bank transfer, credit card, and PayPal.

This proposal is valid for 30 days from the date issued. Scope changes requested after project kick-off may be subject to a change order and additional timeline adjustment.

To get started, simply sign and return this proposal, pay the deposit, and we'll schedule your kickoff call within 48 hours. We're looking forward to building something exceptional together.`;
}

function buildOfflinePackages(types, complexity, budgetHint) {
  // Base pricing by type
  const basePricing = {
    website:     [2800,  5500,  9500],
    branding:    [1800,  3500,  6500],
    mobile:      [8000, 16000, 30000],
    marketing:   [1200,  2800,  5500],
    consulting:  [2000,  4500,  8000],
    development: [5000, 12000, 25000],
    design:      [2000,  4200,  8000],
    ecommerce:   [3500,  7500, 14000],
  };

  const type = types[0] || 'website';
  const prices = basePricing[type] || basePricing.website;

  // Adjust for complexity
  const multiplier = complexity === 'high' ? 1.4 : complexity === 'low' ? 0.7 : 1;
  const [p1, p2, p3] = prices.map(p => Math.round(p * multiplier / 100) * 100);

  return [
    {
      name: 'Starter',
      description: `Core deliverables for ${types[0] || 'your project'} without the extras. Ideal for focused scope with a clear brief.`,
      price:    p1,
      duration: complexity === 'low' ? '3 weeks' : '5 weeks',
      featured: false,
    },
    {
      name: 'Professional',
      description: `Our most popular option. Includes everything in Starter plus additional rounds of refinement, extended support, and premium features.`,
      price:    p2,
      duration: complexity === 'high' ? '10 weeks' : '7 weeks',
      featured: true,
    },
    {
      name: 'Enterprise',
      description: `Full-service delivery with white-glove support, unlimited revisions, priority turnaround, and a dedicated project manager.`,
      price:    p3,
      duration: complexity === 'high' ? '14 weeks' : '12 weeks',
      featured: false,
    },
  ];
}

/* ─────────────────────────────────────────────
   Apply generated content to the proposal object
───────────────────────────────────────────── */
function applyGeneratedContent(generated, proposal) {
  if (generated.intro)    proposal.sections.intro    = generated.intro;
  if (generated.scope)    proposal.sections.scope    = generated.scope;
  if (generated.timeline) proposal.sections.timeline = generated.timeline;
  if (generated.terms)    proposal.sections.terms    = generated.terms;

  if (generated.packages && generated.packages.length > 0) {
    proposal.packages = generated.packages.map(pkg => ({
      id:          uid(),
      name:        pkg.name        || 'Package',
      description: pkg.description || '',
      price:       parseFloat(pkg.price) || 0,
      duration:    pkg.duration    || '',
      featured:    !!pkg.featured,
    }));
  }
}

/* ─────────────────────────────────────────────
   Helper: sleep
───────────────────────────────────────────── */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
