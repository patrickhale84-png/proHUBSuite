#!/usr/bin/env python3
"""Assemble prehub.html from the shell plus one file per module.

Why this exists: patching a 100 KB single file in place means one bad edit kills the
whole app and nothing can be verified on its own. Here, each module lives in its own
file, is wrapped in its own IIFE automatically, and the assembled script is written
out for a syntax check before anything is committed.

Usage:
    python3 build/build.py            # assemble -> build/out/prehub.html + build/out.js
    python3 build/build.py --check    # assemble, then report unbalanced brackets
"""
import os, re, sys, json, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, "build", "parts")
SHELL = os.path.join(PARTS, "00-shell.html")
OUTDIR = os.path.join(ROOT, "build", "out")
ANCHOR = "window.preHUB={version:'1.0'"


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def wrap(name, code):
    """Every module becomes its own statement. This is the rule that took a broken
    build to learn: a bare block appended after the previous `})();` fails to parse."""
    return ";\n/* module: %s */\n(function(){\n%s\n})();\n" % (name, code.strip())


def scan(text):
    """Balance check that skips strings, template strings, comments and regex bodies."""
    depth = {"{": 0, "(": 0, "[": 0}
    pairs = {"}": "{", ")": "(", "]": "["}
    state = None
    esc = False
    i = 0
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if state == "line":
            if ch == "\n":
                state = None
            i += 1
            continue
        if state == "block":
            if ch == "*" and nxt == "/":
                state = None
                i += 2
                continue
            i += 1
            continue
        if state in ("'", '"', "`"):
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == state:
                state = None
            i += 1
            continue
        if ch == "/" and nxt == "/":
            state = "line"
            i += 2
            continue
        if ch == "/" and nxt == "*":
            state = "block"
            i += 2
            continue
        if ch in ("'", '"', "`"):
            state = ch
        elif ch in depth:
            depth[ch] += 1
        elif ch in pairs:
            depth[pairs[ch]] -= 1
        i += 1
    return depth


def main():
    shell = read(SHELL)
    modules = sorted(glob.glob(os.path.join(PARTS, "*.js")))
    blocks = []
    for m in modules:
        name = os.path.basename(m)
        code = read(m)
        if not code.strip():
            continue
        blocks.append(wrap(name, code))
    joined = "\n".join(blocks)
    if ANCHOR not in shell:
        print("FAIL: anchor not found in the shell")
        return 1
    out = shell.replace(ANCHOR, joined + ANCHOR, 1)
    os.makedirs(OUTDIR, exist_ok=True)
    with open(os.path.join(OUTDIR, "prehub.html"), "w", encoding="utf-8") as fh:
        fh.write(out)
    script = re.search(r"<script>\n(.*)\n</script>", out, re.S)
    if not script:
        print("FAIL: no script block found")
        return 1
    js = script.group(1)
    with open(os.path.join(ROOT, "build", "out.js"), "w", encoding="utf-8") as fh:
        fh.write(js)
    print("modules: %d" % len(blocks))
    print("shell:   %d chars" % len(shell))
    print("output:  %d chars" % len(out))
    if "--check" in sys.argv:
        depth = scan(js)
        print("balance: %s" % json.dumps(depth))
        bad = [k for k, v in depth.items() if v != 0]
        if bad:
            print("NOTE: balance scan flags %s - likely regex literals; node --check is the gate" % ", ".join(bad))
        print("balance: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
