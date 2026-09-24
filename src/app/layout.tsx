import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tracer — Security Scanner',
  description: 'Scan AI agent skills for security vulnerabilities',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
