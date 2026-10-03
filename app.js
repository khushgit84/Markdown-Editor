/* ========= INKDOWN MARKDOWN EDITOR — APP LOGIC ========= */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);

  const editor = $('#editor');
  const preview = $('#preview');
  const wordCount = $('#word-count');

  // Default content
  const DEFAULT_MD = `# Welcome to InkDown ✍️

A beautiful **Markdown Editor** with live preview.

## Features

- 🎨 **Live Preview** — See your markdown rendered in real-time
- ⌨️ **Toolbar Actions** — Bold, italic, headings, links, code & more
- 📊 **Word Count** — Track your writing progress
- 💾 **Download** — Export your work as a \`.md\` file
- 🔄 **Auto-save** — Your content persists in the browser

## Try Some Markdown

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

### List

1. First item
2. Second item
3. Third item

### Table

| Feature | Status |
|---------|--------|
| Live Preview | ✅ |
| Syntax Highlighting | ✅ |
| Export | ✅ |

### Links & Emphasis

Visit [Google](https://google.com) or try *italic* and **bold** text.

---

Start editing on the left to see changes here! 🚀
`;

  // Simple Markdown parser
  function parseMarkdown(md) {
    let html = md
      // Code blocks (triple backtick)
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="lang-${lang}">${escapeHtml(code.trim())}</code></pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headings
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // HR
      .replace(/^---$/gm, '<hr>')
      // Bold & Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Unordered list
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Merge consecutive blockquotes
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    // Tables
    html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, header, sep, body) => {
      const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Paragraphs (lines that aren't already wrapped)
    html = html.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (/^<[a-z]/.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    }).join('\n');

    return html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updatePreview() {
    preview.innerHTML = parseMarkdown(editor.value);
  }

  function updateWordCount() {
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
  }

  function autoSave() {
    localStorage.setItem('inkdown_content', editor.value);
  }

  // Toolbar actions
  function insertAt(before, after = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);
    const replacement = before + (selected || 'text') + after;
    editor.setRangeText(replacement, start, end, 'select');
    editor.focus();
    updatePreview(); updateWordCount(); autoSave();
  }

  document.querySelectorAll('.tb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'bold': insertAt('**', '**'); break;
        case 'italic': insertAt('*', '*'); break;
        case 'heading': insertAt('## '); break;
        case 'link': insertAt('[', '](https://)'); break;
        case 'code': insertAt('`', '`'); break;
        case 'list': insertAt('- '); break;
        case 'quote': insertAt('> '); break;
        case 'download':
          const blob = new Blob([editor.value], { type: 'text/markdown' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'document.md';
          a.click();
          break;
        case 'clear':
          if (confirm('Clear all content?')) {
            editor.value = '';
            updatePreview(); updateWordCount(); autoSave();
          }
          break;
      }
    });
  });

  // Keyboard shortcuts
  editor.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertAt('**', '**'); }
      if (e.key === 'i') { e.preventDefault(); insertAt('*', '*'); }
    }
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      editor.setRangeText('  ', start, start, 'end');
      updatePreview(); autoSave();
    }
  });

  // Live update
  editor.addEventListener('input', () => { updatePreview(); updateWordCount(); autoSave(); });

  // Draggable divider
  const divider = $('#divider-handle');
  let isDragging = false;
  divider.addEventListener('mousedown', () => { isDragging = true; divider.classList.add('dragging'); });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const container = $('.editor-main');
    const rect = container.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(20, Math.min(80, pct));
    container.style.gridTemplateColumns = `${clamped}% 4px ${100 - clamped}%`;
  });
  document.addEventListener('mouseup', () => { isDragging = false; divider.classList.remove('dragging'); });

  // Set grid layout
  $('.editor-main').style.display = 'grid';
  $('.editor-main').style.gridTemplateColumns = '50% 4px 50%';

  // Init
  const saved = localStorage.getItem('inkdown_content');
  editor.value = saved !== null ? saved : DEFAULT_MD;
  updatePreview();
  updateWordCount();
})();
