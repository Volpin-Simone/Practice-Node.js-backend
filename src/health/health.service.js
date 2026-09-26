import prisma from "../config/prisma.js";
import { UnhealthyError } from "../errors/UnhealthyError.js";



const readinessCheck = async () =>
{
    try
    {
        await prisma.$queryRaw`SELECT 1`;
    }
    catch
    {
        throw new UnhealthyError("Database is unavailable");
    }

    return { status: "ready" }
};




export { readinessCheck };