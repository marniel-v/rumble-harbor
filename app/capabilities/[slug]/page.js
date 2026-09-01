import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import CapabilityView from "@/components/capabilities/CapabilityView";
import { bySlug, liveWorks, neighbours } from "@/components/capabilities/works";

/**
 * One route per capability, so every screen has a link worth sending and the
 * back button does what it looks like it does. The transition between them is
 * client-side and animated; see CapabilityView.jsx for the handoff.
 */

export function generateStaticParams() {
  return liveWorks.map((w) => ({ slug: w.slug }));
}

// Works without a page 404 rather than rendering an empty shell.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = bySlug(slug);
  if (!work) return {};
  return {
    // The claim is split for the page; the title puts it back together.
    title: `${work.capability} ${work.qualifier} · Rumble Harbor`,
    description: work.lead,
  };
}

export default async function CapabilityPage({ params }) {
  const { slug } = await params;
  const work = bySlug(slug);
  if (!work?.ready) notFound();

  const { prev, next } = neighbours(slug);

  return (
    <>
      <Nav />
      {/* No site footer here. The run itself is the footer — see the fixed
          band in CapabilityView — so the bottom of the window is always a way
          into the next capability rather than a dead end. */}
      <main>
        <CapabilityView work={work} prev={prev} next={next} />
      </main>
    </>
  );
}
