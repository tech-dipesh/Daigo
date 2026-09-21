import "dotenv/config"
import { PrismaClient } from '@/generated/prisma/client';

const prismaClientSingleton = () => {
	return new PrismaClient({
		// Fix 1: Use 'datasourceUrl' instead of the nested 'datasources' object
		datasourceUrl: process.env.DATABASE_PASSWORD,
	});
};
declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;