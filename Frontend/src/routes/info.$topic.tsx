import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileText, Info, LifeBuoy, Lock, Mail, RotateCcw, ShieldCheck } from "lucide-react";

type Topic = {
  title: string;
  kicker: string;
  intro: string;
  points: Array<{ heading: string; body: string }>;
  closing: string;
};

const topics: Record<string, Topic> = {
  about: {
    title: "About Rail Daddy",
    kicker: "Who we are",
    intro: "Rail Daddy is a booking assistant for Indian train travel. We help you pick a route, compare classes and reach a shortlist of trains worth booking — without the maze.",
    points: [
      { heading: "What Rail Daddy does", body: "Searches trains between two stations, filters by class and quota, and shows you the options in one place so you can decide quickly." },
      { heading: "What Rail Daddy is not", body: "We are not Indian Railways. Tickets are issued, confirmed and cancelled through authorized Indian Railways channels." },
      { heading: "Where this build stands", body: "This is a design preview. The stations, timings and fares you see on the search page are sample values, not live inventory." },
    ],
    closing: "Ready to look at trains? Head back to the search.",
  },
  help: {
    title: "Help",
    kicker: "Before you search",
    intro: "Quick answers to the things people ask us most often.",
    points: [
      { heading: "How a search works", body: "Type a city, station name or station code in From and To, pick a travel date, choose a class and passenger count, then press Find my train." },
      { heading: "What the classes mean", body: "SL is sleeper, an unreserved-bunk coach. 3A is three berths a side with blankets. 2A is two berths a side and roomier. 1A is the most private and costly." },
      { heading: "Quota, briefly", body: "General is the open pool. Tatkal opens a day ahead for last-minute plans. Ladies and Senior Citizen are reserved pools for travellers who qualify." },
      { heading: "Dates", body: "Travel dates start from tomorrow. Today, Tomorrow and This weekend are one tap in the calendar." },
    ],
    closing: "Still stuck? The Contact page is the quickest way to reach us.",
  },
  cancellation: {
    title: "Cancellation and refund policy",
    kicker: "Money back",
    intro: "Refunds follow the rules of the channel that issued your ticket. Rail Daddy does not hold your fare.",
    points: [
      { heading: "Who cancels what", body: "Cancellations and refunds are processed by the authorized Indian Railways channel that issued the ticket. The same channel applies its own cutting dates and charges." },
      { heading: "Typical windows", body: "Railways usually refunds more the further ahead you cancel, and less close to departure. The exact cut-off depends on the train, the class and whether the ticket was Tatkal." },
      { heading: "Tatkal tickets", body: "Tatkal tickets have narrower refund rules than General tickets, and usually refund less." },
      { heading: "What we show you", body: "Fares and refund figures on this preview page are samples. Real amounts come from the issuing channel at the moment you cancel." },
    ],
    closing: "Have a ticket number? Contact us and we'll point you to the right window.",
  },
  privacy: {
    title: "Privacy",
    kicker: "Your data",
    intro: "Short version: we keep as little as possible, and nothing leaves your device in this build.",
    points: [
      { heading: "What is stored on your device", body: "Your recent stations and your last search are saved in this browser only, so the page can offer them again next visit. Clearing site data removes them." },
      { heading: "Accounts", body: "This preview has no sign-in, so there is no profile, no booking history and no payment data held on a server." },
      { heading: "When bookings go live", body: "Personal details will be shared with the authorized channel that issues your ticket, and used only to complete that booking." },
    ],
    closing: "Questions about a specific detail? Ask us from the Contact page.",
  },
  contact: {
    title: "Contact",
    kicker: "Talk to us",
    intro: "Tell us where you are stuck — a route, a class, a refund — and we'll help you find the train.",
    points: [
      { heading: "Contact channels", body: "An email address and phone number are not published in this preview yet. They will appear here once the real channels are set up." },
      { heading: "Response times", body: "Not committed to in this preview. We would rather state a real number than promise one we cannot keep." },
    ],
    closing: "Meanwhile, the search is the fastest way to get moving.",
  },
};

const topicIcons = { about: Info, help: LifeBuoy, cancellation: RotateCcw, privacy: Lock, contact: Mail } as const;

export const Route = createFileRoute("/info/$topic")({
  loader: ({ params }) => {
    const topic = topics[params.topic];
    if (!topic) throw notFound();
    return { topic: params.topic, ...topic };
  },
  head: ({ params }) => {
    const t = topics[params.topic];
    const title = t ? `Rail Daddy — ${t.title}` : "Rail Daddy";
    const description = t ? t.intro : "About, help, refunds and privacy for Rail Daddy.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: InfoPage,
});

function InfoPage() {
  const page = Route.useLoaderData();
  const Icon = topicIcons[page.topic as keyof typeof topicIcons] ?? FileText;

  return (
    <div className="railway-app info-page">
      <header className="info-bar">
        <Link to="/" className="info-brand">RAIL DADDY<span className="footer-stop">.</span></Link>
        <Link to="/" className="info-back"><ArrowLeft size={15} aria-hidden="true" /> Back to search</Link>
      </header>
      <main className="info-main">
        <article className="info-card">
          <div className="info-head">
            <span className="info-icon"><Icon size={20} aria-hidden="true" /></span>
            <div>
              <p className="info-kicker">{page.kicker}</p>
              <h1 className="info-title">{page.title}</h1>
            </div>
          </div>
          <p className="info-intro">{page.intro}</p>
          <div className="info-points">
            {page.points.map((point) => (
              <section className="info-point" key={point.heading}>
                <h2>{point.heading}</h2>
                <p>{point.body}</p>
              </section>
            ))}
          </div>
          <p className="info-closing">{page.closing}</p>
          <Link to="/" className="info-cta">Find my train<ArrowLeft size={16} aria-hidden="true" style={{ transform: "rotate(180deg)" }} /></Link>
          <div className="info-trust">
            <span className="trust-badge"><ShieldCheck size={15} aria-hidden="true" /> Secure payment</span>
            <span className="trust-badge"><RotateCcw size={15} aria-hidden="true" /> Refund policy</span>
          </div>
        </article>
      </main>
    </div>
  );
}
