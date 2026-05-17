import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
    title: 'CGO Pymes - Dashboard',
    description: 'Centro de Gestión Operativa para Pymes',
    manifest: '/manifest.json',
    themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
