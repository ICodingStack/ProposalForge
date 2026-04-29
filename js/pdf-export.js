/* ═══════════════════════════════════════════════════════════
   ProposalForge v2 — pdf-export.js  v6
   Pure jsPDF vector PDF. Fixes:
   - Unicode icon replaced with ASCII "dur:" text
   - Date now rendered correctly (safe fallback)
   - Footer: sender left, page right only (clean)
   - No blank second page (signature fits page check)
   - Removed "ProposalForge" centre branding from footer
═══════════════════════════════════════════════════════════ */

async function exportToPDF(proposal, onStart, onComplete, onError) {
  onStart();
  try {
    var Ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!Ctor) {
      onError("jsPDF not loaded.");
      return;
    }

    var doc = new Ctor({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    var accent = pdfHexToRgb(proposal.accentColor || "#7c5cff");
    var tpl = proposal.template || "modern";

    doc.setProperties({
      title: proposal.title || "Business Proposal",
      author: safeStr(proposal.sender && proposal.sender.name, "ProposalForge"),
      subject:
        "Proposal for " +
        safeStr(proposal.client && proposal.client.name, "Client"),
      creator: "ProposalForge",
    });

    var ctx = new PDFCtx(doc, accent, tpl, proposal);
    ctx.render();

    doc.save(pdfFilename(proposal));
    onComplete();
  } catch (err) {
    console.error("PDF error:", err);
    onError(err.message || "PDF export failed.");
  }
}

/* ═══════════════════════════════════════════════════════════
   PDFCtx — full document renderer
═══════════════════════════════════════════════════════════ */
function PDFCtx(doc, accent, tpl, proposal) {
  this.doc = doc;
  this.ac = accent;
  this.tpl = tpl;
  this.p = proposal;
  this.PW = 210;
  this.PH = 297;
  this.ML = 16;
  this.MR = 16;
  this.CW = 210 - 16 - 16; /* 178 mm */
  this.y = 0;
  this.pageN = 1;
  this.FOOTER = 14; /* reserved mm at page bottom */
}

PDFCtx.prototype.render = function () {
  this.renderHeader();
  this.renderBody();
  this.stampFooters();
};

/* ─────────────────────────── HEADER ─────────────────────── */
PDFCtx.prototype.renderHeader = function () {
  var doc = this.doc,
    ac = this.ac,
    tpl = this.tpl,
    p = this.p;
  var PW = this.PW,
    ML = this.ML,
    MR = this.MR;
  var HDR_H = 70;

  /* Header background per template */
  if (tpl === "corporate") {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, PW, HDR_H, "F");
  } else if (tpl === "tech") {
    doc.setFillColor(13, 13, 20);
    doc.rect(0, 0, PW, HDR_H, "F");
  } else if (tpl === "luxury") {
    doc.setFillColor(253, 252, 249);
    doc.rect(0, 0, PW, HDR_H, "F");
  } else if (tpl === "creative") {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.rect(0, 0, 5, HDR_H, "F");
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PW, HDR_H, "F");
  }

  var isDark = tpl === "corporate" || tpl === "tech";
  var TC = isDark ? [218, 222, 235] : [18, 18, 22];
  var TC2 = isDark ? [130, 140, 165] : [150, 150, 162];
  var leftX = tpl === "creative" ? ML + 6 : ML;

  /* ── LEFT: Sender ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(TC[0], TC[1], TC[2]);
  doc.text(safeStr(p.sender && p.sender.name, "Your Company"), leftX, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TC2[0], TC2[1], TC2[2]);
  var sy = 21.5;
  if (p.sender && p.sender.email) {
    doc.text(p.sender.email, leftX, sy);
    sy += 4.5;
  }
  if (p.sender && p.sender.website) {
    doc.text(p.sender.website, leftX, sy);
  }

  /* ── RIGHT: Client + Date ── */
  var RX = PW - MR;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(TC2[0], TC2[1], TC2[2]);
  doc.text("PREPARED FOR", RX, 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(TC[0], TC[1], TC[2]);
  doc.text(safeStr(p.client && p.client.name, "Valued Client"), RX, 19, {
    align: "right",
  });

  if (p.client && p.client.email) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TC2[0], TC2[1], TC2[2]);
    doc.text(p.client.email, RX, 24.5, { align: "right" });
  }

  /* Date */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(TC2[0], TC2[1], TC2[2]);
  doc.text("DATE", RX, 33, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TC[0], TC[1], TC[2]);
  var dateLabel = pdfFormatDate(p.date);
  doc.text(dateLabel, RX, 40, { align: "right" });

  if (p.validUntil) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TC2[0], TC2[1], TC2[2]);
    doc.text("Valid until " + pdfFormatDate(p.validUntil), RX, 45.5, {
      align: "right",
    });
  }

  /* ── Proposal tag + title ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(ac.r, ac.g, ac.b);
  doc.text("BUSINESS PROPOSAL", leftX, 43);

  doc.setFont("times", "normal");
  doc.setFontSize(26);
  doc.setTextColor(
    isDark ? TC[0] : 14,
    isDark ? TC[1] : 14,
    isDark ? TC[2] : 18,
  );
  var titleLines = doc.splitTextToSize(
    safeStr(p.title, "Business Proposal"),
    108,
  );
  var titleY = 54;
  doc.text(titleLines, leftX, titleY);

  /* ── Header border ── */
  if (tpl === "luxury") {
    doc.setDrawColor(ac.r, ac.g, ac.b);
    doc.setLineWidth(1.0);
    doc.line(0, HDR_H, PW * 0.55, HDR_H);
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.25);
    doc.line(PW * 0.55, HDR_H, PW, HDR_H);
  } else if (tpl === "modern" || tpl === "minimal") {
    doc.setDrawColor(232, 232, 235);
    doc.setLineWidth(0.25);
    doc.line(0, HDR_H, PW, HDR_H);
  } else if (tpl === "creative") {
    doc.setDrawColor(ac.r, ac.g, ac.b);
    doc.setLineWidth(0.6);
    doc.line(0, HDR_H, PW, HDR_H);
  } else if (tpl === "tech") {
    doc.setDrawColor(ac.r, ac.g, ac.b);
    doc.setLineWidth(0.5);
    doc.line(0, HDR_H, PW * 0.45, HDR_H);
    doc.setDrawColor(40, 40, 55);
    doc.setLineWidth(0.25);
    doc.line(PW * 0.45, HDR_H, PW, HDR_H);
  }

  this.y = HDR_H + 10;
};

