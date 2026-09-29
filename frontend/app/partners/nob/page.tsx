import type { Metadata } from "next";
import ProfessionalBodyPitch from "../ProfessionalBodyPitch";

export const metadata: Metadata = {
  title: "Samenwerkingsvoorstel NOB | Fiscale Lijn",
  description:
    "Conceptvoorstel voor controle van NOB-lidmaatschap, passende specialistische opdrachten en een gezamenlijke kwaliteitsproef.",
  robots: { index: false, follow: false },
};

export default function NobPartnershipPage() {
  return <ProfessionalBodyPitch body="nob" />;
}
