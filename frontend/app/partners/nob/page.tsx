import type { Metadata } from "next";
import ProfessionalBodyPitch from "../ProfessionalBodyPitch";

export const metadata: Metadata = {
  title: "Samenwerkingsvoorstel NOB | Fiscale Lijn",
  description:
    "Conceptvoorstel voor gecontroleerde NOB-ledenverificatie, specialistische matching en een gezamenlijke kwaliteitspilot.",
  robots: { index: false, follow: false },
};

export default function NobPartnershipPage() {
  return <ProfessionalBodyPitch body="nob" />;
}
