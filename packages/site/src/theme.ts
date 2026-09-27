// The light/dark toggle in the nav, shared by the site's pages. index.html applies the stored
// theme before the first paint.

function toggleTheme() {
  const root = document.documentElement;
  const current =
    root.getAttribute("data-theme") ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage unavailable: the theme still changes for this visit.
  }
}

export function initTheme() {
  document.getElementById("theme")?.addEventListener("click", toggleTheme);
}