/* ─────────────────────────── BODY ─────────────────────── */
PDFCtx.prototype.renderBody = function () {
  var p = this.p;

  /* Meta bar */
  if ((p.client && p.client.budget) || (p.totals && p.totals.grand)) {
    this.renderMetaBar(p.client && p.client.budget, p.totals && p.totals.grand);
  }

  if (p.sections && p.sections.intro && p.sections.intro.trim()) {
    this.sectionTitle("INTRODUCTION");
    this.bodyText(p.sections.intro.trim());
  }
  if (p.sections && p.sections.scope && p.sections.scope.trim()) {
    this.sectionTitle("SCOPE OF WORK");
    this.renderScope(p.sections.scope.trim());
  }
  if (p.packages && p.packages.length) {
    this.sectionTitle("INVESTMENT OPTIONS");
    this.renderPackages(p.packages);
  }
  if (p.lineItems && p.lineItems.length) {
    this.sectionTitle("DETAILED PRICING");
    this.renderLineItems(p.lineItems, p);
  }
  if (p.sections && p.sections.timeline && p.sections.timeline.trim()) {
    this.sectionTitle("PROJECT TIMELINE");
    this.renderTimeline(p.sections.timeline.trim());
  }
  if (p.sections && p.sections.terms && p.sections.terms.trim()) {
    this.sectionTitle("TERMS & NEXT STEPS");
    this.bodyText(p.sections.terms.trim());
  }

  this.renderSignature();
};

