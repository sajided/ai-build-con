import { Marked } from "marked";
import type { DocsContent, DocSection } from "./content";
import { API_ENDPOINTS, EXTERNAL_APIS } from "./registry";
import type { LiveSnapshot } from "./live";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * Markdown → HTML for docs sections. Admin-written, but still treated as untrusted:
 * raw HTML is escaped, only http(s)/mailto/tel/relative links survive,
 * and ```mermaid fences become placeholders the client renders as diagrams.
 */
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html(html: string) {
      return escapeHtml(html);
    },
    link(href: string, title: string | null | undefined, text: string) {
      if (!href || !SAFE_HREF.test(href.trim())) return text;
      const external = /^https?:/i.test(href);
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      const ext = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}"${t}${ext}>${text}</a>`;
    },
    image(href: string, _title: string | null, text: string) {
      if (!href || !/^(https:|\/)/i.test(href.trim())) return escapeHtml(text || "");
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text || "")}" loading="lazy" />`;
    },
    code(code: string, lang: string | undefined) {
      if ((lang || "").trim() === "mermaid") {
        return `<div class="docs-mermaid" data-mermaid="${escapeHtml(code)}"><pre><code>${escapeHtml(code)}</code></pre></div>`;
      }
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    },
  },
});

export function renderMarkdown(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
}

/** Plain text for search: drops markdown syntax and mermaid source. */
export function plainText(md: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`>|]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function visibleSections(content: DocsContent): DocSection[] {
  return content.sections.filter((s) => !s.hidden);
}

/** The whole published docs as one Markdown file, live blocks included as tables. */
export function toMarkdownDocument(content: DocsContent, live: LiveSnapshot | null): string {
  const out: string[] = [`# Jotno: documentation & pitch`, "", `> ${content.tagline}`, ""];
  if (live) out.push(`_Exported ${new Date(live.checkedAt).toUTCString()} · build ${live.build.commitSha ?? "unknown"}_`, "");

  for (const group of ["pitch", "technical"] as const) {
    out.push(`## ${group === "pitch" ? "Part 1: Pitch" : "Part 2: Technical documentation"}`, "");
    for (const s of visibleSections(content).filter((x) => x.group === group)) {
      out.push(`### ${s.title}`, "", s.body, "");
      if (s.live === "team") {
        out.push("| Name | Role | Email |", "|---|---|---|");
        for (const m of content.team) out.push(`| ${m.name} | ${m.role} | ${m.email ?? "—"} |`);
        out.push("");
      }
      if (s.live === "features" && live) {
        out.push("| Feature | Status | What it does |", "|---|---|---|");
        for (const f of live.features) out.push(`| ${f.name} | ${f.state} | ${f.summary} |`);
        out.push("");
      }
      if (s.live === "api") {
        out.push("**Exposed endpoints**", "", "| Endpoint | Methods | Auth | Purpose |", "|---|---|---|---|");
        for (const a of API_ENDPOINTS) out.push(`| \`${a.path}\` | ${a.methods.join(", ")} | ${a.auth} | ${a.summary} |`);
        out.push("", "**External APIs used**", "");
        for (const e of EXTERNAL_APIS) out.push(`- **${e.name}**: ${e.use}`);
        out.push("");
      }
      if (s.live === "changelog" && live?.build.commits) {
        for (const c of live.build.commits.slice(0, 30)) out.push(`- \`${c.hash}\` ${c.date.slice(0, 10)}: ${c.subject}`);
        out.push("");
      }
    }
  }
  return out.join("\n");
}
