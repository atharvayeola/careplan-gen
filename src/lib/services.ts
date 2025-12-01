import { prisma } from './prisma';

export async function checkProvider(npi: string) {
    const existing = await prisma.provider.findUnique({
        where: { npi },
    });
    return existing;
}

export async function createProvider(data: { npi: string; name: string }) {
    return prisma.provider.create({
        data,
    });
}

export async function checkPatient(mrn: string) {
    const existing = await prisma.patient.findUnique({
        where: { mrn },
    });
    return existing;
}

export async function createPatient(data: any) {
    return prisma.patient.create({
        data: {
            ...data,
            dob: new Date(data.dob),
        },
    });
}

export async function checkDuplicateOrder(patientId: string, medication: string) {
    const existing = await prisma.order.findFirst({
        where: {
            patientId,
            medication: {
                equals: medication,
                mode: 'insensitive',
            },
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Check last 24 hours
            },
        },
    });
    return existing;
}

export async function createOrder(data: any) {
    return prisma.order.create({
        data,
    });
}
