/* A very small PDF writer. No library, no network - it emits a real PDF 1.4 file with one full
   page per slide, Times/Helvetica text and images embedded as JPEG (DCTDecode).
   Limits, stated: text wraps by estimated glyph width rather than font metrics; PNGs are
   re-encoded through a canvas; no alpha, gradients or vectors. */
var PdfDeck = (function () {
  var W = 842, H = 595;
  function esc(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '?');
  }
  function rgb(hex) {
    var h = String(hex || '#080C14').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function wrap(text, size, maxWidth, perChar) {
    var chars = Math.max(12, Math.floor(maxWidth / (size * (perChar || 0.5))));
    var words = String(text || '').split(/\s+/), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (t.length > chars && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function jpeg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var cv = document.createElement('canvas');
          cv.width = img.naturalWidth || 1200; cv.height = img.naturalHeight || 800;
          var ctx = cv.getContext('2d');
          ctx.fillStyle = '#080C14'; ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0);
          res({ dataUrl: cv.toDataURL('image/jpeg', 0.86), w: cv.width, h: cv.height });
        } catch (e) { res(null); }
      };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }
  function bytes(dataUrl) {
    var b64 = dataUrl.split(',')[1] || '';
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function build(pages) {
    var objs = [], offsets = [], body = '%PDF-1.4\n';
    function add(o) { objs.push(o); return objs.length; }
    var fT = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
    var fB = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
    var fH = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    var pageIds = [];
    pages.forEach(function (p) {
      var res = '/Font << /F1 ' + fT + ' 0 R /F2 ' + fB + ' 0 R /F3 ' + fH + ' 0 R >>';
      var imgId = null;
      if (p.image) {
        var b = bytes(p.image.dataUrl);
        imgId = add({ stream: b, dict: '<< /Type /XObject /Subtype /Image /Width ' + p.image.w +
          ' /Height ' + p.image.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + b.length + ' >>' });
        res += ' /XObject << /Im0 ' + imgId + ' 0 R >>';
      }
      var c = [], bg = rgb(p.bg), accent = rgb(p.accent);
      c.push('q ' + bg[0].toFixed(3) + ' ' + bg[1].toFixed(3) + ' ' + bg[2].toFixed(3) + ' rg 0 0 ' + W + ' ' + H + ' re f Q');
      if (imgId) {
        var s = Math.max(W / p.image.w, H / p.image.h);
        var iw = p.image.w * s, ih = p.image.h * s;
        c.push('q ' + iw.toFixed(1) + ' 0 0 ' + ih.toFixed(1) + ' ' + ((W - iw) / 2).toFixed(1) + ' ' +
               ((H - ih) / 2).toFixed(1) + ' cm /Im0 Do Q');
        c.push('q 0.031 0.047 0.078 rg 0 0 ' + W + ' ' + Math.round(H * 0.36) + ' re f Q');
      }
      var col = imgId ? [0.97, 0.96, 0.94] : [0.95, 0.94, 0.92];
      var lines = wrap(p.text, 30, W - 120, 0.48);
      var y = imgId ? Math.round(H * 0.26) : Math.round(H / 2 + lines.length * 16);
      c.push('BT /F1 30 Tf ' + col[0] + ' ' + col[1] + ' ' + col[2] + ' rg 60 ' + y + ' Td 38 TL');
      lines.forEach(function (ln, i) { c.push((i ? 'T* ' : '') + '(' + esc(ln) + ') Tj'); });
      c.push('ET');
      c.push('BT /F3 10 Tf ' + accent[0].toFixed(3) + ' ' + accent[1].toFixed(3) + ' ' + accent[2].toFixed(3) +
             ' rg 60 ' + Math.max(40, y - 48) + ' Td (' + esc(String(p.meta || '').toUpperCase()) + ') Tj ET');
      var stream = c.join('\n');
      var cid = add({ stream: stream, dict: '<< /Length ' + stream.length + ' >>' });
      pageIds.push(add('<< /Type /Page /Parent PAGES 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << ' +
        res + ' >> /Contents ' + cid + ' 0 R >>'));
    });
    var pagesId = objs.length + 1;
    add('<< /Type /Pages /Count ' + pageIds.length + ' /Kids [' +
        pageIds.map(function (i) { return i + ' 0 R'; }).join(' ') + '] >>');
    var catId = add('<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>');
    objs.forEach(function (o, i) {
      offsets[i] = body.length;
      if (typeof o === 'string') {
        body += (i + 1) + ' 0 obj\n' + o.replace('PAGES 0 R', pagesId + ' 0 R') + '\nendobj\n';
      } else {
        body += (i + 1) + ' 0 obj\n' + o.dict + '\nstream\n';
        var bin = '';
        for (var k = 0; k < o.stream.length; k++) {
          if (typeof o.stream[k] === 'number') bin += String.fromCharCode(o.stream[k]);
          else bin += o.stream[k];
        }
        body += bin + '\nendstream\nendobj\n';
      }
    });
    var xref = body.length;
    var x = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    for (var i = 0; i < objs.length; i++) x += ('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n';
    body += x + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catId + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return body;
  }
  function exportDeck(slides, opts) {
    opts = opts || {};
    return Promise.all(slides.map(function (s) { return jpeg(s.image); })).then(function (imgs) {
      var pages = slides.map(function (s, i) {
        return { text: s.text || '', meta: s.meta || '', accent: s.accent || opts.accent,
                 bg: opts.bg || '#080C14', image: imgs[i] };
      });
      var pdf = build(pages);
      var blob = new Blob([pdf], { type: 'application/pdf' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (opts.name || 'pitch-deck') + '.pdf';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return pdf.length;
    });
  }
  return { exportDeck: exportDeck, build: build, wrap: wrap };
})();
