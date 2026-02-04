import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
    title: 'Sistema de Cotizaciones',
    description: 'Automatización de cotizaciones',
}

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
