/* VFC Wave 2 mobile visible shell — issue #49.
 *
 * Progressive enhancement only:
 * - without JS, family navigation remains where BaseLayout renders it;
 * - <=768px, move the same nav element after the page's H1 orientation section;
 * - >768px, restore the original server-rendered order before <main>.
 *
 * Moving the existing node preserves aria-current, links, focusability and
 * document order. Nothing is cloned and no destination is hidden.
 */
(() => {
  'use strict';

  const nav = document.querySelector('[data-vfc-family-nav]');
  const main = document.querySelector('main#main');
  if (!nav || !main || !nav.parentNode) return;

  const origin = document.createComment('vfc-family-nav-origin');
  nav.parentNode.insertBefore(origin, nav);

  const mobile = window.matchMedia('(max-width: 768px)');
  let intro = null;

  const findIntro = () => {
    const h1 = main.querySelector('h1');
    if (!h1) return null;

    const section = h1.closest('.vfc-section');
    if (section && main.contains(section)) {
      /* On pages such as Current Status and First 72 Hours, the H1 and urgent
         orientation/help live in a split grid while sequence/jump navigation
         follows later in the same section. Put the family index after the
         orientation/help grid, not after the entire section. */
      const split = h1.closest('.vfc-p-grid.vfc-c-split');
      if (split && section.contains(split)) return split;
      return section;
    }

    /* Legacy/raw-fragment fallback: stop at the direct child of .vfc-v2 that
       contains the H1. This keeps the family index after the page's authored
       orientation block instead of after an arbitrary pixel distance. */
    const v2 = h1.closest('.vfc-v2');
    if (v2 && main.contains(v2)) {
      let node = h1;
      while (node.parentElement && node.parentElement !== v2) {
        node = node.parentElement;
      }
      if (node.parentElement === v2) return node;
    }

    return h1.parentElement;
  };

  const restore = () => {
    if (intro) intro.classList.remove('vfc-mobile-shell__intro');
    intro = null;
    nav.classList.remove('vfc-subnav--inline');
    if (origin.parentNode) origin.parentNode.insertBefore(nav, origin.nextSibling);
  };

  const place = () => {
    if (!mobile.matches) {
      restore();
      return;
    }

    const target = findIntro();
    if (!target || !target.parentNode) {
      restore();
      return;
    }

    if (intro && intro !== target) intro.classList.remove('vfc-mobile-shell__intro');
    intro = target;
    intro.classList.add('vfc-mobile-shell__intro');
    nav.classList.add('vfc-subnav--inline');
    target.insertAdjacentElement('afterend', nav);
  };

  place();

  if (typeof mobile.addEventListener === 'function') {
    mobile.addEventListener('change', place);
  } else if (typeof mobile.addListener === 'function') {
    mobile.addListener(place);
  }
})();
