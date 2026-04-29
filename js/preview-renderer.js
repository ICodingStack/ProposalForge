/* ═══════════════════════════════════════════════════════════
   ProposalForge v2 — preview-renderer.js
   Renders the live proposal preview. Fixed syntax, premium output.
═══════════════════════════════════════════════════════════ */

function renderPreview(proposal) {
  var container = document.getElementById('proposal-preview');
  if (!container) return;
  var accent = proposal.accentColor || '#7c5cff';
  var tpl    = proposal.template    || 'modern';
  container.style.setProperty('--accent', accent);
  container.className = 'proposal-preview tpl-' + tpl;
  container.innerHTML = buildPreviewHTML(proposal, accent, tpl);
}

/* ─────────────────────────────────────────────
   Master builder
───────────────────────────────────────────── */
function buildPreviewHTML(p, accent, tpl) {
  var isDark     = (tpl === 'corporate' || tpl === 'tech');
  var senderName = (p.sender && p.sender.name)  || 'Your Company';
  var clientName = (p.client && p.client.name)  || 'Valued Client';
  var title      = p.title || 'Business Proposal';

  var hasIntro    = !!(p.sections && p.sections.intro    && p.sections.intro.trim());
  var hasScope    = !!(p.sections && p.sections.scope    && p.sections.scope.trim());
  var hasTimeline = !!(p.sections && p.sections.timeline && p.sections.timeline.trim());
  var hasTerms    = !!(p.sections && p.sections.terms    && p.sections.terms.trim());
  var hasPkgs     = !!(p.packages  && p.packages.length);
  var hasItems    = !!(p.lineItems && p.lineItems.length);

  var html = '';
  html += buildHeader(p, accent, tpl, isDark, senderName, clientName, title);
  html += '<div class="proposal-body">';
  html += buildMetaBar(p, accent);
  if (hasIntro)    html += buildSection('Introduction',        nl2br(p.sections.intro),  accent);
  if (hasScope)    html += buildScopeSection(p.sections.scope, accent);
  if (hasPkgs)     html += buildPackagesSection(p, accent);
  if (hasItems)    html += buildLineItemsSection(p, accent);
  if (hasTimeline) html += buildTimelineSection(p, accent);
  if (hasTerms)    html += buildSection('Terms &amp; Next Steps', nl2br(p.sections.terms), accent);
  html += buildSignatureBlock(p, accent);
  html += '</div>';
  html += buildDocFooter(p, accent, tpl, senderName);
  html += '<div class="preview-watermark">ProposalForge</div>';
  return html;
}

