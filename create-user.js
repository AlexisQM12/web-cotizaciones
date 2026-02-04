import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create default user
    const user = await prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            email: 'default@system.com',
            name: 'Usuario Sistema',
            password: 'none',
            role: 'admin',
        },
    });

    console.log('Default user created:', user);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
