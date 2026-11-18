import type { Metadata } from "next";
import { docsAccess } from "@/lib/docs/guard";
import { formatInZone } from "@/lib/docs/access";
import { getContent } from "@/lib/docs/store";
import { getLiveSnapshot } from "@/lib/docs/live";
import { plainText, renderMarkdown, visibleSections } from "@/lib/docs/markdown";
import DocsView, { type RenderedSection } from "@/components/docs/DocsView";
import DocsUnavailable from "@/components/docs/DocsUnavailable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jotno docs: pitch & technical whitepaper",
  description:
    "Jotno is a voice-first Bangla diabetes companion for elderly people. Pitch deck, architecture, AI and safety design, live feature status.",
  openGraph: {
    title: "Jotno: pitch & technical docs",
    description: "A diabetes companion for people who have never used an app. Speak in Bangla. Take a photo.",
    type: "website",
  },
};

export default async function DocsPage({ searchParams }: { searchParams: { preview?: string } }) {
  const { availability, admin, canView } = await docsAccess();

  if (!canView) {
    return (
      <DocsUnavailable
        reason={availability.open ? "disabled" : availability.reason}
        opensAt={!availability.open && availability.opensAt ? formatInZone(availability.opensAt) : null}
      />
    );
  }

  const previewDraft = Boolean(admin) && searchParams.preview === "draft";
  const [content, live] = await Promise.all([getContent(previewDraft ? "draft" : "published"), getLiveSnapshot()]);

  const sections: RenderedSection[] = visibleSections(content).map((s) => ({
    id: s.id,
    group: s.group,
    title: s.title,
    live: s.live,
    html: renderMarkdown(s.body),
    text: plainText(s.body),
  }));

  return (
    <DocsView
      tagline={content.tagline}
      teamName={content.teamName}
      team={content.team}
      sections={sections}
      initialLive={live}
      admin={admin ? { role: admin.role, previewDraft } : null}
      windowNote={
        availability.open
          ? availability.closesAt
            ? `Public until ${formatInZone(availability.closesAt)} (Dhaka)`
            : "Public"
          : "Hidden from the public. You are seeing it as an admin."
      }
    />
  );
}