/* ─────────────────────────────────────────────
   HEADER — per template
───────────────────────────────────────────── */
function buildHeader(p, accent, tpl, isDark, senderName, clientName, title) {
  var tc  = isDark ? '#dde0ea'              : '#18181b';
  var tc2 = isDark ? 'rgba(255,255,255,0.4)' : '#999';

  var logoHtml = p.logoUrl
    ? '<img src="' + escapeHTML(p.logoUrl) + '" alt="' + escapeHTML(senderName) + '" style="max-height:52px;max-width:180px;object-fit:contain;margin-bottom:14px;display:block;" />'
    : '';

  var leftBlock = ''
    + '<div style="flex:1;min-width:0;">'
    + logoHtml
    + '<div class="preview-company-name" style="color:' + tc + '">' + escapeHTML(senderName) + '</div>'
    + (p.sender && p.sender.email   ? '<div style="font-size:11.5px;color:' + tc2 + ';margin-top:3px">' + escapeHTML(p.sender.email)   + '</div>' : '')
    + (p.sender && p.sender.website ? '<div style="font-size:11.5px;color:' + tc2 + '">'                + escapeHTML(p.sender.website) + '</div>' : '')
    + '<div style="margin-top:30px;">'
    + '<div style="font-size:8.5px;letter-spacing:0.15em;text-transform:uppercase;color:' + accent + ';margin-bottom:8px;font-weight:700;">Business Proposal</div>'
    + '<h1 class="preview-proposal-title" style="color:' + tc + '">' + escapeHTML(title) + '</h1>'
    + '</div></div>';

  var rightBlock = ''
    + '<div style="text-align:right;flex-shrink:0;min-width:185px;">'
    + '<div style="font-size:8.5px;letter-spacing:0.13em;text-transform:uppercase;color:' + tc2 + ';margin-bottom:5px;font-weight:700;">Prepared For</div>'
    + '<div style="font-weight:600;font-size:15px;color:' + tc + ';line-height:1.25;">' + escapeHTML(clientName) + '</div>'
    + (p.client && p.client.email ? '<div style="font-size:11.5px;color:' + tc2 + ';margin-top:3px">' + escapeHTML(p.client.email) + '</div>' : '')
    + '<div style="margin-top:20px;">'
    + '<div style="font-size:8.5px;letter-spacing:0.13em;text-transform:uppercase;color:' + tc2 + ';margin-bottom:5px;font-weight:700;">Date</div>'
    + '<div style="font-size:13px;color:' + tc + ';font-weight:500;">' + formatDate(p.date) + '</div>'
    + (p.validUntil ? '<div style="font-size:11px;color:' + tc2 + ';margin-top:3px">Valid until ' + formatDate(p.validUntil) + '</div>' : '')
    + '</div></div>';

  /* ── Minimal ── */
  if (tpl === 'minimal') {
    return '<div class="proposal-header">'
      + (logoHtml ? '<div style="margin-bottom:18px">' + logoHtml + '</div>' : '')
      + '<div class="preview-company-name" style="font-size:18px;opacity:0.55">' + escapeHTML(senderName) + '</div>'
      + '<div style="width:44px;height:2.5px;background:' + accent + ';margin:18px auto 20px;border-radius:2px;"></div>'
      + '<h1 class="preview-proposal-title">' + escapeHTML(title) + '</h1>'
      + '<div style="margin-top:14px;font-size:13px;color:#888;">Prepared for <strong style="color:#444">'
      + escapeHTML(clientName) + '</strong> &nbsp;&middot;&nbsp; ' + formatDate(p.date) + '</div>'
      + '</div>';
  }

  /* ── Creative ── */
  if (tpl === 'creative') {
    return '<div class="proposal-header">'
      + '<div class="proposal-header-decoration"></div>'
      + '<div class="proposal-header-bg"></div>'
      + '<div class="proposal-header-inner">' + leftBlock + rightBlock + '</div>'
      + '</div>';
  }

  /* ── All others: modern / luxury / corporate / tech ── */
  return '<div class="proposal-header">' + leftBlock + rightBlock + '</div>';
}

/* ─────────────────────────────────────────────
   META BAR — budget + total
───────────────────────────────────────────── */
function buildMetaBar(p, accent) {
  var budget = p.client && p.client.budget;
  var grand  = p.totals && p.totals.grand;
  if (!budget && !grand) return '';

  return '<div style="margin-bottom:36px;padding:18px 24px;border-radius:14px;'
    + 'border:1.5px solid ' + hexToRgba(accent, 0.2) + ';background:' + hexToRgba(accent, 0.055) + ';'
    + 'display:flex;align-items:center;justify-content:space-between;gap:24px;">'
    + (budget
      ? '<div>'
        + '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:#999;margin-bottom:5px;font-weight:700;">Client Budget</div>'
        + '<div style="font-size:15px;font-weight:600;color:#1a1a2e;">' + escapeHTML(budget) + '</div>'
        + '</div>'
      : '<div></div>')
    + (grand
      ? '<div style="text-align:right;">'
        + '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:#999;margin-bottom:5px;font-weight:700;">Proposal Total</div>'
        + '<div style="font-family:\'Cormorant Garamond\',serif;font-size:28px;font-weight:600;letter-spacing:-0.025em;color:' + accent + ';line-height:1;">' + formatCurrency(grand) + '</div>'
        + '</div>'
      : '')
    + '</div>';
}

/* ─────────────────────────────────────────────
   GENERIC TEXT SECTION
───────────────────────────────────────────── */
function buildSection(sectionTitle, bodyHTML, accent) {
  return '<div class="preview-section">'
    + '<span class="preview-section-title" style="--accent:' + accent + '">' + sectionTitle + '</span>'
    + '<div class="preview-section-body">' + bodyHTML + '</div>'
    + '</div>';
}

