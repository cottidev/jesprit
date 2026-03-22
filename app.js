const STORAGE_KEY = "jesprit-entries";
const THEME_KEY = "jesprit-theme";
const FONT_FAMILY_KEY = "jesprit-font-family";
const FONT_SIZE_KEY = "jesprit-font-size";
const FONT_WEIGHT_KEY = "jesprit-font-weight";
const FONT_STYLE_KEY = "jesprit-font-style";
const FOCUS_MODE_KEY = "jesprit-focus-mode";

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 24;
const DEFAULT_FONT_SIZE = 19;
const DEFAULT_FONT_FAMILY = "serif";
const FONT_FAMILY_SEQUENCE = ["serif", "sans", "mono"];

const elements = {
  body: document.body,
  sidebar: document.getElementById("sidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  mobileMenuToggle: document.getElementById("mobileMenuToggle"),
  mobileMenu: document.getElementById("mobileMenu"),
  mobileEntriesBtn: document.getElementById("mobileEntriesBtn"),
  searchInput: document.getElementById("searchInput"),
  themeToggle: document.getElementById("themeToggle"),
  themeLabel: document.getElementById("themeLabel"),
  themeIcon: document.getElementById("themeIcon"),
  mobileThemeToggle: document.getElementById("mobileThemeToggle"),
  mobileThemeLabel: document.getElementById("mobileThemeLabel"),
  mobileThemeIcon: document.getElementById("mobileThemeIcon"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  mobileExportPdfBtn: document.getElementById("mobileExportPdfBtn"),
  newEntryBtn: document.getElementById("newEntryBtn"),
  mobileQuickNewBtn: document.getElementById("mobileQuickNewBtn"),
  emptyStateNewBtn: document.getElementById("emptyStateNewBtn"),
  entriesList: document.getElementById("entriesList"),
  entryCount: document.getElementById("entryCount"),
  editorMeta: document.getElementById("editorMeta"),
  saveStatus: document.getElementById("saveStatus"),
  deleteBtn: document.getElementById("deleteBtn"),
  focusToggle: document.getElementById("focusToggle"),
  focusToggleLabel: document.getElementById("focusToggleLabel"),
  focusExitBtn: document.getElementById("focusExitBtn"),
  editToolbar: document.getElementById("editToolbar"),
  fontWeightWheel: document.getElementById("fontWeightWheel"),
  fontWeightValue: document.getElementById("fontWeightValue"),
  fontStyleWheel: document.getElementById("fontStyleWheel"),
  fontStyleValue: document.getElementById("fontStyleValue"),
  fontFamilyWheel: document.getElementById("fontFamilyWheel"),
  fontFamilyValue: document.getElementById("fontFamilyValue"),
  fontSizeWheel: document.getElementById("fontSizeWheel"),
  fontSizeValue: document.getElementById("fontSizeValue"),
  mobileFontWeightSelect: document.getElementById("mobileFontWeightSelect"),
  mobileFontStyleSelect: document.getElementById("mobileFontStyleSelect"),
  mobileFontFamilySelect: document.getElementById("mobileFontFamilySelect"),
  mobileFontSizeDown: document.getElementById("mobileFontSizeDown"),
  mobileFontSizeUp: document.getElementById("mobileFontSizeUp"),
  mobileFontSizeValue: document.getElementById("mobileFontSizeValue"),
  deleteModal: document.getElementById("deleteModal"),
  deleteModalMessage: document.getElementById("deleteModalMessage"),
  deleteCancelBtn: document.getElementById("deleteCancelBtn"),
  deleteConfirmBtn: document.getElementById("deleteConfirmBtn"),
  emptyState: document.getElementById("emptyState"),
  editorSection: document.getElementById("editorSection"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  wordCount: document.getElementById("wordCount"),
  charCount: document.getElementById("charCount"),
  readingTime: document.getElementById("readingTime"),
  importBtn: document.getElementById("importBtn"),
  mobileImportBtn: document.getElementById("mobileImportBtn"),
  importFileInput: document.getElementById("importFileInput"),
};

const state = {
  entries: [],
  filteredEntries: [],
  activeEntryId: null,
  searchTerm: "",
  pendingDeleteId: null,
  preferences: {
    fontWeight: "regular",
    fontStyle: "roman",
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    focusMode: false,
  },
  savedSelection: null,
};

function initializeApp() {
  mountFloatingToolbar();
  state.entries = loadEntries();
  state.activeEntryId = state.entries[0]?.id ?? null;
  state.preferences = loadPreferences();
  updateSearchPlaceholder();
  applyTheme(localStorage.getItem(THEME_KEY) || inferDefaultTheme());
  updateFormattingControlLabels();
  setFocusMode(state.preferences.focusMode);
  registerServiceWorker();
  bindEvents();
  refreshUI();
}

function mountFloatingToolbar() {
  if (!elements.editToolbar) return;
  document.body.appendChild(elements.editToolbar);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed.", error);
    });
  });
}