/* ─────────────────────────── META BAR ─────────────────── */
PDFCtx.prototype.renderMetaBar = function (budget, grand) {
  this.need(22);
  var doc = this.doc,
    ac = this.ac;
  var x = this.ML,
    y = this.y,
    w = this.CW;

  doc.setDrawColor(ac.r, ac.g, ac.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, 18, 2.5, 2.5, "S");

  if (budget) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(155, 155, 168);
    doc.text("CLIENT BUDGET", x + 6, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 30);
    doc.text(String(budget), x + 6, y + 13.5);
  }
  if (grand) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(155, 155, 168);
    doc.text("PROPOSAL TOTAL", x + w - 6, y + 6, { align: "right" });
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(ac.r, ac.g, ac.b);
    doc.text(formatCurrency(grand), x + w - 6, y + 14, { align: "right" });
  }
  this.y += 26;
};

/* ─────────────────────────── SECTION TITLE ────────────── */
PDFCtx.prototype.sectionTitle = function (label) {
  this.need(14);
  var doc = this.doc,
    ac = this.ac,
    x = this.ML,
    y = this.y,
    w = this.CW;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(ac.r, ac.g, ac.b);
  doc.text(label, x, y);
  /* Accent rule fading to grey */
  doc.setDrawColor(ac.r, ac.g, ac.b);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2.5, x + w * 0.28, y + 2.5);
  doc.setDrawColor(228, 228, 232);
  doc.setLineWidth(0.25);
  doc.line(x + w * 0.28, y + 2.5, x + w, y + 2.5);
  this.y += 9;
};

/* ─────────────────────────── BODY TEXT ────────────────── */
PDFCtx.prototype.bodyText = function (text) {
  var doc = this.doc,
    LH = 5.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(44, 44, 56);
  var lines = doc.splitTextToSize(text, this.CW);
  for (var i = 0; i < lines.length; i++) {
    this.need(LH + 1);
    doc.text(lines[i], this.ML, this.y);
    this.y += LH;
  }
  this.y += 8;
};

/* ─────────────────────────── SCOPE ────────────────────── */
PDFCtx.prototype.renderScope = function (text) {
  var doc = this.doc,
    ac = this.ac;
  var lines = text
    .split("\n")
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);
  var isList = lines.every(function (l) {
    return /^[•\-\*\.]/.test(l);
  });

  if (!isList) {
    this.bodyText(text);
    return;
  }

  for (var i = 0; i < lines.length; i++) {
    var clean = lines[i].replace(/^[•\-\*\.]\s*/, "");
    var emIdx = clean.indexOf(" — ");
    var dashIdx = clean.indexOf(" - ");
    var sepIdx = emIdx >= 0 ? emIdx : dashIdx >= 0 ? dashIdx : -1;
    var sepLen = emIdx >= 0 ? 3 : 3;
    var rowH = sepIdx >= 0 ? 16 : 10;

    this.need(rowH + 2);
    var bx = this.ML + 3,
      by = this.y;

    /* Dot */
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.circle(bx, by - 1, 2, "F");

    if (sepIdx >= 0) {
      var lbl = clean.slice(0, sepIdx).trim();
      var desc = clean.slice(sepIdx + sepLen).trim();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(18, 18, 24);
      doc.text(lbl, bx + 6, by);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(88, 88, 105);
      var dLines = doc.splitTextToSize(desc, this.CW - 8);
      for (var dl = 0; dl < dLines.length; dl++) {
        if (dl > 0) this.need(5);
        doc.text(dLines[dl], bx + 6, by + 4.8 + dl * 4.5);
      }
      this.y += 5 + dLines.length * 4.5;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(44, 44, 56);
      var iLines = doc.splitTextToSize(clean, this.CW - 8);
      for (var il = 0; il < iLines.length; il++) {
        if (il > 0) this.need(5);
        doc.text(iLines[il], bx + 6, by + il * 4.8);
      }
      this.y += iLines.length * 4.8 + 2;
    }

    /* Row separator */
    doc.setDrawColor(244, 244, 246);
    doc.setLineWidth(0.2);
    doc.line(this.ML, this.y, this.ML + this.CW, this.y);
    this.y += 4;
  }
  this.y += 4;
};

