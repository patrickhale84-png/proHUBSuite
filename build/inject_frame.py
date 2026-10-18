#!/usr/bin/env python3
"""Inject the shared phone frame into every hub.

The frame lives in build/shared/phone-frame.css and phone-frame.js. This writes
one block, between <!-- PF:BEGIN --> and <!-- PF:END -->, just before </body> of
each hub, with that hub's PF_CONFIG. Re-running replaces the block in place.

    python3 build/inject_frame.py            # inject into all hubs
    python3 build/build.py --app filmhub     # then rebuild filmHUB (its shell is in parts)
"""
import json, os, re, sys
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED = os.path.join(ROOT, 'build', 'shared')

STROKE = ("xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' "
          "stroke-width='2' stroke-linecap='round' stroke-linejoin='round'")
ICONS = {
    # filmHUB, the front desk: a film frame with its perforations
    'I_FILM': "<svg %s><rect x='3' y='3' width='18' height='18' rx='2'/><path d='M7 3v18M17 3v18M3 7.5h4M3 12h4M3 16.5h4M17 7.5h4M17 12h4M17 16.5h4'/></svg>" % STROKE,
    # preHUB, writing: a pen
    'I_PRE': "<svg %s><path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/></svg>" % STROKE,
    # proHUB, the shoot: a clapperboard
    'I_PRO': "<svg %s><path d='M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z'/><path d='m4 11-.9-3.4a1 1 0 0 1 .7-1.2L17 3l1.1 3.9z'/><path d='m7.6 5.6 3 3.3M12.5 4.3l3 3.3'/></svg>" % STROKE,
    # postHUB, the cut: scissors
    'I_POST': "<svg %s><circle cx='6' cy='6' r='3'/><circle cx='6' cy='18' r='3'/><path d='M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12'/></svg>" % STROKE,
    # the menu: three lines
    'I_MENU': "<svg %s><path d='M4 7h16M4 12h16M4 17h16'/></svg>" % STROKE,
    # one sprocket hole of the strip, 12x18, repeated down both edges
    'PERF': "<svg xmlns='http://www.w3.org/2000/svg' width='12' height='18' viewBox='0 0 12 18'><rect x='3' y='4.5' width='6' height='9' rx='1.6' fill='#C9C2B4' fill-opacity='.82'/></svg>",
}

HUBS = {
    'prehub.html': {
        'grid': '#db-grid', 'main': '.apc', 'drawer': '#psb', 'tileClass': 'mtile', 'home': 'sw', 'insetInside': True,
        'hide': ['#v-dashboard > .max-w-6xl > :first-child'],
    },
    'prohub.html': {
        'grid': '.tile-grid', 'main': '.apc', 'drawer': '.psb', 'tileClass': 'mtile', 'home': 'sw', 'insetInside': True,
        'hide': ['.dash-inner > :first-child', '#bridge-notice', '.stats-grid'],
        'proxies': [{'label': 'Sync preHUB', 'icon': 'fa-solid fa-satellite-dish', 'fn': 'loadBridgeData', 'color': '#E87B30'}],
    },
    'posthub.html': {
        'grid': '#tilesMount', 'main': '.workspace', 'drawer': '#hdrDrawer', 'tileClass': 'mtile', 'homeClick': '#btnLaunchpad',
        'hide': ['#launchpadModal > :first-child'],
        'proxies': [{'label': 'Back to the edit desk', 'icon': 'fa-solid fa-film', 'click': '#btnCloseLaunchpad', 'color': '#0E7C7B'}],
    },
    'build/parts-filmhub/00-shell.html': {
        'grid': '#tiles', 'drawer': '#hdrDrawer', 'tileClass': 'tile', 'hide': [], 'home': 'top',
    },
}

BEGIN, END = '<!-- PF:BEGIN -->', '<!-- PF:END -->'


def render_css():
    css = open(os.path.join(SHARED, 'phone-frame.css'), encoding='utf-8').read()
    for key, svg in ICONS.items():
        css = css.replace('{{%s}}' % key, 'data:image/svg+xml,' + quote(svg, safe="=:/,;'() "))
    left = re.findall(r'\{\{[A-Z_]+\}\}', css)
    assert not left, 'unfilled icon slots: %s' % left
    return css


def block(cfg, css, js):
    return '\n'.join([
        BEGIN,
        '<style id="pf-style">\n' + css + '\n</style>',
        '<script>window.PF_CONFIG=' + json.dumps(cfg) + ';</script>',
        '<script id="pf-script">\n' + js + '\n</script>',
        END,
    ])


def main():
    css = render_css()
    js = open(os.path.join(SHARED, 'phone-frame.js'), encoding='utf-8').read()
    for rel, cfg in HUBS.items():
        path = os.path.join(ROOT, rel)
        s = open(path, encoding='utf-8').read()
        b = block(cfg, css, js)
        if BEGIN in s:
            s = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), lambda m: b, s, count=1, flags=re.S)
            how = 'replaced'
        else:
            assert s.count('</body>') == 1, rel + ': expected one </body>'
            s = s.replace('</body>', b + '\n</body>')
            how = 'inserted'
        open(path, 'w', encoding='utf-8').write(s)
        print('%-40s %s' % (rel, how))


if __name__ == '__main__':
    sys.exit(main())