function bindEvents() {
  elements.importBtn.addEventListener("click", () =>
    elements.importFileInput.click(),
  );
  elements.mobileImportBtn.addEventListener("click", () => {
    closeMobileMenu();
    elements.importFileInput.click();
  });
  elements.importFileInput.addEventListener("change", handleImportFile);
  elements.newEntryBtn.addEventListener("click", createEntry);
  elements.mobileQuickNewBtn.addEventListener("click", createEntry);
  elements.emptyStateNewBtn.addEventListener("click", createEntry);
  elements.deleteBtn.addEventListener("click", deleteActiveEntry);
  elements.searchInput.addEventListener("input", handleSearch);
  elements.titleInput.addEventListener("input", handleEditorInput);
  elements.contentInput.addEventListener(
    "beforeinput",
    handleEditorBeforeInput,
  );
  elements.contentInput.addEventListener("input", handleEditorInput);
  elements.contentInput.addEventListener(
    "mouseup",
    saveSelectionIfInsideEditor,
  );
  elements.contentInput.addEventListener("keyup", saveSelectionIfInsideEditor);
  elements.contentInput.addEventListener("focus", saveSelectionIfInsideEditor);
  document.addEventListener("selectionchange", saveSelectionIfInsideEditor);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.mobileThemeToggle.addEventListener("click", () => {
    toggleTheme();
    closeMobileMenu();
  });
  elements.exportPdfBtn.addEventListener("click", exportAsPdf);
  elements.mobileExportPdfBtn.addEventListener("click", () => {
    closeMobileMenu();
    exportAsPdf();
  });
  elements.mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  elements.mobileEntriesBtn.addEventListener("click", () => {
    closeMobileMenu();
    openSidebar();
  });
  elements.closeSidebarBtn.addEventListener("click", closeSidebar);
  elements.sidebarBackdrop.addEventListener("click", closeSidebar);
  elements.deleteCancelBtn.addEventListener("click", closeDeleteModal);
  elements.deleteConfirmBtn.addEventListener("click", confirmDeleteEntry);
  elements.focusToggle.addEventListener("click", toggleFocusMode);
  elements.focusExitBtn.addEventListener("click", () => setFocusMode(false));
  elements.fontWeightWheel.addEventListener("wheel", handleFontWeightWheel, {
    passive: false,
  });
  elements.fontStyleWheel.addEventListener("wheel", handleFontStyleWheel, {
    passive: false,
  });
  elements.fontFamilyWheel.addEventListener("wheel", handleFontFamilyWheel, {
    passive: false,
  });
  elements.fontSizeWheel.addEventListener("wheel", handleFontSizeWheel, {
    passive: false,
  });
  elements.mobileFontWeightSelect.addEventListener(
    "change",
    handleMobileFontWeightChange,
  );
  elements.mobileFontStyleSelect.addEventListener(
    "change",
    handleMobileFontStyleChange,
  );
  elements.mobileFontFamilySelect.addEventListener(
    "change",
    handleMobileFontFamilyChange,
  );
  elements.mobileFontSizeDown.addEventListener("click", () =>
    adjustFontSize(-1),
  );
  elements.mobileFontSizeUp.addEventListener("click", () => adjustFontSize(1));

  elements.deleteModal.addEventListener("click", (event) => {
    if (event.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });

  document.addEventListener("click", (event) => {
    if (!isMobileMenuOpen()) return;

    const clickedInsideMenu = elements.mobileMenu.contains(event.target);
    const clickedToggle = elements.mobileMenuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeMobileMenu();
    }
  });

  elements.entriesList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");

    if (deleteButton) {
      deleteEntry(deleteButton.dataset.deleteId);
      return;
    }

    const entryButton = event.target.closest("[data-entry-id]");

    if (!entryButton) return;
    selectEntry(entryButton.dataset.entryId);
    closeSidebar();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isMobileMenuOpen()) {
        closeMobileMenu();
        return;
      }

      if (state.pendingDeleteId) {
        closeDeleteModal();
        return;
      }

      if (state.preferences.focusMode) {
        setFocusMode(false);
        return;
      }

      closeSidebar();
    }
  });

  window.addEventListener("resize", handleViewportChange);
}

