/**
 * DeepSat Document Viewer
 * Email-gated sharing + Read/Review mode commenting for any HTML document.
 */

// ─── Styles ────────────────────────────────────────────────────
const STYLES = `
/* Gate */
.dsv-gate-bg { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:9998; }
.dsv-gate-card { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:12px; padding:48px 40px; max-width:420px; width:90%; z-index:9999; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.3); }
.dsv-gate-brand { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#0969da; margin-bottom:4px; }
.dsv-gate-tagline { font-size:12px; color:#656d76; margin-bottom:24px; }
.dsv-gate-title { font-size:18px; font-weight:600; color:#1f2328; margin-bottom:24px; line-height:1.4; }
#dsv-gate-form input { display:block; width:100%; padding:10px 14px; margin-bottom:10px; border:1px solid #d1d9e0; border-radius:6px; font-size:14px; font-family:inherit; }
#dsv-gate-form input:focus { outline:none; border-color:#0969da; box-shadow:0 0 0 3px rgba(9,105,218,0.15); }
#dsv-gate-form button { display:block; width:100%; padding:10px; background:#0969da; color:#fff; border:none; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; margin-top:4px; }
#dsv-gate-form button:hover { background:#0860c4; }
.dsv-gate-footer { font-size:11px; color:#8b949e; margin-top:16px; }

/* Gated content */
#dsv-content.gated { filter:blur(6px); pointer-events:none; user-select:none; }

/* Mode bar */
#dsv-mode-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:#f6f8fa; border:1px solid #d1d9e0; border-radius:8px; margin-bottom:20px; position:sticky; top:0; z-index:100; }
.dsv-mode-left { display:flex; align-items:center; gap:10px; }
.dsv-toggle { position:relative; display:inline-flex; align-items:center; cursor:pointer; user-select:none; }
.dsv-toggle-track { width:44px; height:24px; background:#d1d9e0; border-radius:12px; position:relative; transition:background 0.2s; }
.dsv-toggle-track.active { background:#0969da; }
.dsv-toggle-thumb { position:absolute; top:2px; left:2px; width:20px; height:20px; background:#fff; border-radius:50%; transition:left 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
.dsv-toggle-track.active .dsv-toggle-thumb { left:22px; }
.dsv-toggle-label { font-size:12px; font-weight:600; color:#656d76; }
.dsv-toggle-label.active { color:#0969da; }
.dsv-mode-count { font-size:12px; color:#656d76; }

/* Sidebar */
#dsv-sidebar { position:fixed; top:0; right:-340px; width:320px; height:100vh; background:rgba(255,255,255,0.97); backdrop-filter:blur(8px); border-left:1px solid #d1d9e0; z-index:1001; transition:right 0.25s ease; display:flex; flex-direction:column; box-shadow:-8px 0 24px rgba(0,0,0,0.08); }
#dsv-sidebar.open { right:0; }
.dsv-sb-header { padding:16px 20px; border-bottom:1px solid #d1d9e0; font-weight:600; font-size:14px; color:#656d76; text-transform:uppercase; letter-spacing:0.5px; position:sticky; top:0; background:rgba(255,255,255,0.97); flex-shrink:0; }
#dsv-sb-list { flex:1; overflow-y:auto; }
.dsv-sb-empty { padding:40px 20px; text-align:center; color:#656d76; font-size:13px; line-height:1.6; }
.dsv-sb-comment { padding:14px 20px; border-bottom:1px solid #f0f0f0; }
.dsv-sb-meta { display:flex; justify-content:space-between; font-size:11px; color:#8b949e; margin-bottom:6px; }
.dsv-sb-meta strong { color:#1f2328; font-size:12px; }
.dsv-sb-selected { font-size:12px; color:#656d76; font-style:italic; padding:4px 8px; background:#fff8c5; border-radius:4px; margin-bottom:6px; line-height:1.4; border-left:3px solid #d4a72c; }
.dsv-sb-text { font-size:13px; color:#1f2328; line-height:1.5; }

/* Sidebar input */
#dsv-sb-input { border-top:2px solid #0969da; padding:16px 20px; background:#f6f8fa; flex-shrink:0; position:sticky; bottom:0; }
#dsv-sb-input-quote { font-size:12px; color:#656d76; font-style:italic; padding:6px 8px; background:#fff8c5; border-radius:4px; border-left:3px solid #d4a72c; margin-bottom:8px; line-height:1.4; max-height:60px; overflow:hidden; }
#dsv-sb-input textarea { width:100%; border:1px solid #d1d9e0; border-radius:6px; padding:8px; font-size:13px; font-family:inherit; resize:none; }
#dsv-sb-input textarea:focus { outline:none; border-color:#0969da; box-shadow:0 0 0 3px rgba(9,105,218,0.15); }
.dsv-sb-input-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }
.dsv-sb-input-actions button { padding:5px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #d1d9e0; background:#fff; color:#1f2328; }
.dsv-sb-input-actions button:last-child { background:#0969da; color:#fff; border-color:#0969da; }

/* Highlights */
mark.dsv-highlight { background:#fff8c5; padding:1px 2px; border-radius:2px; position:relative; }
mark.dsv-active-selection { background:#b6d7ff; padding:1px 2px; border-radius:2px; }

/* Comment markers */
.dsv-comment-marker { position:absolute; right:-36px; top:50%; transform:translateY(-50%); width:24px; height:24px; background:#0969da; color:#fff; border-radius:50%; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.15); z-index:10; }
.dsv-comment-marker:hover { background:#0860c4; transform:translateY(-50%) scale(1.1); }

@media print {
  #dsv-mode-bar, #dsv-sidebar, #dsv-gate { display:none !important; }
  mark.dsv-highlight { background:none; }
  .dsv-comment-marker { display:none; }
}
@media (max-width:768px) {
  #dsv-sidebar { width:100%; right:-100%; }
  .dsv-gate-card { padding:32px 24px; }
  .dsv-comment-marker { display:none; }
}
`;

