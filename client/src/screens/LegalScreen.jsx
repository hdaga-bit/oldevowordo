import { Link } from "react-router-dom";
import GradientBackground from "../components/ui/GradientBackground";
import { SUPPORT_EMAIL, SITE_NAME } from "../config/site";

const SECTIONS = {
  privacy: {
    title: "Privacy Policy",
    updated: "May 2026",
    body: [
      {
        h: "Overview",
        p: `${SITE_NAME} ("we", "our") operates a multiplayer word game. This policy describes what we collect and why.`,
      },
      {
        h: "Information we collect",
        p: "Account data (email, display name, OAuth identifiers) when you sign in; a device identifier for anonymous play; gameplay data (daily results, stats, achievements); room participation metadata; and optional feedback including your email if you provide it.",
      },
      {
        h: "Cookies and sessions",
        p: "We use HTTP cookies for authentication and session management. These are required to keep you signed in and to associate gameplay with your account or device.",
      },
      {
        h: "How we use data",
        p: "To run the game, show leaderboards, prevent abuse, improve the product, and respond to feedback. We do not sell your personal information.",
      },
      {
        h: "Retention",
        p: "Account and gameplay records are kept while your account is active. Sessions expire automatically. You may request deletion by contacting us.",
      },
      {
        h: "Third parties",
        p: "We may use hosting, database, error monitoring (e.g. Sentry), OAuth providers (e.g. Google), and advertising (Google AdSense). Ad partners may use cookies to serve ads. Their policies apply to their services.",
      },
      {
        h: "Advertising",
        p: "We use Google AdSense to show ads on some pages. Google may use cookies and similar technologies to personalize or measure ads. You can manage ad preferences at Google Ad Settings.",
      },
      {
        h: "Donations",
        p: "Optional donations are processed by Paystack when you choose to support the project. Payment details are handled by Paystack under their privacy policy. Donations are voluntary and not required to play.",
      },
      {
        h: "Contact",
        p: `Questions: ${SUPPORT_EMAIL}`,
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "May 2026",
    body: [
      {
        h: "Agreement",
        p: `By using ${SITE_NAME}, you agree to these terms. If you do not agree, do not use the service.`,
      },
      {
        h: "The service",
        p: "We provide an online word game for entertainment. Features and availability may change without notice.",
      },
      {
        h: "Accounts",
        p: "You are responsible for activity on your account. Do not share credentials. We may suspend accounts that violate these terms.",
      },
      {
        h: "Acceptable use",
        p: "No cheating, bots, harassment, hate speech, or attempts to disrupt the service. No scraping or unauthorized automation.",
      },
      {
        h: "User content",
        p: "Display names and feedback you submit must be lawful and respectful. We may remove content that violates these terms.",
      },
      {
        h: "Disclaimer",
        p: 'The service is provided "as is" without warranties. We are not liable for indirect or consequential damages to the extent permitted by law.',
      },
      {
        h: "Donations",
        p: "Voluntary tips or donations via Paystack do not grant gameplay advantages, refunds (unless required by law), or ongoing obligations. Charge disputes should be directed to Paystack and our support email.",
      },
      {
        h: "Contact",
        p: `Questions: ${SUPPORT_EMAIL}`,
      },
    ],
  },
};

export default function LegalScreen({ type = "privacy" }) {
  const doc = SECTIONS[type] || SECTIONS.privacy;
  const other = type === "privacy" ? "terms" : "privacy";
  const otherLabel = type === "privacy" ? "Terms of Service" : "Privacy Policy";

  return (
    <GradientBackground>
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-14 pb-24">
        <Link
          to="/"
          className="text-sm text-zinc-400 hover:text-white transition mb-6 inline-block"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-white mb-1">{doc.title}</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: {doc.updated}</p>
        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          {doc.body.map((section) => (
            <section key={section.h}>
              <h2 className="text-lg font-semibold text-white mb-2">{section.h}</h2>
              <p>{section.p}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-zinc-500">
          See also{" "}
          <Link to={`/${other}`} className="text-zinc-300 underline hover:text-white">
            {otherLabel}
          </Link>
        </p>
      </div>
    </GradientBackground>
  );
}