function loadEntries() {
  const rawEntries = localStorage.getItem(STORAGE_KEY);

  if (!rawEntries) return [];

  try {
    return normalizeEntries(JSON.parse(rawEntries));
  } catch (error) {
    console.error("Could not parse saved entries.", error);
    setStatus("Storage error");
    return [];
  }
}

function loadPreferences() {
  const storedFontFamily = localStorage.getItem(FONT_FAMILY_KEY);
  const storedFontSize = Number(localStorage.getItem(FONT_SIZE_KEY));
  const storedFontWeight = localStorage.getItem(FONT_WEIGHT_KEY);
  const storedFontStyle = localStorage.getItem(FONT_STYLE_KEY);
  const storedFocusMode = localStorage.getItem(FOCUS_MODE_KEY) === "true";

  return {
    fontWeight: storedFontWeight === "bold" ? "bold" : "regular",
    fontStyle: storedFontStyle === "italic" ? "italic" : "roman",
    fontFamily: isSupportedFontFamily(storedFontFamily)
      ? storedFontFamily
      : DEFAULT_FONT_FAMILY,
    fontSize: clampFontSize(
      Number.isFinite(storedFontSize) ? storedFontSize : DEFAULT_FONT_SIZE,
    ),
    focusMode: storedFocusMode,
  };
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function savePreferences() {
  localStorage.setItem(FONT_WEIGHT_KEY, state.preferences.fontWeight);
  localStorage.setItem(FONT_STYLE_KEY, state.preferences.fontStyle);
  localStorage.setItem(FONT_FAMILY_KEY, state.preferences.fontFamily);
  localStorage.setItem(FONT_SIZE_KEY, String(state.preferences.fontSize));
  localStorage.setItem(FOCUS_MODE_KEY, String(state.preferences.focusMode));
}

function normalizeEntries(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeEntry)
    .filter(Boolean)
    .sort((first, second) => second.date - first.date);
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (
    typeof entry.id !== "string" ||
    typeof entry.title !== "string" ||
    typeof entry.content !== "string"
  ) {
    return null;
  }

  const parsedDate = Number(entry.date);
  if (!Number.isFinite(parsedDate)) return null;

  return {
    id: entry.id,
    title: entry.title,
    content: normalizeStoredContent(entry.content),
    date: parsedDate,
  };
}

function normalizeStoredContent(content) {
  if (!content.trim()) return "";

  if (looksLikeHtml(content)) {
    return content;
  }

  return plainTextToHtml(content);
}

function createEntry() {
  const timestamp = Date.now();
  const entry = {
    id: String(timestamp),
    title: "",
    content: "",
    date: timestamp,
  };

  state.entries.unshift(entry);
  state.activeEntryId = entry.id;
  saveEntries();
  setStatus("New entry created");
  refreshUI();
  elements.titleInput.focus();
}

function selectEntry(entryId) {
  state.activeEntryId = entryId;
  renderEntries();
  renderEditor();
}

function getActiveEntry() {
  return (
    state.entries.find((entry) => entry.id === state.activeEntryId) || null
  );
}

function handleEditorInput() {
  const activeEntry = getActiveEntry();
  if (!activeEntry) return;

  activeEntry.title = elements.titleInput.value;
  activeEntry.content = getNormalizedEditorHtml();
  activeEntry.date = Date.now();
  sortEntries();
  saveEntries();
  applySearch();
  renderEntries();
  renderEditor(false);
  setStatus("Saved automatically");
}

function handleEditorBeforeInput(event) {
  if (!event.inputType.startsWith("insert")) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed)
    return;

  const range = selection.getRangeAt(0);
  if (!elements.contentInput.contains(range.commonAncestorContainer)) return;

  ensureTypingStyleAtCaret(range);
}

