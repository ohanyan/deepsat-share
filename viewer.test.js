import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll import the viewer module after rewriting it as ESM
import { createViewer } from './viewer.js';

function setupDocument(html) {
  document.body.innerHTML = html;
  return document;
}

function selectText(container, text) {
  // Find the text in the DOM and create a real selection
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const idx = node.textContent.indexOf(text);
    if (idx >= 0) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + text.length);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return range;
    }
  }
  throw new Error(`Text "${text}" not found in container`);
}

function selectAcrossElements(startEl, startText, endEl, endText) {
  // Select text that spans multiple elements
  const startWalker = document.createTreeWalker(startEl, NodeFilter.SHOW_TEXT);
  let startNode, startOffset;
  while (startWalker.nextNode()) {
    const idx = startWalker.currentNode.textContent.indexOf(startText);
    if (idx >= 0) {
      startNode = startWalker.currentNode;
      startOffset = idx;
      break;
    }
  }

  const endWalker = document.createTreeWalker(endEl, NodeFilter.SHOW_TEXT);
  let endNode, endOffset;
  while (endWalker.nextNode()) {
    const idx = endWalker.currentNode.textContent.indexOf(endText);
    if (idx >= 0) {
      endNode = endWalker.currentNode;
      endOffset = idx + endText.length;
      break;
    }
  }

  if (!startNode || !endNode) throw new Error('Could not find text nodes for cross-element selection');

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return range;
}

// ─── Email Gate ──────────────────────────────────────────────

describe('Email Gate', () => {
  let viewer;

  beforeEach(() => {
    localStorage.clear();
    setupDocument('<div>Test content here</div>');
    viewer = createViewer({ requireEmail: true, docId: 'test-doc' });
  });

  it('shows email gate when requireEmail is true', () => {
    viewer.init();
    expect(document.getElementById('dsv-gate')).not.toBeNull();
  });

  it('blurs content behind the gate', () => {
    viewer.init();
    const content = document.getElementById('dsv-content');
    expect(content.classList.contains('gated')).toBe(true);
  });

  it('unlocks content after email submission', async () => {
    viewer.init();
    const nameInput = document.getElementById('dsv-gate-name');
    const emailInput = document.getElementById('dsv-gate-email');
    nameInput.value = 'Test User';
    emailInput.value = 'test@example.com';
    document.getElementById('dsv-gate-form').dispatchEvent(new Event('submit'));

    // Wait for async supabase call in handler
    await new Promise(r => setTimeout(r, 10));

    // Gate should be removed, content should be visible
    expect(document.getElementById('dsv-gate')).toBeNull();
    const content = document.getElementById('dsv-content');
    expect(content.classList.contains('gated')).toBe(false);
  });

  it('skips gate for returning visitors with saved email', () => {
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    viewer.init();
    expect(document.getElementById('dsv-gate')).toBeNull();
  });

  it('skips gate when requireEmail is false', () => {
    document.body.innerHTML = '<div>Test content</div>';
    const v = createViewer({ requireEmail: false, docId: 'test-doc' });
    v.init();
    expect(document.getElementById('dsv-gate')).toBeNull();
  });
});

// ─── Mode Toggle ─────────────────────────────────────────────

describe('Mode Toggle (Read/Review)', () => {
  let viewer;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    setupDocument('<div><p>Some content to review.</p></div>');
    viewer = createViewer({ requireEmail: false, docId: 'test-doc' });
    viewer.init();
  });

  it('starts in Review mode by default', () => {
    expect(viewer.getMode()).toBe('review');
  });

  it('sidebar is always open', () => {
    expect(document.getElementById('dsv-sidebar').classList.contains('open')).toBe(true);
  });

  it('switches to Read mode and back', () => {
    document.getElementById('dsv-mode-toggle').click();
    expect(viewer.getMode()).toBe('read');
    document.getElementById('dsv-mode-toggle').click();
    expect(viewer.getMode()).toBe('review');
  });

  it('sidebar closes in Read mode', () => {
    document.getElementById('dsv-mode-toggle').click(); // switch to read
    expect(document.getElementById('dsv-sidebar').classList.contains('open')).toBe(false);
  });

  it('does NOT squeeze content when sidebar is open', () => {
    const content = document.getElementById('dsv-content');
    expect(content.style.marginRight).toBe('');
  });
});