// ─── Supabase helpers ──────────────────────────────────────────
function supabasePost(url, key, table, data) {
  if (!url || !key) return Promise.resolve(null);
  return fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  }).then(r => r.ok ? r.json() : null).catch(() => null);
}

function supabaseGet(url, key, table, query) {
  if (!url || !key) return Promise.resolve(null);
  return fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).then(r => r.ok ? r.json() : null).catch(() => null);
}

// ─── Highlight engine (handles cross-element selections) ───────
function highlightTextNodes(range, className) {
  // Walk all text nodes within the range and wrap each one
  const marks = [];
  const doc = range.startContainer.ownerDocument || document;

  // If range is within a single text node, simple case
  if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    const mark = doc.createElement('mark');
    mark.className = className;
    try {
      range.surroundContents(mark);
      marks.push(mark);
    } catch { /* ignore */ }
    return marks;
  }

  // Complex case: iterate text nodes in range
  const treeWalker = doc.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
  );

  const textNodes = [];
  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;
    if (range.intersectsNode(node)) {
      textNodes.push(node);
    }
  }

  for (const node of textNodes) {
    const nodeRange = doc.createRange();

    if (node === range.startContainer) {
      nodeRange.setStart(node, range.startOffset);
      nodeRange.setEnd(node, node.textContent.length);
    } else if (node === range.endContainer) {
      nodeRange.setStart(node, 0);
      nodeRange.setEnd(node, range.endOffset);
    } else {
      nodeRange.selectNodeContents(node);
    }

    if (nodeRange.toString().length === 0) continue;

    const mark = doc.createElement('mark');
    mark.className = className;
    try {
      nodeRange.surroundContents(mark);
      marks.push(mark);
    } catch { /* skip nodes that can't be wrapped */ }
  }

  return marks;
}

function clearMarks(className) {
  const marks = document.querySelectorAll(`mark.${className}`);
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
  });
}

function addPermanentHighlight(text, commentNumber, onMarkerClick) {
  const content = document.getElementById('dsv-content');
  if (!content) return;
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('.dsv-highlight, .dsv-comment-marker, .dsv-active-selection')) continue;
    const idx = node.textContent.indexOf(text);
    if (idx >= 0) {
      try {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + text.length);
        const mark = document.createElement('mark');
        mark.className = 'dsv-highlight';
        range.surroundContents(mark);

        const marker = document.createElement('span');
        marker.className = 'dsv-comment-marker';
        marker.textContent = commentNumber;
        marker.title = 'View comment';
        if (onMarkerClick) marker.addEventListener('click', onMarkerClick);
        mark.appendChild(marker);
      } catch { /* skip cross-element text */ }
      break;
    }
  }
}