function deleteActiveEntry() {
  const activeEntry = getActiveEntry();
  if (!activeEntry) return;

  deleteEntry(activeEntry.id);
}

function deleteEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;

  state.pendingDeleteId = entryId;
  elements.deleteModalMessage.textContent = `This will permanently delete "${getDisplayTitle(entry)}" from this device.`;
  openDeleteModal();
}

function confirmDeleteEntry() {
  const entryId = state.pendingDeleteId;
  if (!entryId) return;

  state.entries = state.entries.filter((item) => item.id !== entryId);

  if (state.activeEntryId === entryId) {
    state.activeEntryId = state.entries[0]?.id ?? null;
  }

  saveEntries();
  closeDeleteModal();
  setStatus("Entry deleted");
  refreshUI();
}

function handleSearch(event) {
  state.searchTerm = event.target.value.trim().toLowerCase();
  applySearch();
  renderEntries();
}

function applySearch() {
  const term = state.searchTerm;

  state.filteredEntries = state.entries.filter((entry) => {
    if (!term) return true;

    const plainText = htmlToPlainText(entry.content).toLowerCase();
    return entry.title.toLowerCase().includes(term) || plainText.includes(term);
  });
}

function refreshUI() {
  applySearch();
  renderEntries();
  renderEditor();
  updateFocusToggleLabel();
  updateFormattingControlLabels();
}

function renderEntries() {
  const entries = state.filteredEntries;
  elements.entryCount.textContent = `${entries.length} ${entries.length === 1 ? "note" : "notes"}`;

  if (!entries.length) {
    elements.entriesList.innerHTML = `
      <div class="rounded-[26px] border border-dashed border-stone-300/90 px-5 py-8 text-center text-sm leading-6 text-stone-500 dark:border-stone-700 dark:text-stone-400">
        ${state.searchTerm ? "No entries match your search." : "No entries yet. Start writing your first thought."}
      </div>
    `;
    return;
  }

  // Group entries by date bucket
  const groups = [];
  const seen = new Map();
  for (const entry of entries) {
    const label = getDateGroup(entry.date);
    if (!seen.has(label)) {
      seen.set(label, []);
      groups.push({ label, items: seen.get(label) });
    }
    seen.get(label).push(entry);
  }

  elements.entriesList.innerHTML = groups
    .map(
      ({ label, items }) => `
    <div class="entry-group">
      <p class="entry-group-label">${escapeHtml(label)}</p>
      ${items
        .map((entry) => {
          const isActive = entry.id === state.activeEntryId;
          const wordCount = countWords(htmlToPlainText(entry.content));
          return `
          <article class="entry-card ${isActive ? "active" : ""} rounded-[24px] p-4 mb-3">
            <div class="flex items-start gap-3">
              <button
                type="button"
                data-entry-id="${escapeHtml(entry.id)}"
                class="min-w-0 flex-1 text-left"
              >
                <h3 class="truncate font-serif text-[1.45rem] font-semibold leading-tight tracking-tight text-stone-900 dark:text-stone-100">${escapeHtml(getDisplayTitle(entry))}</h3>
                <p class="entry-preview mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">${escapeHtml(getPreview(entry))}</p>
                <div class="mt-3 flex items-center gap-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">${formatDate(entry.date)}</p>
                  ${wordCount > 0 ? `<span class="text-stone-300 dark:text-stone-700">·</span><p class="text-[11px] text-stone-400 dark:text-stone-500">${wordCount} words</p>` : ""}
                </div>
              </button>
              <button
                type="button"
                data-delete-id="${escapeHtml(entry.id)}"
                class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-stone-400 transition hover:bg-stone-200/80 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                aria-label="Delete entry"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M3 6h18"></path>
                  <path d="M8 6V4h8v2"></path>
                  <path d="m19 6-1 14H6L5 6"></path>
                </svg>
              </button>
            </div>
          </article>
        `;
        })
        .join("")}
    </div>
  `,
    )
    .join("");
}