// ─── Text Selection & Highlighting ───────────────────────────

describe('Text Selection', () => {
  let viewer, content;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    setupDocument(`
      <div>
        <p id="p1">First paragraph with some text.</p>
        <p id="p2"><strong>Bold text</strong> and normal text in second paragraph.</p>
        <p id="p3">Third paragraph here.</p>
      </div>
    `);
    viewer = createViewer({ requireEmail: false, docId: 'test-doc' });
    viewer.init();
    content = document.getElementById('dsv-content');
  });

  it('ignores text selection in Read mode', () => {
    document.getElementById('dsv-mode-toggle').click(); // switch to read
    selectText(content, 'First paragraph');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    // Sidebar input should NOT appear
    expect(document.getElementById('dsv-sb-input').style.display).not.toBe('block');
  });

  it('shows sidebar input when text is selected in Review mode', () => {
    // Already in review mode by default
    selectText(content, 'First paragraph');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(document.getElementById('dsv-sb-input').style.display).toBe('block');
  });

  it('shows the selected text as a quote in sidebar', () => {
    selectText(content, 'some text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const quote = document.getElementById('dsv-sb-input-quote');
    expect(quote.textContent).toContain('some text');
  });

  it('wraps single-node selection with active highlight that preserves layout', () => {
    selectText(content, 'some text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('some text');
  });

  it('handles selection across element boundaries', () => {
    // Select from "Bold text" (inside <strong>) to "and normal" (outside <strong>)
    const p2 = document.getElementById('p2');
    selectAcrossElements(p2, 'Bold', p2, 'normal');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Should still capture the text even across elements
    const quote = document.getElementById('dsv-sb-input-quote');
    expect(quote.textContent).toContain('Bold');
    expect(quote.textContent).toContain('normal');
  });

  it('handles selection across paragraph boundaries', () => {
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    selectAcrossElements(p1, 'some text', p2, 'Bold text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const quote = document.getElementById('dsv-sb-input-quote');
    expect(quote.textContent.length).toBeGreaterThan(0);
  });

  it('hides sidebar input when cancelled', () => {
    selectText(content, 'First paragraph');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(document.getElementById('dsv-sb-input').style.display).toBe('block');

    document.getElementById('dsv-sb-cancel').click();
    expect(document.getElementById('dsv-sb-input').style.display).toBe('none');
  });
});

// ─── Comment Submission ──────────────────────────────────────

describe('Comment Submission', () => {
  let viewer, content;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    setupDocument(`
      <div>
        <p>This is a paragraph with important text to comment on.</p>
        <p>Second paragraph with more content.</p>
      </div>
    `);
    viewer = createViewer({ requireEmail: false, docId: 'test-comment' });
    viewer.init();
    content = document.getElementById('dsv-content');
  });

  it('submits a comment and adds it to the sidebar', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Great point!';
    document.getElementById('dsv-sb-submit').click();

    const comments = document.querySelectorAll('.dsv-sb-comment');
    expect(comments.length).toBe(1);
    expect(comments[0].textContent).toContain('important text');
    expect(comments[0].textContent).toContain('Great point!');
  });

  it('adds permanent highlight after submit', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Nice';
    document.getElementById('dsv-sb-submit').click();

    expect(content.querySelectorAll('mark.dsv-highlight').length).toBe(1);
  });

  it('adds a comment marker to the highlighted text', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Marker test';
    document.getElementById('dsv-sb-submit').click();

    const markers = content.querySelectorAll('.dsv-comment-marker');
    expect(markers.length).toBe(1);
    expect(markers[0].textContent).toBe('1');
  });

  it('numbers markers sequentially for multiple comments', () => {

    // Comment 1
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    document.getElementById('dsv-sb-input-text').value = 'First comment';
    document.getElementById('dsv-sb-submit').click();

    // Comment 2
    selectText(content, 'more content');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    document.getElementById('dsv-sb-input-text').value = 'Second comment';
    document.getElementById('dsv-sb-submit').click();

    const markers = content.querySelectorAll('.dsv-comment-marker');
    expect(markers.length).toBe(2);
    expect(markers[0].textContent).toBe('1');
    expect(markers[1].textContent).toBe('2');
  });

  it('hides sidebar input after submission', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Done';
    document.getElementById('dsv-sb-submit').click();

    expect(document.getElementById('dsv-sb-input').style.display).toBe('none');
  });

  it('does not submit empty comments', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = '';
    document.getElementById('dsv-sb-submit').click();

    expect(document.querySelectorAll('.dsv-sb-comment').length).toBe(0);
  });

  it('persists comments to localStorage', () => {
    selectText(content, 'important text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Persisted!';
    document.getElementById('dsv-sb-submit').click();

    const stored = JSON.parse(localStorage.getItem('dsv_comments_test-comment'));
    expect(stored.length).toBe(1);
    expect(stored[0].comment).toBe('Persisted!');
    expect(stored[0].selected_text).toBe('important text');
  });
});

