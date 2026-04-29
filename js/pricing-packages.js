/* ═══════════════════════════════════════════════════════════
   ProposalForge — pricing-packages.js
   Pricing logic: totals calculation, package management,
   and smart package recommendation engine
═══════════════════════════════════════════════════════════ */

/**
 * Calculate all totals for the proposal based on
 * the selected/featured package price AND any line items.
 *
 * Priority: if line items exist, use their subtotal.
 * Otherwise, use the featured package price as the base.
 *
 * @param {Object} proposal - The live proposal object
 */
function calculateTotals(proposal) {
  let subtotal = 0;

  if (proposal.lineItems && proposal.lineItems.length > 0) {
    // Sum all line item totals (qty × price)
    subtotal = proposal.lineItems.reduce((sum, item) => {
      const qty   = parseFloat(item.qty)   || 0;
      const price = parseFloat(item.price) || 0;
      return sum + qty * price;
    }, 0);
  } else {
    // Fall back to featured (recommended) package price
    const featured = proposal.packages?.find(p => p.featured);
    if (featured) {
      subtotal = parseFloat(featured.price) || 0;
    } else if (proposal.packages?.length > 0) {
      // No featured package — use the first one
      subtotal = parseFloat(proposal.packages[0].price) || 0;
    }
  }

  const taxRate  = parseFloat(proposal.taxRate)  || 0;
  const discount = parseFloat(proposal.discount) || 0;

  const tax   = subtotal * (taxRate / 100);
  const grand = Math.max(0, subtotal + tax - discount);

  proposal.totals = {
    subtotal: Math.round(subtotal * 100) / 100,
    tax:      Math.round(tax      * 100) / 100,
    grand:    Math.round(grand    * 100) / 100,
  };

  return proposal.totals;
}

/**
 * Add a blank line item to the proposal
 * @param {Object} proposal
 */
function addLineItem(proposal) {
  proposal.lineItems.push({
    id:    uid(),
    name:  '',
    qty:   1,
    price: 0,
  });
}

/**
 * Remove a line item by index
 * @param {Object} proposal
 * @param {number} index
 */
function removeLineItem(proposal, index) {
  proposal.lineItems.splice(index, 1);
}

/**
 * Add a blank pricing package
 * @param {Object} proposal
 */
function addPackage(proposal) {
  proposal.packages.push({
    id:          uid(),
    name:        `Package ${proposal.packages.length + 1}`,
    description: '',
    price:       0,
    duration:    '',
    featured:    false,
  });
}

/**
 * Remove a pricing package by index
 * @param {Object} proposal
 * @param {number} index
 */
function removePackage(proposal, index) {
  if (proposal.packages.length <= 1) return; // keep at least one
  proposal.packages.splice(index, 1);
}

/**
 * Smart package recommendation.
 * Analyses the brief text and budget hint to suggest which
 * package tier is most appropriate for the client.
 *
 * Returns an index into proposal.packages.
 *
 * Heuristics:
 * - Keywords like "enterprise", "complex", "large", "full"  → top tier
 * - Keywords like "startup", "small", "simple", "basic"     → bottom tier
 * - Everything else                                          → middle tier
 *
 * @param {string}   brief    - The raw project brief text
 * @param {Object[]} packages - The packages array
 * @returns {number} recommended package index
 */
function recommendPackage(brief, packages) {
  if (!packages || packages.length === 0) return 0;
  if (packages.length === 1) return 0;

  const text = (brief || '').toLowerCase();

  const highSignals = [
    'enterprise', 'large', 'complex', 'full-service', 'full service',
    'ongoing', 'retainer', 'priority', 'custom', 'advanced', 'premium',
    'dedicated', 'multiple', 'comprehensive', 'complete overhaul',
  ];
  const lowSignals = [
    'small', 'simple', 'basic', 'minimal', 'quick', 'fast', 'budget',
    'starter', 'mvp', 'prototype', 'just need', 'landing page',
    'one page', 'simple website', 'tight budget',
  ];

  const highScore = highSignals.filter(s => text.includes(s)).length;
  const lowScore  = lowSignals.filter(s => text.includes(s)).length;

  if (highScore > lowScore) {
    // Recommend the most expensive package
    return packages.length - 1;
  }
  if (lowScore > highScore) {
    // Recommend the cheapest package
    return 0;
  }

  // Default: middle package
  return Math.floor(packages.length / 2);
}

/**
 * Apply a recommendation: mark the suggested package as featured
 * and unmark all others.
 *
 * @param {Object} proposal
 * @param {string} brief
 */
function applyPackageRecommendation(proposal, brief) {
  const recIdx = recommendPackage(brief, proposal.packages);
  proposal.packages.forEach((pkg, i) => {
    pkg.featured = i === recIdx;
  });
}
