import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

// Black-box tests of scripts/platform-review.ts, the core of the pull request workflow: Harvest
// Commons in a throwaway Git repository, committed twice (the second commit changes a motivation's
// block, not its prose). Runs the built CLI (`pnpm build` first).

const ROOT = resolve(import.meta.dirname, "../../..");
const SCRIPT = join(ROOT, "scripts/platform-review.ts");
const MOTIVATIONS = "2-design/d3-motivations.pdt42.md";
let repo: string;
let out: string;

function git(...args: string[]) {
  execFileSync(
    "git",
    ["-C", repo, "-c", "user.name=Ann", "-c", "user.email=ann@example.org", ...args],
    { encoding: "utf8" },
  );
}

function review(base: string, env: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", SCRIPT, "--base", base, "--out", out, "."],
    { cwd: repo, encoding: "utf8", env: { ...process.env, ...env } },
  );
}

test.describe("platform design review script", () => {
  test.beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), "pdt42-review-repo-"));
    out = mkdtempSync(join(tmpdir(), "pdt42-review-out-"));
    cpSync(join(ROOT, "examples/harvest-commons"), repo, { recursive: true });
    git("init", "-q");
    git("add", "-A");
    git("commit", "-qm", "Harvest Commons");
    const path = join(repo, MOTIVATIONS);
    writeFileSync(path, readFileSync(path, "utf8").replace("status: potential", "status: current"));
    git("commit", "-qam", "Farmers grow to order now");
  });

  test.afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });

  test("renders a review page and a comment for a platform design change", async ({ page }) => {
    const githubOutput = join(out, "github-output");
    writeFileSync(githubOutput, "");
    const result = review("HEAD~1", { GITHUB_OUTPUT: githubOutput });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(githubOutput, "utf8")).toBe('changed=true\npages=["workspace.html"]\n');

    const summary = JSON.parse(readFileSync(join(out, "result.json"), "utf8")) as {
      changed: boolean;
      reviews: Array<{ workspace: string; changed: boolean; warnings: number; page?: string }>;
    };
    expect(summary.changed).toBe(true);
    expect(summary.reviews).toMatchObject([
      { workspace: ".", changed: true, warnings: 1, page: "workspace.html" },
    ]);

    const comment = readFileSync(join(out, "summary.md"), "utf8");
    expect(comment.startsWith("<!-- pdt42-platform-design-review -->\n")).toBe(true);
    expect(comment).toContain(
      "**[Open the platform design review of `.`]({{PAGE_URL:workspace.html}})**",
    );
    expect(comment).toContain("| `.` | 0 | 1 | 0 | 1 |");
    expect(comment).toContain("All review pages as a zip: [download]({{ARTIFACT_URL}})");
    expect(comment).toContain(
      "- `m-farmers-restaurants` (motivation) — modified — status: `potential` → `current`",
    );
    expect(comment).toContain(
      `- Block 'm-farmers-restaurants' changed without changing its section prose. (\`${MOTIVATIONS}:`,
    );

    // The review page is self-contained: open it from disk.
    await page.goto(pathToFileURL(join(out, "workspace.html")).href);
    await expect(page.getByTestId("changes-view")).toBeVisible();
    await expect(page.getByTestId("diff-index-item")).toHaveCount(1);
  });

  test("reports no change without a review page", () => {
    const githubOutput = join(out, "github-output");
    writeFileSync(githubOutput, "");
    const result = review("HEAD", { GITHUB_OUTPUT: githubOutput });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(githubOutput, "utf8")).toBe("changed=false\npages=[]\n");
    expect(readFileSync(join(out, "summary.md"), "utf8")).toBe(
      "<!-- pdt42-platform-design-review -->\n### Platform design review\n\nNo platform design changes compared with `HEAD`.\n",
    );
    expect(existsSync(join(out, "workspace.html"))).toBe(false);
  });

  test("fails when the change cannot be computed", () => {
    const result = review("no-such-branch");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("pdt42 diff failed for .");
  });
});
