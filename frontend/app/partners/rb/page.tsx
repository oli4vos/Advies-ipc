import type { Metadata } from "next";
import ProfessionalBodyPitch from "../ProfessionalBodyPitch";

export const metadata: Metadata = {
  title: "Samenwerkingsvoorstel RB | Fiscale Lijn",
  description:
    "Conceptvoorstel voor gecontroleerde RB-ledenverificatie, specialistische mkb-opdrachten en een gezamenlijke kwaliteitspilot.",
  robots: { index: false, follow: false },
};

export default function RbPartnershipPage() {
  return <ProfessionalBodyPitch body="rb" />;
}