// ─── Comment Markers ─────────────────────────────────────────

describe('Comment Markers', () => {
  let viewer, content;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    setupDocument(`
      <div>
        <p>Paragraph one with text.</p>
        <p>Paragraph two with other text.</p>
      </div>
    `);
    viewer = createViewer({ requireEmail: false, docId: 'test-markers' });
    viewer.init();
    content = document.getElementById('dsv-content');
  });

  it('clicking a marker opens Review mode and sidebar', () => {
    // Add a comment first
    selectText(content, 'Paragraph one');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    document.getElementById('dsv-sb-input-text').value = 'Test';
    document.getElementById('dsv-sb-submit').click();

    // Switch to read mode
    document.getElementById('dsv-mode-toggle').click();
    expect(viewer.getMode()).toBe('read');

    // Click the marker
    const marker = content.querySelector('.dsv-comment-marker');
    marker.click();
    expect(viewer.getMode()).toBe('review');
  });
});

// ─── Cross-Element Highlighting ──────────────────────────────

describe('Selection Highlighting — All Scenarios', () => {
  let viewer, content;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    setupDocument(`
      <div>
        <p id="p1">Start of <strong>bold section</strong> and then regular text here.</p>
        <p id="p2">Another <em>italic word</em> in this paragraph.</p>
        <p id="p3">Third paragraph with plain text only.</p>
        <ul id="list1"><li>List item one</li><li>List item two</li></ul>
      </div>
    `);
    viewer = createViewer({ requireEmail: false, docId: 'test-highlight' });
    viewer.init();
    content = document.getElementById('dsv-content');
  });

  // --- Single text node (simplest case) ---

  it('highlights a few words within one text node', () => {
    selectText(content, 'plain text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById('dsv-sb-input-quote').textContent).toContain('plain text');
  });

  it('highlights an entire paragraph of plain text', () => {
    selectText(content, 'Third paragraph with plain text only.');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById('dsv-sb-input-quote').textContent).toContain('Third paragraph');
  });

  // --- Across inline elements (bold, italic) within one paragraph ---

  it('highlights text spanning from bold into normal text', () => {
    const p1 = document.getElementById('p1');
    selectAcrossElements(p1, 'bold section', p1, 'regular');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById('dsv-sb-input-quote').textContent).toContain('bold');
  });

  it('highlights text spanning from normal into italic', () => {
    const p2 = document.getElementById('p2');
    selectAcrossElements(p2, 'Another', p2, 'italic');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById('dsv-sb-input-quote').textContent).toContain('Another');
  });

  // --- Across paragraphs ---

  it('highlights text spanning two paragraphs', () => {
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    selectAcrossElements(p1, 'regular text', p2, 'Another');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(document.getElementById('dsv-sb-input-quote').textContent.length).toBeGreaterThan(0);
  });

  it('highlights text spanning three paragraphs', () => {
    const p1 = document.getElementById('p1');
    const p3 = document.getElementById('p3');
    selectAcrossElements(p1, 'regular', p3, 'plain text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
  });

  // --- Across different element types (paragraph + list) ---

  it('highlights text spanning from paragraph into list item', () => {
    const p3 = document.getElementById('p3');
    const list = document.getElementById('list1');
    selectAcrossElements(p3, 'plain text', list, 'List item');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const marks = content.querySelectorAll('mark.dsv-active-selection');
    expect(marks.length).toBeGreaterThanOrEqual(1);
  });

  // --- Cleanup ---

  it('clears all active selection marks on cancel', () => {
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    selectAcrossElements(p1, 'bold section', p2, 'italic');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(content.querySelectorAll('mark.dsv-active-selection').length).toBeGreaterThanOrEqual(1);

    document.getElementById('dsv-sb-cancel').click();
    expect(content.querySelectorAll('mark.dsv-active-selection').length).toBe(0);
  });

  it('clears active marks and adds permanent highlight on submit', () => {
    selectText(content, 'plain text');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'Test comment';
    document.getElementById('dsv-sb-submit').click();

    expect(content.querySelectorAll('mark.dsv-active-selection').length).toBe(0);
    expect(content.querySelectorAll('mark.dsv-highlight').length).toBe(1);
  });

  // --- No layout breakage ---

  it('does not change the text content of the document', () => {
    const textBefore = content.textContent;
    const p1 = document.getElementById('p1');
    const p2 = document.getElementById('p2');
    selectAcrossElements(p1, 'bold section', p2, 'italic');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Text content should be identical (marks are just wrappers)
    expect(content.textContent).toBe(textBefore);
  });
});