function renderEditor(syncInputs = true) {
  const activeEntry = getActiveEntry();

  if (!activeEntry) {
    elements.emptyState.classList.remove("hidden");
    elements.editorSection.classList.add("hidden");
    elements.editToolbar.classList.add("hidden");
    elements.deleteBtn.disabled = true;
    elements.editorMeta.textContent =
      "No entries yet. Start writing your first thought.";
    elements.wordCount.textContent = "0 words";
    elements.charCount.textContent = "0 characters";
    elements.contentInput.innerHTML = "";
    return;
  }

  elements.emptyState.classList.add("hidden");
  elements.editorSection.classList.remove("hidden");
  elements.editToolbar.classList.remove("hidden");
  elements.deleteBtn.disabled = false;

  if (syncInputs) {
    elements.titleInput.value = activeEntry.title;
    elements.contentInput.innerHTML = activeEntry.content;
  }

  updateEditorStats(activeEntry.content);
  elements.editorMeta.textContent = `Last edited ${formatDate(activeEntry.date, true)}`;
}

function updateEditorStats(htmlContent) {
  const plainText = htmlToPlainText(htmlContent);
  const words = countWords(plainText);
  elements.wordCount.textContent = `${words} words`;
  elements.charCount.textContent = `${plainText.length} characters`;
  const mins = Math.max(1, Math.round(words / 200));
  elements.readingTime.textContent = `~${mins} min read`;
}

