#!/usr/bin/env python3
"""Promote the assembled prehub to the root file - only if CI actually proved it.

Runs after the embed suite. It reads build/out/report.json and promotes ONLY when:
  1. the overall verdict is PASS, and
  2. every staging check passed (tiles, canvas, rigs, poses, angles, framings).

Anything else is a no-op, and the reason is printed. A failed suite never promotes.
"""
import json, os, shutil, subprocess, sys

REPORT = "build/out/report.json"
SOURCE = "build/out/prehub.html"
TARGET = "prehub.html"

REQUIRED = [
    "nine tiles render",
    "staging canvas opens",
    "lighting rigs in the panel",
    "poses in the panel",
    "camera angles and framing",
    "no page or console errors",
]


def run(*args):
    return subprocess.run(args, capture_output=True, text=True)


def main():
    if not os.path.exists(REPORT):
        print("promote: no report at %s - not promoting" % REPORT)
        return 0
    with open(REPORT) as fh:
        rep = json.load(fh)
    verdict = rep.get("verdict")
    results = rep.get("results", [])
    staging = [r for r in results if "prehub" in str(r.get("file", "")).lower()]
    print("promote: verdict=%s  checks=%s  staging checks=%d" % (verdict, rep.get("summary"), len(staging)))

    if verdict != "PASS":
        print("promote: verdict is %s - not promoting" % verdict)
        for r in results:
            if not r.get("ok"):
                print("   failing: %s :: %s -> %s" % (r.get("file"), r.get("check"), r.get("detail")))
        return 0

    missing = []
    for want in REQUIRED:
        hit = [r for r in staging if r.get("check") == want and r.get("ok")]
        if not hit:
            missing.append(want)
    if missing:
        print("promote: staging checks not green - not promoting")
        for m in missing:
            print("   missing or failing: %s" % m)
        return 0

    if not os.path.exists(SOURCE):
        print("promote: no assembled build at %s" % SOURCE)
        return 1

    before = os.path.getsize(TARGET) if os.path.exists(TARGET) else 0
    shutil.copyfile(SOURCE, TARGET)
    after = os.path.getsize(TARGET)
    print("promote: %s -> %s  (%d -> %d bytes)" % (SOURCE, TARGET, before, after))

    run("git", "config", "user.name", "prohub-ci")
    run("git", "config", "user.email", "ci@localhost")
    run("git", "fetch", "origin", "--quiet")
    run("git", "checkout", "main")
    run("git", "reset", "--hard", "origin/main")
    shutil.copyfile(SOURCE, TARGET)
    run("git", "add", TARGET)
    msg = "ci: promote the assembled prehub - %d checks passed, staging green [skip ci]" % rep.get("summary", {}).get("passed", 0)
    commit = run("git", "commit", "-m", msg)
    print("   commit:", (commit.stdout or commit.stderr).strip()[:160])
    push = run("git", "push", "origin", "HEAD:main")
    ok = push.returncode == 0
    print("   push:", (push.stdout or push.stderr).strip()[:200] or ("ok" if ok else "failed"))
    print("promote: DONE - prehub.html on main is now the assembled build" if ok else "promote: push refused - main unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())