// ─── Data State Management ───────────────────────────────────

describe('Data States: Supabase vs localStorage', () => {
  let fetchSpy;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dsv_viewer', JSON.stringify({ email: 'test@example.com', name: 'Test' }));
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  function initViewer(opts = {}) {
    setupDocument('<div><p>Content here.</p></div>');
    const viewer = createViewer({
      requireEmail: false,
      docId: 'test-data',
      supabaseUrl: 'https://fake.supabase.co',
      supabaseKey: 'fake-key',
      ...opts,
    });
    viewer.init();
    return viewer;
  }

  it('uses Supabase response when Supabase is configured and returns data', async () => {
    const supabaseComments = [
      { doc_id: 'test-data', email: 'a@b.com', name: 'Alice', selected_text: 'Content', comment: 'From Supabase', created_at: new Date().toISOString() }
    ];
    fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(supabaseComments) });

    initViewer();
    await new Promise(r => setTimeout(r, 50));

    const comments = document.querySelectorAll('.dsv-sb-comment');
    expect(comments.length).toBe(1);
    expect(comments[0].textContent).toContain('From Supabase');
  });

  it('uses Supabase empty response (NOT localStorage) when Supabase returns empty array', async () => {
    // Stale data in localStorage
    localStorage.setItem('dsv_comments_test-data', JSON.stringify([
      { doc_id: 'test-data', email: 'x@y.com', name: 'Stale', selected_text: 'old', comment: 'Stale comment', created_at: new Date().toISOString() }
    ]));

    // Supabase returns empty (comments were deleted server-side)
    fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    initViewer();
    await new Promise(r => setTimeout(r, 50));

    // Should show NO comments, not the stale localStorage ones
    const comments = document.querySelectorAll('.dsv-sb-comment');
    expect(comments.length).toBe(0);
  });

  it('falls back to localStorage only when Supabase is NOT configured', async () => {
    localStorage.setItem('dsv_comments_test-local', JSON.stringify([
      { doc_id: 'test-local', email: 'x@y.com', name: 'Local', selected_text: 'text', comment: 'Local comment', created_at: new Date().toISOString() }
    ]));

    setupDocument('<div><p>Content here.</p></div>');
    const viewer = createViewer({
      requireEmail: false,
      docId: 'test-local',
      // No supabaseUrl or supabaseKey
    });
    viewer.init();
    await new Promise(r => setTimeout(r, 50));

    const comments = document.querySelectorAll('.dsv-sb-comment');
    expect(comments.length).toBe(1);
    expect(comments[0].textContent).toContain('Local comment');
  });

  it('falls back to localStorage when Supabase fetch fails', async () => {
    localStorage.setItem('dsv_comments_test-data', JSON.stringify([
      { doc_id: 'test-data', email: 'x@y.com', name: 'Fallback', selected_text: 'text', comment: 'Fallback comment', created_at: new Date().toISOString() }
    ]));

    // Supabase fails
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    initViewer();
    await new Promise(r => setTimeout(r, 50));

    // Should fall back to localStorage since Supabase errored
    const comments = document.querySelectorAll('.dsv-sb-comment');
    expect(comments.length).toBe(1);
    expect(comments[0].textContent).toContain('Fallback comment');
  });

  it('saves comments to both Supabase and localStorage on submit', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const viewer = initViewer();
    await new Promise(r => setTimeout(r, 50));

    const content = document.getElementById('dsv-content');
    selectText(content, 'Content');
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    document.getElementById('dsv-sb-input-text').value = 'New comment';
    document.getElementById('dsv-sb-submit').click();

    // Should have called Supabase POST
    const postCalls = fetchSpy.mock.calls.filter(c => c[1]?.method === 'POST');
    expect(postCalls.length).toBeGreaterThan(0);

    // Should also be in localStorage
    const stored = JSON.parse(localStorage.getItem('dsv_comments_test-data'));
    expect(stored.length).toBe(1);
    expect(stored[0].comment).toBe('New comment');
  });

  it('syncs localStorage after successful Supabase load', async () => {
    const supabaseComments = [
      { doc_id: 'test-data', email: 'a@b.com', name: 'Alice', selected_text: 'Content', comment: 'Server comment', created_at: new Date().toISOString() }
    ];
    fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(supabaseComments) });

    initViewer();
    await new Promise(r => setTimeout(r, 50));

    // localStorage should now match Supabase, not stale data
    const stored = JSON.parse(localStorage.getItem('dsv_comments_test-data'));
    expect(stored.length).toBe(1);
    expect(stored[0].comment).toBe('Server comment');
  });
});

