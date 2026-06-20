/**
 * Runs after `npm i css-spec`. Prints a one-time hint pointing at the setup
 * command, so users who installed but haven't run `init` aren't left guessing.
 *
 * Deliberately quiet and safe:
 *   - Skips in CI and when not a TTY (no noise in automated installs).
 *   - Skips when installed as a transitive dependency (only the direct
 *     installer should see it).
 *   - Never fails the install — any error is swallowed.
 */

function main() {
  // Don't nag in CI / non-interactive installs.
  if (process.env.CI || !process.stdout.isTTY) return;
  // Only show for a direct install, not when pulled in as someone's dependency.
  // npm sets this to the package being installed's path; if css-spec is nested
  // under another node_modules, skip.
  const cwd = process.env.INIT_CWD || process.cwd();
  if (cwd.split("node_modules").length > 2) return;

  const c = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
  };
  const line = `${c.dim}────────────────────────────────────────────${c.reset}`;
  console.log(
    `\n${line}\n` +
      `${c.bold}${c.cyan}css-spec${c.reset} installed. One step to wire it up:\n\n` +
      `  ${c.bold}npx css-spec init${c.reset}\n\n` +
      `${c.dim}Creates the dev API route + adds the overlay to your layout.\n` +
      `Then run your dev server and press ⌥D (Alt+D).${c.reset}\n` +
      `${line}\n`
  );
}

try {
  main();
} catch {
  /* never break an install over a hint */
}
