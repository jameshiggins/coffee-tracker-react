import { expect } from '@playwright/test';

/**
 * Geometry assertions — the checks jsdom cannot make.
 *
 * findTextOverlaps() walks every rendered text node under `root`, takes its
 * per-line boxes (Range.getClientRects, so a wrapped paragraph is several
 * boxes rather than one big rectangle), clips each box by every overflow-
 * hidden / clip-path ancestor (so a truncated label counts only where it is
 * actually painted), and reports any two boxes from different elements that
 * intersect by more than a couple of pixels in both axes. Text inside
 * position:fixed/sticky ancestors is skipped — a bottom tab bar is supposed to
 * float over content that scrolls beneath it.
 */
export async function findTextOverlaps(page, root = 'body') {
  return page.evaluate((rootSel) => {
    const rootEl = document.querySelector(rootSel);
    if (!rootEl) return [{ error: `no element matches ${rootSel}` }];

    const SKIP_TAGS = new Set([
      'SCRIPT',
      'STYLE',
      'NOSCRIPT',
      'TEMPLATE',
      'SELECT',
      'OPTION',
      'TEXTAREA',
      'SVG',
      'TITLE',
    ]);
    const intersect = (a, b) => {
      const left = Math.max(a.left, b.left);
      const top = Math.max(a.top, b.top);
      const right = Math.min(a.right, b.right);
      const bottom = Math.min(a.bottom, b.bottom);
      return right > left && bottom > top
        ? { left, top, right, bottom, width: right - left, height: bottom - top }
        : null;
    };

    const boxes = [];
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    let node;
    outer: while ((node = walker.nextNode())) {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const el = node.parentElement;
      if (!el) continue;

      let clip = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
      for (let a = el; a; a = a.parentElement) {
        if (SKIP_TAGS.has(a.tagName.toUpperCase())) continue outer;
        const cs = getComputedStyle(a);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')
          continue outer;
        if (cs.position === 'fixed' || cs.position === 'sticky') continue outer;
        const clips =
          cs.overflowX !== 'visible' ||
          cs.overflowY !== 'visible' ||
          cs.clipPath !== 'none' ||
          (cs.clip && cs.clip !== 'auto');
        if (clips && a !== document.documentElement && a !== document.body) {
          const b = a.getBoundingClientRect();
          clip = {
            left: Math.max(clip.left, b.left),
            top: Math.max(clip.top, b.top),
            right: Math.min(clip.right, b.right),
            bottom: Math.min(clip.bottom, b.bottom),
          };
        }
      }

      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        const c = intersect(r, clip);
        if (!c || c.width < 2 || c.height < 2) continue;
        boxes.push({ text: text.slice(0, 60), el, rect: c });
      }
    }

    // One report per element pair (a wrapped label can collide on several lines).
    const overlaps = [];
    const seen = new Set();
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el === b.el) continue;
        const o = intersect(a.rect, b.rect);
        if (!o || o.width <= 2 || o.height <= 2) continue;
        const first = a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING;
        const [x, y] = first ? [a, b] : [b, a];
        const id = `${x.text}\u0000${y.text}`;
        if (seen.has(id)) continue;
        seen.add(id);
        overlaps.push({
          a: x.text,
          b: y.text,
          px: { x: Math.round(o.width), y: Math.round(o.height) },
        });
      }
    }
    return overlaps;
  }, root);
}

export async function expectNoTextOverlap(page, root = 'body') {
  expect(await findTextOverlaps(page, root), `text overlaps under ${root}`).toEqual([]);
}

/** The page must not scroll sideways: the classic "one wide row breaks the phone layout" bug. */
export async function expectNoHorizontalOverflow(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'document scrollWidth vs viewport').toBeLessThanOrEqual(clientWidth);
}