// ─── Email Gate Data States ──────────────────────────────────

describe('Email Gate Data States', () => {
  let fetchSpy;

  beforeEach(() => {
    localStorage.clear();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    global.fetch = fetchSpy;
  });

  it('logs view to Supabase when email is submitted', async () => {
    setupDocument('<div>Content</div>');
    const viewer = createViewer({
      requireEmail: true,
      docId: 'test-view',
      supabaseUrl: 'https://fake.supabase.co',
      supabaseKey: 'fake-key',
    });
    viewer.init();

    document.getElementById('dsv-gate-name').value = 'Test User';
    document.getElementById('dsv-gate-email').value = 'test@example.com';
    document.getElementById('dsv-gate-form').dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 50));

    const postCalls = fetchSpy.mock.calls.filter(c =>
      c[0]?.includes('doc_views') && c[1]?.method === 'POST'
    );
    expect(postCalls.length).toBe(1);
    const body = JSON.parse(postCalls[0][1].body);
    expect(body.email).toBe('test@example.com');
    expect(body.doc_id).toBe('test-view');
  });

  it('saves viewer info to localStorage after gate submission', async () => {
    setupDocument('<div>Content</div>');
    const viewer = createViewer({
      requireEmail: true,
      docId: 'test-view',
      supabaseUrl: 'https://fake.supabase.co',
      supabaseKey: 'fake-key',
    });
    viewer.init();

    document.getElementById('dsv-gate-name').value = 'Jane';
    document.getElementById('dsv-gate-email').value = 'jane@test.com';
    document.getElementById('dsv-gate-form').dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 50));

    const saved = JSON.parse(localStorage.getItem('dsv_viewer'));
    expect(saved.email).toBe('jane@test.com');
    expect(saved.name).toBe('Jane');
  });

  it('still unlocks content when Supabase view logging fails', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));

    setupDocument('<div>Content</div>');
    const viewer = createViewer({
      requireEmail: true,
      docId: 'test-view',
      supabaseUrl: 'https://fake.supabase.co',
      supabaseKey: 'fake-key',
    });
    viewer.init();

    document.getElementById('dsv-gate-name').value = 'Test';
    document.getElementById('dsv-gate-email').value = 'test@fail.com';
    document.getElementById('dsv-gate-form').dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 50));

    // Gate should still be removed even if Supabase failed
    expect(document.getElementById('dsv-gate')).toBeNull();
  });
});
