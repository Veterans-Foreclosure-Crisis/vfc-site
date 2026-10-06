/* VFC filter, sort and search. No dependencies, no CDN, no build step.
   Replaces the Claude Design runtime on watch.html and evidence.html,
   2026-08-07. Progressive enhancement: markup ships with every entry
   visible and the controls hidden; this file turns the controls on. */
(function () {
  'use strict';
  function txt(el, a) { return (el.getAttribute(a) || ''); }

  Array.prototype.forEach.call(document.querySelectorAll('[data-vfc-scope]'), function (scope) {
    var list = scope.querySelector('[data-vfc-list]');
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll('[data-vfc-item]'));
    var count = scope.querySelector('[data-vfc-count]');
    var empty = scope.querySelector('[data-vfc-empty]');
    var noun  = txt(scope, 'data-vfc-noun') || 'entry';
    var nouns = txt(scope, 'data-vfc-nouns') || (noun + 's');
    var state = { filter: 'all', sort: 'default', q: '' };
    var home  = {};
    items.forEach(function (el, i) { home[txt(el, 'data-key')] = i; });

    function apply() {
      var shown = 0;
      items.forEach(function (el) {
        var okF = state.filter === 'all' || txt(el, 'data-status') === state.filter;
        var okQ = !state.q || txt(el, 'data-search').indexOf(state.q) >= 0;
        el.hidden = !(okF && okQ);
        if (okF && okQ) shown++;
      });
      if (count) {
        count.textContent = shown === items.length
          ? ('All ' + items.length + ' ' + nouns + ' shown')
          : (shown + ' of ' + items.length + ' ' + nouns + ' shown');
      }
      if (empty) empty.hidden = shown !== 0;
      /* 2026-09-13: a group (a month on /latest/) with nothing visible hides with its items. */
      Array.prototype.forEach.call(scope.querySelectorAll('[data-vfc-group]'), function (g) {
        g.hidden = !g.querySelector('[data-vfc-item]:not([hidden])');
      });
      /* 2026-09-13: reordering flattens nested lists, so only scopes that offer a sort reorder. */
      if (!scope.querySelector('[data-vfc-sort]')) return;

      var seq = items.slice();
      if (state.sort === 'name')        seq.sort(function (a, b) { return txt(a, 'data-name').localeCompare(txt(b, 'data-name')); });
      else if (state.sort === 'date')   seq.sort(function (a, b) { return (+txt(b, 'data-date') || 0) - (+txt(a, 'data-date') || 0); });
      else if (state.sort === 'status') seq.sort(function (a, b) { return (+txt(a, 'data-rank')) - (+txt(b, 'data-rank')); });
      else                              seq.sort(function (a, b) { return home[txt(a, 'data-key')] - home[txt(b, 'data-key')]; });
      seq.forEach(function (el) { list.appendChild(el); });
    }

    function group(attr, key) {
      var btns = Array.prototype.slice.call(scope.querySelectorAll('[' + attr + ']'));
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          state[key] = txt(btn, attr);
          btns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
          apply();
        });
      });
    }
    group('data-vfc-filter', 'filter');
    group('data-vfc-sort', 'sort');

    var box = scope.querySelector('[data-vfc-search]');
    if (box) box.addEventListener('input', function () { state.q = box.value.trim().toLowerCase(); apply(); });

    Array.prototype.forEach.call(scope.querySelectorAll('[data-vfc-controls]'), function (c) { c.hidden = false; });
    apply();
  });

  /* STEP 6C, 2026-09-30. Scroll discoverability for wide tables (VISUAL-1 V1-04).
     The region pattern already worked: measured across 15 routes and 6 widths
     there is zero page-level horizontal overflow, every region carries an
     accessible name, and every one is keyboard focusable with working arrow-key
     scrolling. The gap was that nothing told a reader the region scrolls, while
     /sources/methods/ keeps 11,752px out of view at 375px.

     This adds words, not layout. It writes no markup into the page source, so
     no route template, generated page or generator parity is affected, and it
     changes no cell, header, caption, id, order or value. A hint appears only
     for a region that is genuinely overflowing right now, and disappears when
     it stops - so a table that fits is never labelled scrollable. */
  var hintId = 0;
  var regions = Array.prototype.slice.call(document.querySelectorAll('.vfc-tablewrap'));

  regions.forEach(function (region) {
    var hint = document.createElement('p');
    hint.className = 'vfc-tablewrap__hint';
    hintId += 1;
    hint.id = 'vfc-tablewrap-hint-' + hintId;
    hint.setAttribute('data-vfc-scrollhint', 'off');
    /* The direction glyph is decorative; the sentence already carries the
       meaning for a screen reader. */
    hint.innerHTML = 'More columns are off screen. Scroll sideways to view them. ' +
      'Keyboard: Tab to the table, then use Left/Right Arrow.' +
      '<span class="vfc-tablewrap__arrow" aria-hidden="true">&#8596;</span>';
    /* OWNER REVIEW CORRECTION, 2026-09-30. The hint was previously inserted
       after the region. On a long table at 375px the reader met the
       instruction only after scrolling past the whole table, which defeats
       V1-04: the point is to be told before the columns are missed. It now
       precedes the region, so it is the first thing encountered. */
    if (region.parentNode) region.parentNode.insertBefore(hint, region);

    function sync() {
      /* The Rule Changed comparison becomes stacked labelled records at
         <=620px. At that width the region is intentionally non-scrollable, so
         do not announce a sideways-scroll affordance even if an intermediate
         layout measurement briefly reports overflow while fonts/reflow settle. */
      var stackedRuleMatrix =
        Boolean(region.closest && region.closest('.vfc-webvis-matrix')) &&
        window.matchMedia('(max-width: 620px)').matches;
      var overflowing =
        !stackedRuleMatrix && region.scrollWidth > region.clientWidth + 1;
      hint.setAttribute('data-vfc-scrollhint', overflowing ? 'on' : 'off');
      /* Describe the region by the hint only while the hint is true, so a
         keyboard reader landing on a region that fits hears only its name. */
      if (overflowing) {
        region.setAttribute('aria-describedby', hint.id);
      } else {
        region.removeAttribute('aria-describedby');
      }
    }

    sync();

    if (typeof ResizeObserver === 'function') {
      /* Zoom, rotation and reflow all change the answer, so recompute rather
         than deciding once at load. */
      var ro = new ResizeObserver(sync);
      ro.observe(region);
      var table = region.querySelector('table');
      if (table) ro.observe(table);
    } else {
      window.addEventListener('resize', sync);
    }

    /* A region inside a closed <details> has no layout until it is opened;
       recompute when the disclosure toggles. Verified on /record/policy/fiscal/. */
    var details = region.closest ? region.closest('details') : null;
    if (details) details.addEventListener('toggle', sync);
  });
})();
