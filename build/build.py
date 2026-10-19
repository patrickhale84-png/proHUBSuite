#!/usr/bin/env python3
"""Assemble the suite apps from their parts.

    python3 build/build.py                 # every app
    python3 build/build.py --app posthub   # one app
    python3 build/build.py --check         # plus the (advisory) balance report

An app is a shell plus one file per module. Modules are inserted immediately before that
app's anchor, each wrapped in its own IIFE - a bare block appended after the previous
`})();` does not parse, and that rule is the reason this script exists.

prohub.html is deliberately absent: it is a single hand-maintained file, not assembled.
"""
import os, re, sys, json, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, 'build', 'out')

# anchor: modules are inserted immediately before this string
APPS = {
    'prehub':  {'parts': 'build/parts',         'anchor': "window.preHUB={version:'1.0'"},
    'filmhub': {'parts': 'build/parts-filmhub', 'anchor': '</script>'},
    'posthub': {'parts': 'build/parts-posthub', 'anchor': '</script>'},
    # prohub is a shell with no modules yet: it joins the assembler so its 119 KB of script
    # gets node --check on every push, which is the gate the split needs before it starts.
    # prohub's parts land INSIDE the shell IIFE, immediately before the export line, so a
    # part shares the shell's scope ($ , pad, S, renderTiles). Placed after the IIFE it
    # would parse and do nothing - that is why this anchor differs from filmhub/posthub.
    'prohub':  {'parts': 'build/parts-prohub',   'anchor': "window.proHUB={version:'1.0'"},
}
SHELL = '00-shell.html'


def read(path):
    with open(path, 'r', encoding='utf-8') as fh:
        return fh.read()


def wrap(name, code):
    return ";\n/* module: %s */\n(function(){\n%s\n})();\n" % (name, code.strip())


def assemble(app):
    spec = APPS[app]
    parts = os.path.join(ROOT, spec['parts'])
    shell_path = os.path.join(parts, SHELL)
    if not os.path.exists(shell_path):
        print('%-8s SKIP  no shell at %s' % (app, spec['parts']))
        return None
    shell = read(shell_path)
    blocks = []
    for m in sorted(glob.glob(os.path.join(parts, '*.js'))):
        code = read(m)
        if code.strip():
            blocks.append(wrap(os.path.basename(m), code))
    if spec['anchor'] not in shell:
        print('%-8s FAIL  anchor not found: %s' % (app, spec['anchor'][:34]))
        return None
    out = shell.replace(spec['anchor'], ''.join(blocks) + spec['anchor'], 1)
    os.makedirs(OUTDIR, exist_ok=True)
    with open(os.path.join(OUTDIR, app + '.html'), 'w', encoding='utf-8') as fh:
        fh.write(out)
    scripts = re.findall(r'<script>\n?(.*?)\n?</script>', out, re.S)
    js = '\n'.join(scripts)
    with open(os.path.join(OUTDIR, app + '.js'), 'w', encoding='utf-8') as fh:
        fh.write(js)
    print('%-8s %6d bytes  %d modules  script %d chars' % (
        app, len(out), len(blocks), len(js)))
    return out


def scan(text):
    depth = {'{': 0, '(': 0, '[': 0}
    pairs = {'}': '{', ')': '(', ']': '['}
    state, esc, i = None, False, 0
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ''
        if state == 'line':
            if ch == '\n':
                state = None
            i += 1
            continue
        if state == 'block':
            if ch == '*' and nxt == '/':
                state = None
                i += 2
                continue
            i += 1
            continue
        if state in ("'", '"', '`'):
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == state:
                state = None
            i += 1
            continue
        if ch == '/' and nxt == '/':
            state = 'line'
            i += 2
            continue
        if ch == '/' and nxt == '*':
            state = 'block'
            i += 2
            continue
        if ch in ("'", '"', '`'):
            state = ch
        elif ch in depth:
            depth[ch] += 1
        elif ch in pairs:
            depth[pairs[ch]] -= 1
        i += 1
    return depth


def main():
    argv = sys.argv[1:]
    app = 'all'
    if '--app' in argv:
        app = argv[argv.index('--app') + 1]
    names = list(APPS) if app == 'all' else [app]
    built = 0
    for name in names:
        if name not in APPS:
            print('unknown app: %s  (known: %s)' % (name, ', '.join(APPS)))
            return 1
        if assemble(name):
            built += 1
    print('built %d of %d apps -> build/out/' % (built, len(names)))
    if '--check' in argv:
        for name in names:
            p = os.path.join(OUTDIR, name + '.js')
            if not os.path.exists(p):
                continue
            depth = scan(read(p))
            bad = [k for k, v in depth.items() if v != 0]
            print('balance %-8s %s' % (name, 'advisory mismatch ' + json.dumps(depth) if bad else 'ok'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
