import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

// Import Poppins from Google Fonts
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // choose weights you need
  variable: '--font-sans', // so you can use it in CSS
})

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
