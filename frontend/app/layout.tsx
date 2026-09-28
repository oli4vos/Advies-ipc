import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiscale Lijn | Belastinghulp voor het mkb',
  description:
    'Van een rommelige belastingvraag naar een duidelijke route, vaste prijs en controle door een passende specialist.',
  applicationName: 'Fiscale Lijn',
  openGraph: {
    title: 'Fiscale Lijn | Belastinghulp voor het mkb',
    description:
      'Leg uw belastingvraag voor en krijg een duidelijke route met menselijke controle.',
    locale: 'nl_NL',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <a className="skip-link" href="#main-content">Ga naar de inhoud</a>
        {children}
      </body>
    </html>
  )
}
