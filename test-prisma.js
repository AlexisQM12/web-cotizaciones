import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('🔍 Probando conexión a Prisma...');

        // Test connection
        const users = await prisma.user.findMany();
        console.log('✅ Usuarios encontrados:', users.length);
        console.log('👤 Usuarios:', users);

        // Test quotations
        const quotations = await prisma.quotation.findMany();
        console.log('📋 Cotizaciones encontradas:', quotations.length);

        console.log('✅ Prisma funciona correctamente!');
    } catch (error) {
        console.error('❌ Error de Prisma:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