// ─── Main factory ──────────────────────────────────────────────
export function createViewer(userConfig = {}) {
  const config = {
    supabaseUrl: null,
    supabaseKey: null,
    docId: null,
    requireEmail: true,
    brandName: 'DeepSat',
    brandTagline: 'Defense Intelligence from VLEO',
    ...userConfig,
  };

  const state = {
    viewerEmail: null,
    viewerName: null,
    comments: [],
    selectionRange: null,
    activeMarks: [],
    reviewMode: false,
  };

  function localGet(key) { try { return JSON.parse(localStorage.getItem(`dsv_${key}`)); } catch { return null; } }
  function localSet(key, val) { try { localStorage.setItem(`dsv_${key}`, JSON.stringify(val)); } catch {} }

  // ─── Email gate ──────────────────────────────────────────
  function showEmailGate() {
    const overlay = document.createElement('div');
    overlay.id = 'dsv-gate';
    overlay.innerHTML = `
      <div class="dsv-gate-bg"></div>
      <div class="dsv-gate-card">
        <div class="dsv-gate-brand">${config.brandName}</div>
        <div class="dsv-gate-tagline">${config.brandTagline}</div>
        <div class="dsv-gate-title">${document.title}</div>
        <form id="dsv-gate-form">
          <input type="text" id="dsv-gate-name" placeholder="Your name" required autocomplete="name" />
          <input type="email" id="dsv-gate-email" placeholder="Your email" required autocomplete="email" />
          <button type="submit">View Document</button>
        </form>
        <div class="dsv-gate-footer">Your info is only used to track document access.</div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.getElementById('dsv-gate-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('dsv-gate-name').value.trim();
      const email = document.getElementById('dsv-gate-email').value.trim();
      if (!email) return;

      state.viewerEmail = email;
      state.viewerName = name;
      localSet('viewer', { email, name });

      await supabasePost(config.supabaseUrl, config.supabaseKey, 'doc_views', {
        doc_id: config.docId, email, name,
        viewed_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });

      unlockContent();
    });
  }

  function unlockContent() {
    const gate = document.getElementById('dsv-gate');
    if (gate) gate.remove();
    document.body.style.overflow = '';
    const content = document.getElementById('dsv-content');
    content.classList.remove('gated');
    content.style.filter = 'none';
    content.style.pointerEvents = 'auto';
    content.style.userSelect = 'auto';
    buildCommentUI();
    loadComments();
  }

  // ─── Comment UI ──────────────────────────────────────────
  function buildCommentUI() {
    const modeBar = document.createElement('div');
    modeBar.id = 'dsv-mode-bar';
    modeBar.innerHTML = `
      <div class="dsv-mode-left">
        <span id="dsv-label-read" class="dsv-toggle-label active">Read</span>
        <div class="dsv-toggle" id="dsv-mode-toggle">
          <div class="dsv-toggle-track" id="dsv-toggle-track"><div class="dsv-toggle-thumb"></div></div>
        </div>
        <span id="dsv-label-review" class="dsv-toggle-label">Review</span>
      </div>
      <div class="dsv-mode-right">
        <span id="dsv-comment-count" class="dsv-mode-count"></span>
      </div>
    `;
    const content = document.getElementById('dsv-content');
    content.parentNode.insertBefore(modeBar, content);

    const sidebar = document.createElement('div');
    sidebar.id = 'dsv-sidebar';
    sidebar.innerHTML = `
      <div class="dsv-sb-header">Comments</div>
      <div id="dsv-sb-list"></div>
      <div id="dsv-sb-input" style="display:none;">
        <div id="dsv-sb-input-quote"></div>
        <textarea id="dsv-sb-input-text" placeholder="Add your comment..." rows="3"></textarea>
        <div class="dsv-sb-input-actions">
          <button id="dsv-sb-cancel">Cancel</button>
          <button id="dsv-sb-submit">Comment</button>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    document.getElementById('dsv-mode-toggle').addEventListener('click', () => setMode(!state.reviewMode));
    content.addEventListener('mouseup', onTextSelect);
    document.getElementById('dsv-sb-cancel').addEventListener('click', cancelInput);
    document.getElementById('dsv-sb-submit').addEventListener('click', submitComment);
  }

  function setMode(isReview) {
    state.reviewMode = isReview;
    document.getElementById('dsv-toggle-track').classList.toggle('active', isReview);
    document.getElementById('dsv-label-read').classList.toggle('active', !isReview);
    document.getElementById('dsv-label-review').classList.toggle('active', isReview);
    document.getElementById('dsv-sidebar').classList.toggle('open', isReview);
    if (!isReview) cancelInput();
  }

  function onTextSelect() {
    if (!state.reviewMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().trim().length < 3) return;

    const range = sel.getRangeAt(0);
    const selectedText = sel.toString().trim().substring(0, 200);

    state.selectionRange = { text: selectedText };

    // Don't wrap selection in marks — browser native highlight is enough

    // Show input in sidebar
    const inputArea = document.getElementById('dsv-sb-input');
    document.getElementById('dsv-sb-input-quote').textContent = `"${selectedText}"`;
    inputArea.style.display = 'block';
    document.getElementById('dsv-sb-input-text').value = '';

    if (inputArea.scrollIntoView) inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function cancelInput() {
    document.getElementById('dsv-sb-input').style.display = 'none';
    document.getElementById('dsv-sb-input-text').value = '';
    state.activeMarks = [];
    state.selectionRange = null;
  }

  function submitComment() {
    const text = document.getElementById('dsv-sb-input-text').value.trim();
    if (!text || !state.selectionRange) return;

    const comment = {
      doc_id: config.docId,
      email: state.viewerEmail,
      name: state.viewerName,
      selected_text: state.selectionRange.text,
      comment: text,
      created_at: new Date().toISOString(),
    };

    state.comments.push(comment);
    supabasePost(config.supabaseUrl, config.supabaseKey, 'doc_comments', comment); // fire and forget
    localSet(`comments_${config.docId}`, state.comments);

    // Add permanent highlight for the commented text
    addPermanentHighlight(state.selectionRange.text, state.comments.length, () => setMode(true));

    renderComments();
    document.getElementById('dsv-sb-input').style.display = 'none';
    document.getElementById('dsv-sb-input-text').value = '';
    state.selectionRange = null;
    state.activeMarks = [];
  }

  async function loadComments() {
    const hasSupabase = config.supabaseUrl && config.supabaseKey;
    let comments;

    if (hasSupabase) {
      // Supabase is configured: always trust server, even if empty
      const result = await supabaseGet(config.supabaseUrl, config.supabaseKey, 'doc_comments', `doc_id=eq.${config.docId}&order=created_at.asc`);
      if (result !== null) {
        // Successful response (even if empty array) — use it and sync to localStorage
        comments = result;
        localSet(`comments_${config.docId}`, comments);
      } else {
        // Supabase failed (network error, etc.) — fall back to localStorage
        comments = localGet(`comments_${config.docId}`) || [];
      }
    } else {
      // No Supabase configured — localStorage only
      comments = localGet(`comments_${config.docId}`) || [];
    }

    state.comments = comments;
    renderComments();
    comments.forEach((c, i) => addPermanentHighlight(c.selected_text, i + 1, () => setMode(true)));
  }

  function renderComments() {
    const list = document.getElementById('dsv-sb-list');
    if (!list) return;

    const countEl = document.getElementById('dsv-comment-count');
    if (countEl) countEl.textContent = state.comments.length > 0 ? `${state.comments.length} comment${state.comments.length === 1 ? '' : 's'}` : '';

    if (state.comments.length === 0) {
      list.innerHTML = '<div class="dsv-sb-empty">No comments yet.<br>Switch to <strong>Review</strong> mode, then select text to comment.</div>';
      return;
    }
    list.innerHTML = state.comments.map(c => `
      <div class="dsv-sb-comment">
        <div class="dsv-sb-meta"><strong>${c.name || c.email || ''}</strong><span>${new Date(c.created_at).toLocaleString()}</span></div>
        <div class="dsv-sb-selected">"${c.selected_text}"</div>
        <div class="dsv-sb-text">${c.comment}</div>
      </div>
    `).join('');
  }

  // ─── Init ────────────────────────────────────────────────
  function init() {
    if (!config.docId) config.docId = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_');

    // Inject styles
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    // Wrap body content
    const content = document.createElement('div');
    content.id = 'dsv-content';
    while (document.body.firstChild) content.appendChild(document.body.firstChild);
    document.body.appendChild(content);

    // Check returning visitor
    const saved = localGet('viewer');
    if (saved && saved.email) {
      state.viewerEmail = saved.email;
      state.viewerName = saved.name;
      unlockContent();
      return;
    }

    if (config.requireEmail) {
      content.classList.add('gated');
      showEmailGate();
    } else {
      unlockContent();
    }
  }

  function getMode() { return state.reviewMode ? 'review' : 'read'; }

  return { init, getMode, setMode };
}

// Auto-init for non-module usage (script tag in HTML)
try {
  if (typeof window !== 'undefined' && typeof process === 'undefined') {
    window.DeepSatViewer = {
      init(config) {
        const viewer = createViewer(config);
        viewer.init();
        return viewer;
      }
    };
  }
} catch { /* running in test/node environment */ }
