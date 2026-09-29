import type { Metadata } from "next";
import ProfessionalBodyPitch from "../ProfessionalBodyPitch";

export const metadata: Metadata = {
  title: "Samenwerkingsvoorstel RB | Fiscale Lijn",
  description:
    "Concept voor een besloten proef die vrijwillige RB-leden koppelt aan afgebakende specialistische mkb-opdrachten.",
  robots: { index: false, follow: false },
};

export default function RbPartnershipPage() {
  return <ProfessionalBodyPitch body="rb" />;
}
