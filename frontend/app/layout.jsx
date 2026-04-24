import './globals.css'

export const metadata = {
  title: 'HealthQueue',
  description: 'Smart clinic queue management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}