/* ═══════════════════════════════════════════════════════════
   ProposalForge — main.js
   Alpine.js root component.
   Wires together all modules: data, pricing, preview,
   smart builder, PDF export, and localStorage persistence.
═══════════════════════════════════════════════════════════ */

/**
 * Root Alpine.js component factory.
 * Registered as x-data="proposalForge()" on <html>.
 */
function proposalForge() {
  return {

    /* ─── UI State ─── */
    currentView:      'landing',   // 'landing' | 'builder'
    activeTab:        'details',   // 'details' | 'content' | 'pricing' | 'style'
    mobileTab:        'editor',    // 'editor' | 'preview'
    darkMode:         true,
    previewScale:     0.72,
    saveStatus:       'Save',
    isExporting:      false,
    showSmartBuilder: false,
    showSavedModal:   false,

    /* ─── Toast ─── */
    toast: { show: false, message: '' },

    /* ─── Accent ─── */
    accentColor: '#7c5cff',

    /* ─── Smart Builder ─── */
    smartBuilderInput: '',
    isGenerating:      false,
    aiStatusMessage:   '',
    aiProgress:        0,

    /* ─── Static Data (from proposal-data.js) ─── */
    templates:       TEMPLATES,
    accentColors:    ACCENT_COLORS,
    landingFeatures: LANDING_FEATURES,
    demoPackages:    DEMO_PACKAGES,
    editorTabs:      EDITOR_TABS,

    /* ─── Proposal Object ─── */
    proposal: null,

    /* ─── Saved proposals list ─── */
    savedProposals: [],

    /* ─── Debounced preview update ─── */
    debouncedPreviewUpdate: null,

    /* ═══════════════════════════════════════════════
       INIT
    ═══════════════════════════════════════════════ */
    init() {
      // Load theme preference
      const savedTheme = lsGet('pf_theme', 'dark');
      this.darkMode = savedTheme !== 'light';
      this._applyTheme();

      // Load saved proposals list
      this.savedProposals = lsGet('pf_saved', []);

      // Create a fresh proposal
      this.proposal = createNewProposal();
      this.accentColor = this.proposal.accentColor;

      // Wire debounced preview renderer
      this.debouncedPreviewUpdate = debounce(() => {
        this._renderPreview();
      }, 180);

      // Watch for proposal changes (Alpine reactivity handles this via @input)
      this.$watch('accentColor', val => {
        this.proposal.accentColor = val;
        this._renderPreview();
      });

      this.$watch('currentView', val => {
        if (val === 'builder') {
          this.$nextTick(() => {
            this._renderPreview();
          });
        }
      });

      this.$watch('proposal.template', () => this._renderPreview());
    },

    /* ═══════════════════════════════════════════════
       THEME
    ═══════════════════════════════════════════════ */
    toggleTheme() {
      this.darkMode = !this.darkMode;
      this._applyTheme();
      lsSet('pf_theme', this.darkMode ? 'dark' : 'light');
    },

    _applyTheme() {
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    /* ═══════════════════════════════════════════════
       NAVIGATION
    ═══════════════════════════════════════════════ */
    startNewProposal() {
      this.proposal     = createNewProposal();
      this.accentColor  = this.proposal.accentColor;
      this.activeTab    = 'details';
      this.currentView  = 'builder';
      this.saveStatus   = 'Save';
    },

    openSmartBuilder() {
      this.showSmartBuilder = true;
      if (this.currentView !== 'builder') {
        // Start a new proposal silently so data is ready
        this.proposal    = createNewProposal();
        this.accentColor = this.proposal.accentColor;
      }
    },

    /* ═══════════════════════════════════════════════
       PREVIEW
    ═══════════════════════════════════════════════ */
    _renderPreview() {
      renderPreview(this.proposal);
    },

    /* ═══════════════════════════════════════════════
       PRICING
    ═══════════════════════════════════════════════ */
    calcTotals() {
      calculateTotals(this.proposal);
      this._renderPreview();
    },

    addLineItem() {
      addLineItem(this.proposal);
      this.calcTotals();
    },

    removeLineItem(index) {
      removeLineItem(this.proposal, index);
      this.calcTotals();
    },

    addPackage() {
      addPackage(this.proposal);
    },

    removePackage(index) {
      removePackage(this.proposal, index);
      this.calcTotals();
    },

    formatCurrency(amount) {
      return formatCurrency(amount);
    },

    /* ═══════════════════════════════════════════════
       LOGO UPLOAD
    ═══════════════════════════════════════════════ */
    async handleLogoUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        this._showToast('Logo file must be under 2MB');
        return;
      }

      try {
        const dataUrl = await fileToDataURL(file);
        this.proposal.logoUrl = dataUrl;
        this._renderPreview();
      } catch {
        this._showToast('Could not read logo file');
      }

      // Reset input so same file can be re-uploaded
      event.target.value = '';
    },

    /* ═══════════════════════════════════════════════
       SMART BUILDER
    ═══════════════════════════════════════════════ */
    async runSmartBuilder() {
      if (!this.smartBuilderInput.trim()) return;
      if (this.isGenerating) return;

      this.isGenerating   = true;
      this.aiProgress     = 0;
      this.aiStatusMessage = 'Initialising…';

      await runSmartBuilder({
        brief:    this.smartBuilderInput,
        proposal: this.proposal,

        onProgress: (pct, message) => {
          this.aiProgress      = pct;
          this.aiStatusMessage = message;
        },

        onComplete: () => {
          this.isGenerating = false;
          calculateTotals(this.proposal);

          // Apply package recommendation based on brief
          applyPackageRecommendation(this.proposal, this.smartBuilderInput);
          calculateTotals(this.proposal);

          this.showSmartBuilder = false;
          this.currentView      = 'builder';
          this.activeTab        = 'content';

          this.$nextTick(() => {
            this._renderPreview();
          });

          this._showToast('✦ Proposal generated successfully');
        },

        onError: (msg) => {
          this.isGenerating = false;
          this._showToast('Error: ' + msg);
        },
      });
    },

    /* ═══════════════════════════════════════════════
       SAVE / LOAD (localStorage)
    ═══════════════════════════════════════════════ */
    saveProposal() {
      this.proposal.savedAt = new Date().toISOString();
      const clone = deepClone(this.proposal);

      // Update existing or add new
      const existingIdx = this.savedProposals.findIndex(s => s.id === clone.id);
      if (existingIdx >= 0) {
        this.savedProposals[existingIdx] = clone;
      } else {
        this.savedProposals.unshift(clone);
      }

      // Keep max 20 proposals
      if (this.savedProposals.length > 20) {
        this.savedProposals = this.savedProposals.slice(0, 20);
      }

      lsSet('pf_saved', this.savedProposals);

      this.saveStatus = '✓ Saved';
      setTimeout(() => { this.saveStatus = 'Save'; }, 2000);
      this._showToast('Proposal saved locally');
    },

    loadProposal(index) {
      const saved = this.savedProposals[index];
      if (!saved) return;

      this.proposal    = deepClone(saved);
      this.accentColor = this.proposal.accentColor || '#7c5cff';
      this.currentView = 'builder';
      this.activeTab   = 'details';

      this.$nextTick(() => {
        calculateTotals(this.proposal);
        this._renderPreview();
      });

      this._showToast('Proposal loaded');
    },

    deleteSaved(index) {
      this.savedProposals.splice(index, 1);
      lsSet('pf_saved', this.savedProposals);
    },

    /* ═══════════════════════════════════════════════
       PDF EXPORT
    ═══════════════════════════════════════════════ */
    async exportPDF() {
      if (this.isExporting) return;

      // pdf-export.js clones the preview internally — no scale change needed
      await exportToPDF(
        this.proposal,
        /* onStart    */ () => { this.isExporting = true; },
        /* onComplete */ () => { this.isExporting = false; this._showToast('✓ PDF exported successfully'); },
        /* onError    */ (msg) => { this.isExporting = false; this._showToast('Export failed: ' + msg); }
      );
    },

    /* ═══════════════════════════════════════════════
       TOAST
    ═══════════════════════════════════════════════ */
    _showToast(message, duration = 3000) {
      this.toast = { show: true, message };
      setTimeout(() => { this.toast.show = false; }, duration);
    },

  }; // end return
} // end proposalForge()
