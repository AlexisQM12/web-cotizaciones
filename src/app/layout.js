import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { InstallPWA } from '@/components/InstallPWA'
import NotasFlotantes from '@/components/NotasFlotantes'

export const metadata = {
    title: 'CGO Pymes - Dashboard',
    description: 'Centro de Gestión Operativa para Pymes',
    manifest: '/manifest.json',
}

export const viewport = {
    themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body>
                <AuthProvider>
                    {children}
                    {/* Flota sobre cualquier pantalla; se oculta sola sin sesión. */}
                    <NotasFlotantes />
                </AuthProvider>
                <InstallPWA />
            </body>
        </html>
    )
}