function exportAsPdf() {
  const activeEntry = getActiveEntry();
  if (!activeEntry) {
    setStatus("Open an entry to export");
    return;
  }

  const plainTextContent = htmlToPlainText(activeEntry.content);
  const printableTitle = escapeHtml(getDisplayTitle(activeEntry));
  const printableBody = escapeHtml(plainTextContent).replace(/\n/g, "<br>");
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      setStatus("PDF export failed");
      iframe.remove();
      return;
    }

    frameWindow.focus();
    frameWindow.print();
    setStatus("PDF export ready");
    window.setTimeout(() => iframe.remove(), 1000);
  };

  iframe.srcdoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${printableTitle}</title>
        <style>
          body {
            margin: 0;
            padding: 48px;
            font-family: Georgia, serif;
            color: #1c1917;
            background: #fffdf9;
          }
          .meta {
            font: 600 12px/1.4 system-ui, sans-serif;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #78716c;
            margin-bottom: 16px;
          }
          h1 {
            margin: 0 0 24px;
            font-size: 42px;
            line-height: 1;
          }
          .content {
            font-size: 20px;
            line-height: 1.9;
            white-space: normal;
          }
          @media print {
            body {
              padding: 32px;
            }
          }
        </style>
      </head>
      <body>
        <div class="meta">Jesprit • ${escapeHtml(formatDate(activeEntry.date, true))}</div>
        <h1>${printableTitle}</h1>
        <div class="content">${printableBody || "<em>No content</em>"}</div>
      </body>
    </html>
  `;

  document.body.appendChild(iframe);
}

function handleMobileFontWeightChange(event) {
  state.preferences.fontWeight =
    event.target.value === "bold" ? "bold" : "regular";
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleMobileFontStyleChange(event) {
  state.preferences.fontStyle =
    event.target.value === "italic" ? "italic" : "roman";
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleMobileFontFamilyChange(event) {
  state.preferences.fontFamily = isSupportedFontFamily(event.target.value)
    ? event.target.value
    : DEFAULT_FONT_FAMILY;
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleFontFamilyWheel(event) {
  event.preventDefault();
  const direction = event.deltaY > 0 ? 1 : -1;
  const currentIndex = FONT_FAMILY_SEQUENCE.indexOf(
    state.preferences.fontFamily,
  );
  const nextIndex =
    (currentIndex + direction + FONT_FAMILY_SEQUENCE.length) %
    FONT_FAMILY_SEQUENCE.length;
  state.preferences.fontFamily = FONT_FAMILY_SEQUENCE[nextIndex];
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleFontWeightWheel(event) {
  event.preventDefault();
  state.preferences.fontWeight =
    state.preferences.fontWeight === "bold" ? "regular" : "bold";
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleFontStyleWheel(event) {
  event.preventDefault();
  state.preferences.fontStyle =
    state.preferences.fontStyle === "italic" ? "roman" : "italic";
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function handleFontSizeWheel(event) {
  event.preventDefault();
  const direction = event.deltaY > 0 ? -1 : 1;
  adjustFontSize(direction);
}

function adjustFontSize(step) {
  state.preferences.fontSize = clampFontSize(state.preferences.fontSize + step);
  updateFormattingControlLabels();
  savePreferences();
  applyFormattingToSelection(true);
}

function applyFormattingToSelection(silent = false) {
  if (!restoreSavedSelection()) {
    if (!silent) setStatus("Highlight text first");
    return false;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    if (!silent) setStatus("Highlight text first");
    return false;
  }

  const range = selection.getRangeAt(0);
  if (!elements.contentInput.contains(range.commonAncestorContainer)) {
    if (!silent) setStatus("Select text inside the editor");
    return false;
  }

  const span = document.createElement("span");
  span.dataset.fontFamily = state.preferences.fontFamily;
  span.dataset.fontWeight = state.preferences.fontWeight;
  span.dataset.fontStyle = state.preferences.fontStyle;
  span.style.fontSize = `${state.preferences.fontSize}px`;
  span.style.fontWeight =
    state.preferences.fontWeight === "bold" ? "700" : "500";
  span.style.fontStyle =
    state.preferences.fontStyle === "italic" ? "italic" : "normal";
  span.appendChild(range.extractContents());
  range.insertNode(span);
  mergeAdjacentStyledSpans(elements.contentInput);
  reselectNodeContents(span);
  handleEditorInput();
  setStatus(
    `Applied ${getFontStyleLabel(state.preferences.fontStyle)} ${state.preferences.fontWeight === "bold" ? "Bold" : "Regular"} ${getFontFamilyLabel(state.preferences.fontFamily)} ${state.preferences.fontSize}px`,
  );
  return true;
}

function ensureTypingStyleAtCaret(range) {
  const fontSize = `${state.preferences.fontSize}px`;
  const styledAncestor = getClosestStyledSpan(range.startContainer);

  if (
    styledAncestor &&
    styledAncestor.dataset.fontFamily === state.preferences.fontFamily &&
    styledAncestor.dataset.fontWeight === state.preferences.fontWeight &&
    styledAncestor.dataset.fontStyle === state.preferences.fontStyle &&
    styledAncestor.style.fontSize === fontSize
  ) {
    return;
  }

  const span = document.createElement("span");
  const marker = document.createTextNode("\u200b");

  span.dataset.fontFamily = state.preferences.fontFamily;
  span.dataset.fontWeight = state.preferences.fontWeight;
  span.dataset.fontStyle = state.preferences.fontStyle;
  span.style.fontSize = fontSize;
  span.style.fontWeight =
    state.preferences.fontWeight === "bold" ? "700" : "500";
  span.style.fontStyle =
    state.preferences.fontStyle === "italic" ? "italic" : "normal";
  span.appendChild(marker);
  range.insertNode(span);

  const selection = window.getSelection();
  const nextRange = document.createRange();
  nextRange.setStart(marker, 1);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  state.savedSelection = nextRange.cloneRange();
}

function saveSelectionIfInsideEditor() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!elements.contentInput.contains(range.commonAncestorContainer)) return;

  state.savedSelection = range.cloneRange();
}

function restoreSavedSelection() {
  if (!state.savedSelection) return false;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(state.savedSelection);
  return true;
}

function mergeAdjacentStyledSpans(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const spans = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.tagName === "SPAN" && node.dataset.fontFamily) {
      spans.push(node);
    }
  }

  spans.forEach((span) => {
    const next = span.nextSibling;
    if (
      next &&
      next.nodeType === Node.ELEMENT_NODE &&
      next.tagName === "SPAN" &&
      next.dataset.fontFamily === span.dataset.fontFamily &&
      next.dataset.fontWeight === span.dataset.fontWeight &&
      next.dataset.fontStyle === span.dataset.fontStyle &&
      next.style.fontSize === span.style.fontSize
    ) {
      while (next.firstChild) {
        span.appendChild(next.firstChild);
      }
      next.remove();
    }
  });
}

function reselectNodeContents(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  state.savedSelection = range.cloneRange();
}

function getClosestStyledSpan(node) {
  let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;

  while (current && current !== elements.contentInput) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      current.tagName === "SPAN" &&
      current.dataset.fontFamily
    ) {
      return current;
    }

    current = current.parentNode;
  }

  return null;
}

function updateFormattingControlLabels() {
  elements.fontWeightValue.textContent =
    state.preferences.fontWeight === "bold" ? "Bold" : "Regular";
  elements.fontStyleValue.textContent =
    state.preferences.fontStyle === "italic" ? "Italic" : "Roman";
  elements.fontFamilyValue.textContent = getFontFamilyLabel(
    state.preferences.fontFamily,
  );
  elements.fontSizeValue.textContent = `${state.preferences.fontSize}px`;
  elements.mobileFontWeightSelect.value = state.preferences.fontWeight;
  elements.mobileFontStyleSelect.value = state.preferences.fontStyle;
  elements.mobileFontFamilySelect.value = state.preferences.fontFamily;
  elements.mobileFontSizeValue.textContent = `${state.preferences.fontSize}px`;
}

function toggleFocusMode() {
  setFocusMode(!state.preferences.focusMode);
}

function setFocusMode(enabled) {
  state.preferences.focusMode = Boolean(enabled);
  elements.body.classList.toggle("focus-mode", state.preferences.focusMode);
  closeMobileMenu();
  updateFocusToggleLabel();
  savePreferences();

  if (!state.preferences.focusMode) {
    closeSidebar();
  }
}

function updateFocusToggleLabel() {
  const isPhone = window.innerWidth <= 640;
  if (state.preferences.focusMode) {
    elements.focusToggleLabel.textContent = isPhone ? "Exit" : "Exit focus";
    return;
  }

  elements.focusToggleLabel.textContent = isPhone ? "Focus" : "Focus mode";
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  elements.themeLabel.textContent = dark ? "Light mode" : "Dark mode";
  elements.themeIcon.innerHTML = dark ? moonIcon() : sunIcon();
  elements.mobileThemeLabel.textContent = dark ? "Light mode" : "Dark mode";
  elements.mobileThemeIcon.innerHTML = dark ? moonIcon() : sunIcon();
}

function inferDefaultTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function openSidebar() {
  if (state.preferences.focusMode) return;
  closeMobileMenu();
  elements.sidebar.classList.add("open");
  elements.sidebarBackdrop.classList.add("open");
}

function closeSidebar() {
  elements.sidebar.classList.remove("open");
  elements.sidebarBackdrop.classList.remove("open");
}

function toggleMobileMenu() {
  if (isMobileMenuOpen()) {
    closeMobileMenu();
    return;
  }

  openMobileMenu();
}

function openMobileMenu() {
  if (state.preferences.focusMode) return;
  elements.mobileMenu.classList.add("open");
  elements.mobileMenu.setAttribute("aria-hidden", "false");
  elements.mobileMenuToggle.setAttribute("aria-expanded", "true");
}

function closeMobileMenu() {
  elements.mobileMenu.classList.remove("open");
  elements.mobileMenu.setAttribute("aria-hidden", "true");
  elements.mobileMenuToggle.setAttribute("aria-expanded", "false");
}

function isMobileMenuOpen() {
  return elements.mobileMenu.classList.contains("open");
}

function handleViewportChange() {
  updateSearchPlaceholder();
  if (window.innerWidth >= 768) {
    closeMobileMenu();
  }
}

function updateSearchPlaceholder() {
  elements.searchInput.placeholder =
    window.innerWidth <= 640 ? "Search" : "Search title or content";
}

function openDeleteModal() {
  elements.deleteModal.classList.add("open");
  elements.deleteModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  elements.deleteConfirmBtn.focus();
}

function closeDeleteModal() {
  state.pendingDeleteId = null;
  elements.deleteModal.classList.remove("open");
  elements.deleteModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function sortEntries() {
  state.entries.sort((first, second) => second.date - first.date);
  state.activeEntryId = getActiveEntry()?.id || state.activeEntryId;
}

function setStatus(message) {
  elements.saveStatus.textContent = message;
}

function getDisplayTitle(entry) {
  return entry.title.trim() || "Untitled entry";
}

function getPreview(entry) {
  const preview = htmlToPlainText(entry.content).trim() || "No content yet.";
  return preview.length > 110 ? `${preview.slice(0, 110)}...` : preview;
}

function getNormalizedEditorHtml() {
  return normalizeEditorHtml(elements.contentInput.innerHTML);
}

function normalizeEditorHtml(html) {
  return html
    .replace(/\u200b/g, "")
    .replace(/<div><br><\/div>/g, "<br>")
    .replace(/<\/div><div>/g, "<br>")
    .replace(/<div>/g, "")
    .replace(/<\/div>/g, "")
    .trim();
}

function htmlToPlainText(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent.replace(/\u00a0/g, " ").replace(/\u200b/g, "");
}

function plainTextToHtml(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function looksLikeHtml(text) {
  return /<[^>]+>/.test(text);
}

function formatDate(timestamp, withTime = false) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(timestamp));
}

function formatFilenameDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function clampFontSize(size) {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size));
}

function isSupportedFontFamily(value) {
  return FONT_FAMILY_SEQUENCE.includes(value);
}

function getFontFamilyLabel(fontFamily) {
  if (fontFamily === "sans") return "Sans";
  if (fontFamily === "mono") return "Mono";
  return "Serif";
}

function getFontStyleLabel(fontStyle) {
  return fontStyle === "italic" ? "Italic" : "Roman";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sunIcon() {
  return `
    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"></path>
    </svg>
  `;
}

function moonIcon() {
  return `
    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
    </svg>
  `;
}

// ─── Import ──────────────────────────────────────────────────────────────────

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  // Reset so the same file can be re-selected
  elements.importFileInput.value = "";

  if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
    importFromPdf(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result;
    if (typeof text !== "string") {
      setStatus("Could not read file");
      return;
    }

    if (file.name.endsWith(".json")) {
      importFromJson(text);
    } else {
      importFromText(text, file.name);
    }
  };
  reader.readAsText(file);
}

function importFromPdf(file) {
  setStatus("Reading PDF…");

  // Dynamically load pdf.js from CDN
  const existingScript = document.getElementById("pdfjs-script");
  const workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const libSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

  function runExtraction() {
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (!pdfjsLib) {
      setStatus("PDF library failed to load");
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }

        const title = file.name
          .replace(/\.pdf$/i, "")
          .replace(/[-_]+/g, " ")
          .trim();
        const timestamp = Date.now();
        const entry = {
          id: String(timestamp),
          title,
          content: plainTextToHtml(fullText.trim()),
          date: timestamp,
        };

        state.entries.unshift(entry);
        state.activeEntryId = entry.id;
        saveEntries();
        setStatus(`Imported PDF: "${title}"`);
        refreshUI();
      } catch (err) {
        console.error("PDF extraction error:", err);
        setStatus("Could not read PDF");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  if (existingScript) {
    runExtraction();
    return;
  }

  const script = document.createElement("script");
  script.id = "pdfjs-script";
  script.src = libSrc;
  script.onload = runExtraction;
  script.onerror = () => setStatus("Could not load PDF library");
  document.head.appendChild(script);
}

function importFromJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    setStatus("Invalid JSON file");
    return;
  }

  const incoming = normalizeEntries(Array.isArray(parsed) ? parsed : []);
  if (!incoming.length) {
    setStatus("No valid entries found in file");
    return;
  }

  const existingIds = new Set(state.entries.map((e) => e.id));
  const fresh = incoming.filter((e) => !existingIds.has(e.id));

  if (!fresh.length) {
    setStatus("All entries already exist");
    return;
  }

  state.entries.push(...fresh);
  sortEntries();
  state.activeEntryId = fresh[0].id;
  saveEntries();
  setStatus(
    `Imported ${fresh.length} ${fresh.length === 1 ? "entry" : "entries"}`,
  );
  refreshUI();
}

function importFromText(text, filename) {
  const timestamp = Date.now();
  // Derive a title from the filename (strip extension)
  const title = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  const entry = {
    id: String(timestamp),
    title,
    content: plainTextToHtml(text),
    date: timestamp,
  };

  state.entries.unshift(entry);
  state.activeEntryId = entry.id;
  saveEntries();
  setStatus(`Imported "${title}"`);
  refreshUI();
}

// ─── Date grouping helpers ────────────────────────────────────────────────────

function getDateGroup(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfWeek =
    startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  if (timestamp >= startOfToday) return "Today";
  if (timestamp >= startOfWeek) return "This week";
  if (timestamp >= startOfMonth) return "This month";
  if (timestamp >= startOfYear) return "This year";
  return date.getFullYear().toString();
}

initializeApp();
