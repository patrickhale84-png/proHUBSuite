/* Phone frame: one film-strip border that follows the visible screen.
   Config comes from window.PF_CONFIG, set per hub by build/inject_frame.py:
     grid     tile grid selector          drawer   where header tools go on phones
     main     main region selector        hide     dashboard blocks hidden on phones
     proxies  extra tiles for actions that live in hidden blocks */
(function(){
  if (window.__pfFrame) return; window.__pfFrame = true;
  var C = window.PF_CONFIG || {};
  var root = document.documentElement;
  var MQ = window.matchMedia('(max-width:768px), (max-height:500px) and (pointer:coarse)');
  var on = false, moved = [], wrap = null, mainEl = null, raf = 0, styled = [];

  function $(s, r){ try { return (r || document).querySelector(s); } catch (e) { return null; } }
  function $$(s, r){ try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); } catch (e) { return []; } }
  function addCls(el, c){ if (el && !el.classList.contains(c)) el.classList.add(c); }
  function remCls(el, c){ if (el && el.classList.contains(c)) el.classList.remove(c); }
  function header(){ return $('.hdr-bar'); }

  /* the frame follows the visual viewport, so it contracts above the keyboard */
  function setViewport(){
    var v = window.visualViewport;
    root.style.setProperty('--pf-vh', (v ? v.height : window.innerHeight) + 'px');
    root.style.setProperty('--pf-vt', (v ? v.offsetTop : 0) + 'px');
  }

  /* words become tooltips: title for pointers, aria-label for screen readers */
  function labelOf(t){
    var e = t.querySelector('.mtit, .tl');
    return (t.getAttribute('data-pf-label') || (e && e.textContent) || t.getAttribute('aria-label') || '').trim();
  }
  function labelAll(){
    if (C.grid) $$(C.grid + ' > *').forEach(function(t){
      var s = labelOf(t);
      if (s && t.getAttribute('aria-label') !== s){ t.setAttribute('aria-label', s); t.setAttribute('title', s); }
    });
    $$('.hubnav .hn').forEach(function(a){
      var s = a.textContent.trim();
      if (s && a.getAttribute('aria-label') !== s) a.setAttribute('aria-label', s);
    });
    var bg = $('.hdr-burger');
    if (bg && !bg.getAttribute('aria-label')) bg.setAttribute('aria-label', 'Menu');
  }

  /* actions that lived in hidden dashboard blocks come back as tiles */
  function addProxies(){
    var g = C.grid && $(C.grid);
    if (!g || !C.proxies) return;
    C.proxies.forEach(function(p, i){
      if (g.querySelector('[data-pf-proxy="' + i + '"]')) return;
      var t = document.createElement('div');
      t.className = (C.tileClass || 'mtile') + ' pf-proxy';
      t.setAttribute('data-pf-proxy', String(i));
      t.setAttribute('data-pf-label', p.label);
      t.setAttribute('role', 'button');
      t.tabIndex = 0;
      if (p.color) t.style.background = p.color;
      t.innerHTML = '<div class="micon"><i class="' + p.icon + '"></i></div><div><div class="mtit"></div></div>';
      t.querySelector('.mtit').textContent = p.label;
      var go = function(){
        if (p.click){ var b = $(p.click); if (b) b.click(); }
        if (p.fn && typeof window[p.fn] === 'function') window[p.fn]();
      };
      t.addEventListener('click', go);
      t.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
      g.appendChild(t);
    });
  }

  /* header tools move into the drawer on phones and come back on desktop */
  function keep(el){
    return el.classList.contains('hdr-burger') || el.classList.contains('hdr-slot') || el.classList.contains('hdr-col') ||
           el.classList.contains('mob-menu-btn') || el.classList.contains('hubnav') ||
           el.classList.contains('hdr-logo') || !!el.querySelector('.hdr-logo');
  }
  function moveTools(){
    var h = header(), d = C.drawer && $(C.drawer);
    if (!h || !d || moved.length) return;
    var box = d.querySelector(':scope > .pf-tools');
    if (!box){
      box = document.createElement('div'); box.className = 'pf-tools';
      box.innerHTML = '<div class="pf-tools-h">Tools</div>';
      d.appendChild(box);
    }
    var units = [];
    Array.prototype.slice.call(h.children).forEach(function(c){
      if (keep(c)) return;
      if (c.querySelector('.hubnav')){
        Array.prototype.slice.call(c.children).forEach(function(cc){
          if (!keep(cc) && !cc.querySelector('.hubnav')) units.push(cc);
        });
      } else units.push(c);
    });
    units.forEach(function(u){
      var mark = document.createComment('pf-tool');
      u.parentNode.insertBefore(mark, u);
      box.appendChild(u);
      moved.push([u, mark]);
    });
    box.hidden = !units.length;
  }
  function restoreTools(){
    moved.forEach(function(p){
      if (p[1].parentNode){ p[1].parentNode.insertBefore(p[0], p[1]); p[1].parentNode.removeChild(p[1]); }
    });
    moved = [];
    $$('.pf-tools').forEach(function(b){ b.hidden = true; });
  }

  /* the region under the header scrolls inside the frame, never the page */
  function findMain(){
    if (C.main){ var m = $(C.main); if (m) return m; }
    var h = header();
    if (!h) return null;
    if (wrap) return wrap;
    var sib = [], n = h.nextElementSibling;
    while (n){
      var nx = n.nextElementSibling;
      if (!/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|LINK|DIALOG)$/.test(n.tagName) && getComputedStyle(n).position !== 'fixed' && n.id !== 'pf-tip') sib.push(n);
      n = nx;
    }
    if (!sib.length) return null;
    wrap = document.createElement('div'); wrap.className = 'pf-wrap';
    h.parentNode.insertBefore(wrap, sib[0]);
    sib.forEach(function(s){ wrap.appendChild(s); });
    return wrap;
  }

  /* fit every tile on one screen: pick the column count that keeps tiles
     closest to square, give the first tile a 2x2 hero slot, and stretch the
     last tile across any gap so the bottom row is always full */
  function clearGrid(){
    styled.forEach(function(t){
      ['order', 'grid-column', 'grid-row'].forEach(function(k){ t.style.removeProperty(k); });
      remCls(t, 'pf-hero');
    });
    styled = [];
    $$('.pf-grid').forEach(function(g){
      ['--pf-cols', '--pf-rows', '--pf-gh'].forEach(function(k){ g.style.removeProperty(k); });
      remCls(g, 'pf-grid');
    });
  }
  function fitGrid(){
    var g = C.grid && $(C.grid);
    if (!g || !g.getClientRects().length) return;
    addCls(g, 'pf-grid');
    var tiles = Array.prototype.slice.call(g.children).filter(function(t){
      return !t.hidden && getComputedStyle(t).display !== 'none';
    });
    var n = tiles.length;
    if (!n) return;
    var hero = tiles.filter(function(t){ return t.classList.contains('hero'); })[0] || tiles[0];
    var others = tiles.filter(function(t){ return t !== hero; });
    var body = document.body.getBoundingClientRect(), gr = g.getBoundingClientRect();
    var H = Math.max(140, Math.floor(body.bottom - gr.top - (C.bottomPad || 8)));
    var W = g.clientWidth, gap = 6, cells = 4 + others.length, best = null;
    [2, 3, 4].forEach(function(cols){
      var rows = Math.ceil(cells / cols);
      var w = (W - gap * (cols - 1)) / cols, h = (H - gap * (rows - 1)) / rows;
      var score = Math.abs(Math.log(w / h)) + (rows < 2 ? 5 : 0);
      if (!best || score < best.score) best = { cols: cols, rows: rows, score: score };
    });
    var spare = best.rows * best.cols - cells;
    styled = tiles.slice();
    hero.style.setProperty('order', '-1', 'important');
    hero.style.setProperty('grid-column', 'span 2', 'important');
    hero.style.setProperty('grid-row', 'span 2', 'important');
    addCls(hero, 'pf-hero');
    others.forEach(function(t, i){
      remCls(t, 'pf-hero');
      t.style.setProperty('order', String(i), 'important');
      var span = (i === others.length - 1 && spare > 0) ? 1 + spare : 1;
      t.style.setProperty('grid-column', 'span ' + span, 'important');
      t.style.setProperty('grid-row', 'span 1', 'important');
    });
    g.style.setProperty('--pf-cols', String(best.cols));
    g.style.setProperty('--pf-rows', String(best.rows));
    g.style.setProperty('--pf-gh', H + 'px');
    /* anything the wrappers add below the grid comes off the grid, so the
       dashboard never scrolls */
    var m = g.closest('.pf-main');
    var extra = m ? m.scrollHeight - m.clientHeight : 0;
    if (extra > 0) g.style.setProperty('--pf-gh', Math.max(140, H - extra) + 'px');
  }

  /* a tile's colour: its background colour, or the first colour of its gradient */
  function tileColour(t){
    if (!t) return '';
    var cs = getComputedStyle(t), bg = cs.backgroundColor;
    if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
    var m = (cs.backgroundImage || '').match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/i);
    return m ? m[0] : '';
  }
  var lastTile = '';
  /* the border of the open screen takes the colour of the tile that opens it */
  function setEdge(){
    if (!document.body.classList.contains('m-inside')) return;
    var v = $('.vs.ac'), id = v && v.id ? v.id.replace(/^v-/, '') : '';
    var t = (id && C.grid) ? $(C.grid + ' > [onclick*="sw(\'' + id + '\')"]') : null;
    var c = t ? tileColour(t) : '';
    if (!c) return;   /* opened from somewhere else: keep the colour of the last tile */
    if (c && root.style.getPropertyValue('--pf-edge') !== c) root.style.setProperty('--pf-edge', c);
  }
  function zoom(t){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var b = document.body.getBoundingClientRect(), r = t.getBoundingClientRect();
    var z = document.createElement('div');
    z.className = 'pf-zoom';
    z.style.background = getComputedStyle(t).background || lastTile;
    z.style.left = (r.left - b.left) + 'px'; z.style.top = (r.top - b.top) + 'px';
    z.style.width = r.width + 'px'; z.style.height = r.height + 'px';
    document.body.appendChild(z);
    z.getBoundingClientRect();
    z.style.left = '0px'; z.style.top = '0px'; z.style.width = b.width + 'px'; z.style.height = b.height + 'px';
    z.classList.add('go');
    setTimeout(function(){ if (z.parentNode) z.parentNode.removeChild(z); }, 520);
  }
  document.addEventListener('click', function(e){
    if (!on || !e.target.closest) return;
    var t = e.target.closest('.pf-grid > *');
    if (!t) return;
    lastTile = tileColour(t) || lastTile;
    if (lastTile) root.style.setProperty('--pf-edge', lastTile);
    zoom(t);
  });

  /* side-by-side panels in a module become stacked boxes on phones */
  var stackKey = '', stacked = [], unclipped = [], stackTimer = 0;
  var NO_STACK = '.pf-grid, #mainGrid, table, canvas, svg, .hdr-bar, #m-bar, #m-composer, #m-sheet, .hdr-drawer, .psb, #pf-tip';
  function clearStack(){
    stacked.forEach(function(e){ remCls(e, 'pf-stack'); });
    unclipped.forEach(function(e){ remCls(e, 'pf-unclip'); });
    stacked = []; unclipped = []; stackKey = '';
  }
  function visibleKids(e){
    return Array.prototype.filter.call(e.children, function(c){
      var s = getComputedStyle(c);
      return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed' && c.getBoundingClientRect().height > 0;
    });
  }
  function stackPanels(force){
    if (!on || !document.body.classList.contains('m-inside')) return;
    var view = $('.vs.ac') || mainEl;
    if (!view) return;
    var key = (view.id || 'main') + '|' + document.body.clientWidth;
    if (!force && key === stackKey) return;
    var fresh = key !== stackKey;
    stackKey = key;
    var W = view.getBoundingClientRect().width;
    $$('*', view).forEach(function(e){
      if (e.classList.contains('pf-stack') || (e.closest && e.closest(NO_STACK))) return;
      var kids = visibleKids(e);
      if (kids.length < 2 || kids.length > 4) return;
      var er = e.getBoundingClientRect();
      if (er.width < W * 0.6) return;
      var rs = kids.map(function(k){ return k.getBoundingClientRect(); });
      var side = rs.some(function(r, i){ return i > 0 && Math.abs(r.left - rs[0].left) > 40 && r.top < rs[0].bottom - 20; });
      if (!side) return;
      if (!rs.every(function(r){ return r.height > 120; })) return;
      if (Math.min.apply(null, rs.map(function(r){ return r.width; })) > er.width * 0.5) return;
      addCls(e, 'pf-stack'); stacked.push(e);
      for (var a = e; a && a !== view; a = a.parentElement){
        if (/(hidden|clip)/.test(getComputedStyle(a).overflowY)){ addCls(a, 'pf-unclip'); unclipped.push(a); }
      }
    });
    /* modules often fill in after they open: look once more */
    if (fresh){ clearTimeout(stackTimer); stackTimer = setTimeout(function(){ stackPanels(true); }, 450); }
  }

  function fit(){
    raf = 0;
    if (!on) return;
    setEdge();
    stackPanels(false);
    setViewport();
    var h = header();
    var head = (h && getComputedStyle(h).display !== 'none') ? h.offsetHeight : 0, foot = 0;
    /* inside a module the screen sits between its top bar and the composer */
    if (C.insetInside && document.body.classList.contains('m-inside')){
      var mb = $('#m-bar'), mc = $('#m-composer');
      if (mb && getComputedStyle(mb).display !== 'none') head = mb.offsetHeight;
      if (mc && getComputedStyle(mc).display !== 'none') foot = mc.offsetHeight;
    }
    root.style.setProperty('--pf-head', (head || 0) + 'px');
    root.style.setProperty('--pf-foot', foot + 'px');
    labelAll();
    addProxies();
    fitGrid();
  }
  function schedule(){ if (!raf) raf = requestAnimationFrame(fit); }

  function enable(){
    if (on) return;
    on = true;
    addCls(root, 'pf-on');
    (C.hide || []).forEach(function(s){ $$(s).forEach(function(e){ addCls(e, 'pf-hide'); }); });
    mainEl = findMain();
    addCls(mainEl, 'pf-main');
    moveTools();
    fit();
  }
  function disable(){
    if (!on) return;
    on = false;
    remCls(root, 'pf-on');
    remCls(mainEl, 'pf-main');
    restoreTools();
    clearGrid();
    clearStack();
    hideTip();
  }
  function sync(){ if (MQ.matches) enable(); else disable(); }

  /* long-press shows the tile's name; a plain tap still opens it */
  var tip = null, timer = 0, shown = false, suppress = false;
  var TARGET = '.pf-grid > *, .hdr-bar .hubnav .hn, .hdr-bar .hdr-burger';
  function tipEl(){
    if (!tip){ tip = document.createElement('div'); tip.id = 'pf-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    return tip;
  }
  function showTip(el){
    var s = el.getAttribute('aria-label') || el.getAttribute('title');
    if (!s) return;
    var t = tipEl(), b = document.body.getBoundingClientRect(), r = el.getBoundingClientRect();
    var x = Math.min(Math.max(r.left + r.width / 2 - b.left, 70), b.width - 70);
    var below = (r.top - b.top) < 48;
    t.textContent = s;
    t.style.left = x + 'px';
    t.style.top = (below ? (r.bottom - b.top + 8) : (r.top - b.top - 8)) + 'px';
    if (below) addCls(t, 'below'); else remCls(t, 'below');
    addCls(t, 'on'); shown = true;
  }
  function hideTip(){ if (tip) remCls(tip, 'on'); shown = false; }
  document.addEventListener('pointerdown', function(e){
    if (!on || !e.target.closest) return;
    var el = e.target.closest(TARGET);
    clearTimeout(timer);
    if (!el) return;
    suppress = false;
    timer = setTimeout(function(){ showTip(el); suppress = true; }, 380);
  }, true);
  document.addEventListener('pointerup', function(){ clearTimeout(timer); if (shown) setTimeout(hideTip, 900); }, true);
  document.addEventListener('pointercancel', function(){ clearTimeout(timer); hideTip(); }, true);
  document.addEventListener('click', function(e){
    if (suppress){ suppress = false; e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('contextmenu', function(e){
    if (on && e.target.closest && e.target.closest(TARGET)) e.preventDefault();
  }, true);

  /* the logo always goes home to this hub's dashboard, in place: no reload,
     so nothing in memory is lost, and the tiles come back at the same sizes */
  function closeMenus(){
    ['hdrToggle', 'togSB', 'proToggleSB'].forEach(function(f){ if (typeof window[f] === 'function') try { window[f](false); } catch (e) {} });
  }
  function goHome(){
    closeMenus();
    if (C.homeClick){ var b = $(C.homeClick); if (b) b.click(); }
    else if (C.home === 'sw' && typeof window.sw === 'function') window.sw('dashboard');
    var m = mainEl || $('.pf-main');
    if (m) m.scrollTop = 0;
    if (C.home === 'top') window.scrollTo(0, 0);
    schedule();
  }
  function wireLogos(){
    /* the module title bar shows the same logo, and it goes home too */
    $$('#m-bar .mb-title').forEach(function(t){
      if (t.classList.contains('hdr-logo')) return;
      var m = t.textContent.trim().match(/^(pre|pro|post|film)HUB$/i);
      if (m){ t.textContent = ''; var s = document.createElement('span'); s.className = 'pre'; s.textContent = m[1].toLowerCase(); t.appendChild(s); t.appendChild(document.createTextNode('HUB')); }
      t.classList.add('hdr-logo');
    });
    $$('.hdr-logo').forEach(function(l){
      if (l.getAttribute('data-pf-home')) return;
      l.setAttribute('data-pf-home', '1');
      if (!l.getAttribute('title')) l.setAttribute('title', 'Dashboard');
      l.setAttribute('role', 'button'); l.tabIndex = 0;
      l.style.cursor = 'pointer';
      /* postHUB's logo is its own launchpad button and already opens the dashboard */
      if (C.homeClick && l.matches(C.homeClick)) return;
      l.addEventListener('click', function(e){ e.preventDefault(); goHome(); });
      l.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); goHome(); } });
    });
  }

  function init(){
    wireLogos();
    if (MQ.addEventListener) MQ.addEventListener('change', sync); else if (MQ.addListener) MQ.addListener(sync);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    if (window.visualViewport){
      window.visualViewport.addEventListener('resize', schedule);
      window.visualViewport.addEventListener('scroll', schedule);
    }
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    sync();
    setTimeout(schedule, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