/* ─────────────────────────────────────────────
   SCOPE — smart bullet rendering
───────────────────────────────────────────── */
function buildScopeSection(text, accent) {
  if (!text || !text.trim()) return '';

  var lines  = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  var isList = lines.every(function(l) { return /^[•\-\*]/.test(l); });
  var body;

  if (isList) {
    var items = lines.map(function(line, i) {
      var clean   = line.replace(/^[•\-\*]\s*/, '');
      var dashIdx = clean.indexOf('—');
      var dash2   = clean.indexOf(' - ');
      var sepIdx  = dashIdx > 0 ? dashIdx : (dash2 > 0 ? dash2 : -1);
      var sepLen  = (dashIdx > 0) ? 1 : 3;

      if (sepIdx > 0) {
        var label = clean.slice(0, sepIdx).trim();
        var desc  = clean.slice(sepIdx + sepLen).trim();
        return '<div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid #f2f2f2;align-items:flex-start;">'
          + '<div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;background:' + accent
          + ';display:flex;align-items:center;justify-content:center;font-size:9px;color:white;font-weight:700;margin-top:2px;">' + (i + 1) + '</div>'
          + '<div>'
          + '<div style="font-weight:600;font-size:13px;color:#1a1a2e;margin-bottom:2px;">' + escapeHTML(label) + '</div>'
          + '<div style="font-size:12.5px;color:#555;line-height:1.55;">' + escapeHTML(desc) + '</div>'
          + '</div></div>';
      }

      return '<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #f4f4f4;align-items:center;">'
        + '<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:' + accent + ';margin-left:2px;"></div>'
        + '<div style="font-size:13px;color:#2c2c38;">' + escapeHTML(clean) + '</div>'
        + '</div>';
    }).join('');

    body = '<div style="margin-top:4px;">' + items + '</div>';
  } else {
    body = '<div class="preview-section-body">' + nl2br(text) + '</div>';
  }

  return '<div class="preview-section">'
    + '<span class="preview-section-title" style="--accent:' + accent + '">Scope of Work</span>'
    + body
    + '</div>';
}

/* ─────────────────────────────────────────────
   PRICING PACKAGES
───────────────────────────────────────────── */
function buildPackagesSection(p, accent) {
  if (!p.packages || !p.packages.length) return '';

  var cols = Math.min(p.packages.length, 3);

  var pkgs = p.packages.map(function(pkg) {
    var f          = !!pkg.featured;
    var cls        = f ? 'preview-package featured' : 'preview-package';
    var priceColor = f ? 'color:' + accent + ';' : '';

    return '<div class="' + cls + '">'
      + (f ? '<div class="preview-package-badge" style="background:' + accent + '">&#9733; Recommended</div>' : '')
      + '<div class="preview-package-name">'  + escapeHTML(pkg.name || 'Package') + '</div>'
      + '<div class="preview-package-price" style="' + priceColor + '">' + formatCurrency(pkg.price || 0) + '</div>'
      + (pkg.duration ? '<div style="font-size:11px;color:#aaa;margin-bottom:10px;">&#9201; ' + escapeHTML(pkg.duration) + '</div>' : '')
      + '<div class="preview-package-desc">' + nl2br(pkg.description || '') + '</div>'
      + '</div>';
  }).join('');

  return '<div class="preview-section">'
    + '<span class="preview-section-title" style="--accent:' + accent + '">Investment Options</span>'
    + '<div class="preview-package-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + pkgs + '</div>'
    + '</div>';
}

