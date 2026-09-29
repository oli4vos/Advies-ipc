import type { Metadata } from "next";
import { BusinessCase } from "../page";

export const metadata: Metadata = {
  title: "Voor investeerders | Fiscale Lijn",
  description:
    "Het voorstel voor investeerders: het probleem, het vraag-en-aanbodmodel, de marktbenadering, opbrengsten, kosten, het vijfjarenplan en de belangrijkste risico's.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvestorsPage() {
  return (
    <main id="main-content">
      <BusinessCase standalone />
    </main>
  );
}