/* ─────────────────────────── PACKAGES ─────────────────── */
PDFCtx.prototype.renderPackages = function (packages) {
  var count = Math.min(packages.length, 3);
  var PH = 52;
  this.need(PH + 8);
  var doc = this.doc,
    ac = this.ac;
  var gap = 4;
  var pw = (this.CW - (count - 1) * gap) / count;
  var y = this.y;

  for (var i = 0; i < count; i++) {
    var pkg = packages[i];
    var f = !!pkg.featured;
    var px = this.ML + i * (pw + gap);

    if (f) {
      doc.setFillColor(250, 250, 255);
      doc.roundedRect(px, y, pw, PH, 3, 3, "F");
      doc.setDrawColor(ac.r, ac.g, ac.b);
      doc.setLineWidth(0.85);
      doc.roundedRect(px, y, pw, PH, 3, 3, "S");

      /* Badge */
      var bw = 32,
        bh = 6;
      doc.setFillColor(ac.r, ac.g, ac.b);
      doc.roundedRect(px + pw / 2 - bw / 2, y - bh / 2, bw, bh, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text("* RECOMMENDED", px + pw / 2, y + 2, { align: "center" });
    } else {
      doc.setFillColor(252, 252, 253);
      doc.roundedRect(px, y, pw, PH, 3, 3, "F");
      doc.setDrawColor(228, 228, 233);
      doc.setLineWidth(0.35);
      doc.roundedRect(px, y, pw, PH, 3, 3, "S");
    }

    var cx = px + 5,
      cy = y + 9;

    /* Name */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(168, 168, 180);
    doc.text((pkg.name || "Package").toUpperCase(), cx, cy);
    cy += 7;

    /* Price */
    doc.setFont("times", "bold");
    doc.setFontSize(19);
    doc.setTextColor(f ? ac.r : 20, f ? ac.g : 20, f ? ac.b : 26);
    doc.text(formatCurrency(pkg.price || 0), cx, cy);
    cy += 5;

    /* Duration — plain ASCII, no emoji */
    if (pkg.duration) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(165, 165, 178);
      doc.text(pkg.duration, cx, cy);
      cy += 5.5;
    } else {
      cy += 3;
    }

    /* Divider */
    doc.setDrawColor(238, 238, 242);
    doc.setLineWidth(0.25);
    doc.line(cx, cy, px + pw - 5, cy);
    cy += 4;

    /* Description */
    if (pkg.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(98, 98, 115);
      var dls = doc.splitTextToSize(pkg.description, pw - 10);
      for (var dl = 0; dl < Math.min(dls.length, 4); dl++) {
        doc.text(dls[dl], cx, cy);
        cy += 4;
      }
    }
  }
  this.y += PH + 12;
};

