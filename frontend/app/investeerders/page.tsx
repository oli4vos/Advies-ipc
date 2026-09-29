import type { Metadata } from "next";
import { BusinessCase } from "../page";

export const metadata: Metadata = {
  title: "Investeerderscase | Fiscale Lijn",
  description:
    "De investeerderscase van Fiscale Lijn: probleem, marktplaatsmodel, go-to-market, unit economics, vijfjarenplan en belangrijkste validatierisico's.",
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
