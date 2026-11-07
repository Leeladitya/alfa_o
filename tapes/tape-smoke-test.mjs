#!/usr/bin/env node
/**
 * tape-smoke-test.mjs: self-verification for tape.mjs. Run: node tape-smoke-test.mjs
 * Builds throwaway alfa homes in a temp folder; never touches a real one.
 * Every check names the failure it catches and prints what it saw.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const TAPE = join(dirname(fileURLToPath(import.meta.url)), "tape.mjs");
const T = mkdtempSync(join(tmpdir(), "alfa-tapes-"));
const run = (...args) => {
  const r = spawnSync(process.execPath, [TAPE, ...args], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};
let failures = 0;
function check(label, catches, ok, artifact) {
  if (!ok) failures++;
  console.log(`\n[${ok ? "PASS" : "FAIL"}] ${label}\n       catches: ${catches}\n       artifact:\n` + String(artifact).split("\n").slice(0, 9).map((l) => "         | " + l).join("\n"));
}

function home(name, { work = false } = {}) {
  const h = join(T, name);
  mkdirSync(join(h, "memory"), { recursive: true });
  writeFileSync(join(h, "PORTABLE_O.md"), "core file, must never ride on a tape\n");
  writeFileSync(join(h, "profile.local.md"), `=== PROFILE ===\nhandle: ${name}\nmachine: ${work ? "workplace" : "personal"}\n=== END PROFILE ===\n`);
  writeFileSync(join(h, "denylist.local.txt"), "Jane Realname\n");
  return h;
}

try {
  const a = home("alice");
  const empty = run("record", a, join(T, "empty.alfatape"));
  check("recording an empty home refuses, instead of reporting success", "the empty-zip failure: a tape that says done and holds nothing", empty.code === 2 && empty.out.includes("refusing to record an empty tape") && !existsSync(join(T, "empty.alfatape")), empty.out);

  writeFileSync(join(a, "MY_LIBRARY.md"), "# MY_LIBRARY.md\n\n## Memory index\n- [grain](memory/grain.md): assert row counts across joins\n");
  writeFileSync(join(a, "memory", "grain.md"), "# grain\n\nAssert row-count relationships across every join.\n\n**Why:** joins change grain silently.\n\n**How to apply:** print counts before and after.\n");
  const backup = run("record", a, join(T, "alice-backup.alfatape"));
  const tape = JSON.parse(readFileSync(join(T, "alice-backup.alfatape"), "utf8"));
  check("a backup tape carries home and never the core", "a tape smuggling a changed core onto another machine", backup.code === 0 && tape.listing.some((l) => l.path === "memory/grain.md") && !tape.listing.some((l) => l.path === "PORTABLE_O.md"), backup.out);

  const b = home("newmac");
  const dry = run("play", join(T, "alice-backup.alfatape"), b);
  check("playing shows the plan and changes nothing without --yes", "a tape overwriting a home before anyone looked", dry.code === 0 && dry.out.includes("Nothing was changed") && !existsSync(join(b, "memory", "grain.md")), dry.out);

  writeFileSync(join(b, "MY_LIBRARY.md"), "# my own library on the new machine\n");
  const played = run("play", join(T, "alice-backup.alfatape"), b, "--yes");
  check("playing with --yes restores new files and keeps both copies when a file differs", "a tape silently overwriting what is already there", played.code === 0 && readFileSync(join(b, "memory", "grain.md"), "utf8").includes("row-count") && readFileSync(join(b, "MY_LIBRARY.md"), "utf8").startsWith("# my own library") && existsSync(join(b, "MY_LIBRARY.md.from-tape")), played.out);

  const tampered = JSON.parse(readFileSync(join(T, "alice-backup.alfatape"), "utf8"));
  const files = JSON.parse(Buffer.from(tampered.payload, "base64").toString("utf8"));
  files[0].data = Buffer.from("tampered content that is long enough to pass the floor easily, yes").toString("base64");
  tampered.payload = Buffer.from(JSON.stringify(files)).toString("base64");
  writeFileSync(join(T, "tampered.alfatape"), JSON.stringify(tampered));
  const bad = run("play", join(T, "tampered.alfatape"), home("victim"), "--yes");
  check("a tape changed on the way refuses to play", "edited content arriving as if it were the owner's", bad.code === 2 && bad.out.includes("fingerprint does not match"), bad.out);

  run("keygen", join(T, "bob"));
  writeFileSync(join(a, "memory", "lunch.md"), "# lunch\n\nLunch with Jane Realname about the project plan.\n\n**Why:** context.\n\n**How to apply:** none.\n");
  const leak = run("record", a, join(T, "share.alfatape"), "--kind", "share", "--to", join(T, "bob.pub"));
  check("a share tape refuses to record when a file carries a real name", "a real name leaving the machine on a tape", leak.code !== 0 && leak.out.includes("memory/lunch.md") && !leak.out.toLowerCase().includes("jane"), leak.out);
  rmSync(join(a, "memory", "lunch.md"));

  const share = run("record", a, join(T, "share.alfatape"), "--kind", "share", "--to", join(T, "bob.pub"));
  const shareTape = JSON.parse(readFileSync(join(T, "share.alfatape"), "utf8"));
  check("a share tape is scrubbed (no profile, no denylist) and sealed", "personal state riding along, or the tape readable by anyone", share.code === 0 && !!shareTape.sealed && !shareTape.payload && !shareTape.listing.some((l) => /profile|denylist/.test(l.path)), share.out);

  run("keygen", join(T, "eve"));
  const wrongKey = run("play", join(T, "share.alfatape"), home("eve-home"), "--yes", "--key", join(T, "eve.key"));
  const rightKey = run("play", join(T, "share.alfatape"), home("bob-home"), "--yes", "--key", join(T, "bob.key"));
  check("only the receiver's key opens a share tape", "a tape sealed to one person being playable by anyone", wrongKey.code !== 0 && wrongKey.out.includes("will not open") && rightKey.code === 0 && existsSync(join(T, "bob-home", "memory", "grain.md")), wrongKey.out + "\n" + rightKey.out.split("\n").slice(-1)[0]);

  const w = home("worker", { work: true });
  writeFileSync(join(w, "memory", "x.md"), "# x\n\nA long enough memory entry to clear the content floor of the tape.\n");
  const workShare = run("record", w, join(T, "work-share.alfatape"), "--kind", "share", "--to", join(T, "bob.pub"));
  const workBackup = run("record", w, join(T, "work-backup.alfatape"));
  const workPlay = run("play", join(T, "share.alfatape"), w, "--yes", "--key", join(T, "bob.key"));
  check("a work machine records backup tapes only and never plays a share tape in", "work data leaving on a tape, or outside material landing on a work machine", workShare.code !== 0 && workBackup.code === 0 && workPlay.code !== 0 && workPlay.out.includes("work machine"), [workShare.out, workBackup.out.split("\n")[0], workPlay.out].join("\n"));
} catch (e) {
  failures++;
  console.error("\n[FAIL] " + e.message);
} finally {
  rmSync(T, { recursive: true, force: true });
}
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} (temp homes cleaned)`);
process.exit(failures === 0 ? 0 : 1);
