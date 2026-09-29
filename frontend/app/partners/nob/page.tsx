import type { Metadata } from "next";
import ProfessionalBodyPitch from "../ProfessionalBodyPitch";

export const metadata: Metadata = {
  title: "Samenwerkingsvoorstel NOB | Fiscale Lijn",
  description:
    "Concept voor een besloten proef waarin NOB-kwaliteit, onafhankelijkheid en menselijke eindverantwoordelijkheid zichtbaar blijven in digitaal belastingadvies.",
  robots: { index: false, follow: false },
};

export default function NobPartnershipPage() {
  return <ProfessionalBodyPitch body="nob" />;
}
