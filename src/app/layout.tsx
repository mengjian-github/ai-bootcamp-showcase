import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI编程训练营作品展示',
  description: '展示AI编程训练营学员的优秀作品',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(8, 15, 35, 0.95)',
              backdropFilter: 'blur(16px)',
              color: '#e2e8f0',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 18px 40px rgba(2, 6, 23, 0.7), 0 0 24px rgba(34, 211, 238, 0.25)',
            },
            success: {
              iconTheme: {
                primary: '#22d3ee',
                secondary: '#020617',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#020617',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