/* ─────────────────────────── LINE ITEMS ───────────────── */
PDFCtx.prototype.renderLineItems = function (items, proposal) {
  var doc = this.doc,
    ac = this.ac,
    x = this.ML,
    cw = this.CW,
    RH = 8.5;

  /* Header */
  this.need(RH + 4);
  doc.setFillColor(246, 246, 249);
  doc.rect(x, this.y - 1, cw, RH + 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(155, 155, 170);
  doc.text("DESCRIPTION", x + 3, this.y + 5);
  doc.text("QTY", x + cw * 0.62, this.y + 5, { align: "center" });
  doc.text("RATE", x + cw * 0.8, this.y + 5, { align: "right" });
  doc.text("AMOUNT", x + cw, this.y + 5, { align: "right" });
  this.y += RH + 2;

  doc.setDrawColor(228, 228, 232);
  doc.setLineWidth(0.3);
  doc.line(x, this.y, x + cw, this.y);
  this.y += 1;

  for (var i = 0; i < items.length; i++) {
    this.need(RH + 2);
    var item = items[i];
    var total = (item.qty || 1) * (item.price || 0);
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(x, this.y - 1, cw, RH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(44, 44, 56);
    doc.text(item.name || "—", x + 3, this.y + 5);
    doc.setTextColor(130, 130, 148);
    doc.text(String(item.qty || 1), x + cw * 0.62, this.y + 5, {
      align: "center",
    });
    doc.text(formatCurrency(item.price || 0), x + cw * 0.8, this.y + 5, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 18, 26);
    doc.text(formatCurrency(total), x + cw, this.y + 5, { align: "right" });
    doc.setDrawColor(240, 240, 243);
    doc.setLineWidth(0.2);
    doc.line(x, this.y + RH, x + cw, this.y + RH);
    this.y += RH + 1;
  }

  /* Totals */
  this.y += 4;
  this.need(28);
  var tot = proposal.totals || {};
  doc.setFillColor(246, 246, 250);
  doc.roundedRect(x + cw * 0.5, this.y, cw * 0.5, 26, 2, 2, "F");
  var tx = x + cw - 5,
    ty = this.y + 7;
  var lx = x + cw * 0.53;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 128);
  doc.text("Subtotal", lx, ty);
  doc.text(formatCurrency(tot.subtotal || 0), tx, ty, { align: "right" });
  ty += 5.5;

  if (proposal.taxRate) {
    doc.text("Tax (" + proposal.taxRate + "%)", lx, ty);
    doc.text(formatCurrency(tot.tax || 0), tx, ty, { align: "right" });
    ty += 5.5;
  }
  if (proposal.discount) {
    doc.text("Discount", lx, ty);
    doc.setTextColor(210, 40, 40);
    doc.text("-" + formatCurrency(proposal.discount), tx, ty, {
      align: "right",
    });
    doc.setTextColor(110, 110, 128);
    ty += 5.5;
  }

  doc.setDrawColor(215, 215, 222);
  doc.setLineWidth(0.35);
  doc.line(lx, ty - 1, x + cw, ty - 1);
  ty += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 40);
  doc.text("TOTAL", lx, ty);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(this.ac.r, this.ac.g, this.ac.b);
  doc.text(formatCurrency(tot.grand || 0), tx, ty, { align: "right" });

  this.y += 32;
};