/* ─────────────────────────────────────────────
   LINE ITEMS TABLE + TOTALS
───────────────────────────────────────────── */
function buildLineItemsSection(p, accent) {
  if (!p.lineItems || !p.lineItems.length) return '';

  var rows = p.lineItems.map(function(item, i) {
    var rowBg = (i % 2 === 1) ? 'background:#fafafa;' : '';
    return '<tr style="' + rowBg + '">'
      + '<td>' + escapeHTML(item.name || '—') + '</td>'
      + '<td style="text-align:center;color:#888">' + (item.qty || 1) + '</td>'
      + '<td style="text-align:right;color:#888">' + formatCurrency(item.price || 0) + '</td>'
      + '<td style="text-align:right;font-weight:600;color:#1a1a2e">' + formatCurrency((item.qty || 1) * (item.price || 0)) + '</td>'
      + '</tr>';
  }).join('');

  var tot      = p.totals || {};
  var subtotal = tot.subtotal || 0;
  var tax      = tot.tax     || 0;
  var grand    = tot.grand   || 0;

  return '<div class="preview-section">'
    + '<span class="preview-section-title" style="--accent:' + accent + '">Detailed Pricing</span>'
    + '<table class="preview-table"><thead><tr>'
    + '<th>Description</th>'
    + '<th style="text-align:center;width:56px">Qty</th>'
    + '<th style="text-align:right;width:88px">Rate</th>'
    + '<th style="text-align:right;width:96px">Amount</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table>'
    + '<div class="preview-totals">'
    + '<div class="preview-total-row"><span>Subtotal</span><span style="font-weight:500">' + formatCurrency(subtotal) + '</span></div>'
    + (p.taxRate ? '<div class="preview-total-row"><span>Tax (' + p.taxRate + '%)</span><span>' + formatCurrency(tax) + '</span></div>' : '')
    + (p.discount ? '<div class="preview-total-row"><span>Discount</span><span style="color:#dc2626">&minus;' + formatCurrency(p.discount) + '</span></div>' : '')
    + '<div class="preview-total-grand"><span style="font-size:14px">Total</span><span style="color:' + accent + '">' + formatCurrency(grand) + '</span></div>'
    + '</div></div>';
}

/* ─────────────────────────────────────────────
   TIMELINE
───────────────────────────────────────────── */
function buildTimelineSection(p, accent) {
  var lines = parseTimeline((p.sections && p.sections.timeline) || '');
  if (!lines.length) return '';

  var items = lines.map(function(line) {
    /* Highlight "Week N:" / "Phase N:" / "Step N:" labels */
    var safe = escapeHTML(line);
    safe = safe.replace(
      /^(Week\s+[\d\-\u2013]+\s*:|Phase\s+\d+\s*:|Step\s+\d+\s*:)/i,
      '<strong style="color:' + accent + ';font-weight:700">$1</strong>'
    );
    return '<div class="preview-timeline-item">' + safe + '</div>';
  }).join('');

  return '<div class="preview-section">'
    + '<span class="preview-section-title" style="--accent:' + accent + '">Project Timeline</span>'
    + '<div class="preview-timeline" style="--accent:' + accent + '">' + items + '</div>'
    + '</div>';
}

/* ─────────────────────────────────────────────
   SIGNATURE BLOCK
───────────────────────────────────────────── */
function buildSignatureBlock(p, accent) {
  var cName = (p.client && p.client.name) || 'Client Name';

  return '<div style="margin-top:52px;padding:30px 34px;border-radius:16px;'
    + 'border:1.5px solid ' + hexToRgba(accent, 0.22) + ';background:' + hexToRgba(accent, 0.04) + ';">'
    + '<div style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:' + accent + ';margin-bottom:22px;font-weight:700;">Acceptance &amp; Signature</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">'
    + '<div>'
    + '<div style="font-size:11px;color:#aaa;margin-bottom:24px;font-weight:500;">Client Signature</div>'
    + '<div style="border-bottom:1.5px solid #d8d8d8;padding-bottom:4px;margin-bottom:8px;min-height:36px;"></div>'
    + '<div style="font-size:11.5px;color:#777;font-weight:500;">' + escapeHTML(cName) + '</div>'
    + '</div>'
    + '<div>'
    + '<div style="font-size:11px;color:#aaa;margin-bottom:24px;font-weight:500;">Date</div>'
    + '<div style="border-bottom:1.5px solid #d8d8d8;padding-bottom:4px;margin-bottom:8px;min-height:36px;"></div>'
    + '<div style="font-size:11.5px;color:#777;font-weight:500;">Date of Acceptance</div>'
    + '</div>'
    + '</div></div>';
}

/* ─────────────────────────────────────────────
   DOCUMENT FOOTER
───────────────────────────────────────────── */
function buildDocFooter(p, accent, tpl, senderName) {
  var isDark = (tpl === 'corporate' || tpl === 'tech');
  var c      = isDark ? '#555' : '#bbb';
  var ca     = isDark ? '#666' : '#bbb';

  return '<div class="proposal-footer" style="color:' + c + '">'
    + '<span style="color:' + ca + '">' + escapeHTML(senderName) + '</span>'
    + '<span style="color:' + accent + ';opacity:0.7;font-size:10px;letter-spacing:0.06em;">ProposalForge</span>'
    + '<span style="color:' + c + '">Page 1</span>'
    + '</div>';
}
