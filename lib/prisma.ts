import { PrismaClient } from '../lib/generated/prisma'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  var prisma: PrismaClientSingleton | undefined
}

// Initialize Prisma Client if it doesn't exist yet
globalThis.prisma = globalThis.prisma ?? prismaClientSingleton()

// Export the singleton instance
const prisma = globalThis.prisma

if (process.env.NODE_ENV !== 'production') {
  // In development, we keep prisma in the global object to prevent
  // multiple instances during hot reloading
  globalThis.prisma = prisma
}

export default prisma