/* Case Files theme - minimal behaviors, no dependencies */
(function () {
  'use strict';

  // Keyboard navigation between cases (post pages with edge tabs)
  var prev = document.querySelector('[data-nav="prev"]');
  var next = document.querySelector('[data-nav="next"]');
  if (prev || next) {
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft' && prev) window.location.href = prev.href;
      if (e.key === 'ArrowRight' && next) window.location.href = next.href;
    });
  }

  // Copy-link button
  var copyBtn = document.querySelector('[data-copy-link]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = window.location.href;
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = 'copied ✓';
        setTimeout(function () { copyBtn.textContent = old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      }
    });
  }

  // Back to top: folder tab rises from the bottom edge after a screen of scrolling
  var toTop = document.querySelector('[data-totop]');
  if (toTop) {
    var toggleToTop = function () {
      toTop.classList.toggle('show', window.scrollY > window.innerHeight * 1.25);
    };
    window.addEventListener('scroll', toggleToTop, { passive: true });
    toggleToTop();
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Wrap wide tables so they scroll instead of breaking the paper
  document.querySelectorAll('.entry table').forEach(function (table) {
    if (table.parentElement.classList.contains('table-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();
