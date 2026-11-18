"use client";

import { useEffect } from "react";

/**
 * Turns `.docs-mermaid` placeholders (emitted by the markdown renderer) into SVG diagrams.
 * Mermaid is ~1 MB, so it is imported only when a diagram scrolls near the viewport.
 * The <pre> source stays visible if rendering fails.
 */
export function useMermaid(rootSelector: string, deps: unknown[] = []) {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".docs-mermaid:not([data-rendered])"));
    if (!nodes.length) return;

    let counter = 0;
    const render = async (el: HTMLElement) => {
      el.setAttribute("data-rendered", "pending");
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            fontFamily: "Nunito, system-ui, sans-serif",
            primaryColor: "#CFE0FA",
            primaryTextColor: "#1F2328",
            primaryBorderColor: "#7FA7EE",
            lineColor: "#4A4F57",
            secondaryColor: "#E1ECB2",
            tertiaryColor: "#F5F4ED",
          },
          flowchart: { htmlLabels: true, curve: "basis" },
        });
        const { svg } = await mermaid.render(`docs-mmd-${Date.now()}-${counter++}`, el.dataset.mermaid || "");
        // Finish even after cleanup (React strict mode re-runs effects); skip if the node is gone
        if (el.isConnected) {
          el.innerHTML = svg;
          el.setAttribute("data-rendered", "ok");
        }
      } catch {
        el.setAttribute("data-rendered", "error");
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            void render(e.target as HTMLElement);
          }
        }
      },
      { rootMargin: "400px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => {
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