/* ─────────────────────────── TIMELINE ─────────────────── */
PDFCtx.prototype.renderTimeline = function (text) {
  var doc = this.doc,
    ac = this.ac;
  var lines = text
    .split("\n")
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);

  for (var i = 0; i < lines.length; i++) {
    this.need(14);
    var line = lines[i],
      bx = this.ML + 4,
      by = this.y;

    /* Connector line to next dot */
    if (i < lines.length - 1) {
      doc.setDrawColor(ac.r, ac.g, ac.b);
      doc.setLineWidth(0.3);
      doc.line(bx, by + 2, bx, by + 12);
    }
    /* Dot ring */
    doc.setFillColor(255, 255, 255);
    doc.circle(bx, by, 2.5, "F");
    doc.setDrawColor(ac.r, ac.g, ac.b);
    doc.setLineWidth(0.7);
    doc.circle(bx, by, 2.5, "S");

    /* Split "Week N: rest" for bold label */
    var ci = line.indexOf(":");
    if (ci > 0 && ci < 14) {
      var lbl = line.slice(0, ci + 1);
      var rest = line.slice(ci + 1).trim();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(ac.r, ac.g, ac.b);
      var lw = doc.getTextWidth(lbl + " ");
      doc.text(lbl + " ", bx + 8, by + 1.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(44, 44, 56);
      var rLines = doc.splitTextToSize(rest, this.CW - 8 - lw);
      doc.text(rLines[0] || "", bx + 8 + lw, by + 1.5);
      for (var rl = 1; rl < rLines.length; rl++) {
        this.y += 4.8;
        this.need(6);
        doc.text(rLines[rl], bx + 8, this.y + 1.5);
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(44, 44, 56);
      var tl2 = doc.splitTextToSize(line, this.CW - 8);
      doc.text(tl2[0], bx + 8, by + 1.5);
      for (var t2 = 1; t2 < tl2.length; t2++) {
        this.y += 4.8;
        this.need(6);
        doc.text(tl2[t2], bx + 8, this.y + 1.5);
      }
    }
    this.y += 11;
  }
  this.y += 5;
};

/* ─────────────────────────── SIGNATURE ────────────────── */
PDFCtx.prototype.renderSignature = function () {
  this.need(46);
  var doc = this.doc,
    ac = this.ac,
    x = this.ML,
    w = this.CW;
  var y = this.y + 6;

  doc.setDrawColor(ac.r, ac.g, ac.b);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y, w, 36, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(ac.r, ac.g, ac.b);
  doc.text("ACCEPTANCE & SIGNATURE", x + 6, y + 8);

  var c1x = x + 6,
    c2x = x + w / 2 + 6,
    ly = y + 29;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(165, 165, 178);
  doc.text("Client Signature", c1x, y + 16);
  doc.text("Date", c2x, y + 16);

  doc.setDrawColor(205, 205, 212);
  doc.setLineWidth(0.4);
  doc.line(c1x, ly, c1x + w / 2 - 14, ly);
  doc.line(c2x, ly, x + w - 6, ly);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(88, 88, 105);
  doc.text(
    safeStr(this.p.client && this.p.client.name, "Client Name"),
    c1x,
    ly + 5,
  );
  doc.text("Date of Acceptance", c2x, ly + 5);

  this.y += 50;
};

/* ─────────────────────────── FOOTER (all pages) ───────── */
PDFCtx.prototype.stampFooters = function () {
  var doc = this.doc;
  var ac = this.ac;
  var total = doc.getNumberOfPages();
  var tpl = this.tpl;
  var isDark = tpl === "corporate" || tpl === "tech";
  var sender = safeStr(this.p.sender && this.p.sender.name, "ProposalForge");
  var PH = this.PH,
    PW = this.PW,
    ML = this.ML,
    CW = this.CW;
  var FY = PH - 7; /* baseline of footer text */

  for (var pg = 1; pg <= total; pg++) {
    doc.setPage(pg);

    if (isDark) {
      doc.setFillColor(13, 13, 20);
      doc.rect(0, PH - 12, PW, 12, "F");
    } else {
      doc.setDrawColor(228, 228, 233);
      doc.setLineWidth(0.25);
      doc.line(ML, PH - 12, ML + CW, PH - 12);
    }

    var textColor = isDark ? [72, 80, 105] : [175, 175, 185];

    /* Left: sender name only */
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(sender, ML, FY);

    /* Right: "Page N of M" */
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Page " + pg + " of " + total, ML + CW, FY, { align: "right" });
  }
};

/* ─────────────────────────── PAGE CHECK ───────────────── */
PDFCtx.prototype.need = function (mm) {
  if (this.y + (mm || 8) > this.PH - this.FOOTER - 4) {
    this.doc.addPage();
    this.pageN++;
    this.y = 14;
  }
};

/* ─────────────────────────── HELPERS ──────────────────── */
/* Safe date formatter — works inside jsPDF context (no Intl needed) */
function pdfFormatDate(dateStr) {
  if (!dateStr) return "N/A";
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  try {
    var parts = String(dateStr).split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
    return MONTHS[m] + " " + d + ", " + y;
  } catch (e) {
    return dateStr;
  }
}

function pdfHexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function safeStr(val, fallback) {
  return val && typeof val === "string" && val.trim()
    ? val.trim()
    : fallback || "";
}

function pdfFilename(p) {
  var parts = ["ProposalForge"];
  if (p.client && p.client.name) parts.push(pdfClean(p.client.name));
  if (p.title && p.title !== "New Proposal") parts.push(pdfClean(p.title));
  parts.push((p.date || "").slice(0, 7) || "draft");
  return parts.join("_") + ".pdf";
}
function pdfClean(s) {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9 \-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 28);
}
var buildFilename = pdfFilename;
var generateFilename = pdfFilename;
