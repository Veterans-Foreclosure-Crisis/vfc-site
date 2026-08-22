// Copy button for the "what to say back" field. No framework, no dependency,
// no inline handler. Progressive: if the clipboard API is unavailable the
// button simply does nothing and the text is still selectable.
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-copy]');
  if (!btn) return;
  var box = btn.closest('.vfc-callout');
  var src = box && box.querySelector('[data-copy-text]');
  if (!src || !navigator.clipboard) return;
  navigator.clipboard.writeText(src.textContent.trim()).then(function () {
    var was = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(function () { btn.textContent = was; }, 1600);
  });
});
