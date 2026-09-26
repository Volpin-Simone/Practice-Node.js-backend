import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";








describe("Health API", () =>
{
    // 1.  liveness works
    it("should return a live status", async () =>
    {
        const response = await request(app)
            .get("/health/live");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "live"
        });
    });




    // 2.  readiness when the database is healthy
    it("should return a ready status when the database is available", async () =>
    {
        const response = await request(app)
            .get("/health/ready");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ready"
        });
    });





    // 3.  readiness when the database is unavailable
    it("should return an unhealthy status when the database is unavailable", async () =>
    {
        const querySpy = vi
            .spyOn(prisma, "$queryRaw")
            .mockRejectedValueOnce(new Error("Database unavailable"));      // here we're telling Vitest: "for this particular call, pretend Prisma's DB query failed"

        const response = await request(app)
            .get("/health/ready");

        expect(response.status).toBe(503);
        expect(response.body).toEqual({
            message: "Database is unavailable"
        });

        querySpy.mockRestore();
    });
    
});