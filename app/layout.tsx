import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Overlay Hitless by Putra3340',
  description: 'Properti milik IHC',
  generator: 'Putra3340',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <link
      href="https://fonts.cdnfonts.com/css/norwester"
      rel="stylesheet"
    />
      <body>{children}</body>
    </html>
  )
}
