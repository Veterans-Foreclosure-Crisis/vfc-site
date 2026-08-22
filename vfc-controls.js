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
})();
