import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";







// This is standalone because 'vi.resetModules()' clears Vitest's entire module cache for that file — not just 'rateLimiters.js' - so any dynamic import() anywhere after that call, in that same file, gets a fresh copy of whatever it asks for. In this specific test it happens to be safe, because it only re-imports 'rateLimiters.js' in isolation and never touches 'app.js' again. But that safety is fragile - it depends on nobody else in that file later adding another dynamic import that assumes a clean, untouched module cache. Given 'vi.resetModules()' is a file-wide, blunt instrument, the safer habit is to keep anything that calls it walled off in its own file

describe("loginLimiter outside test mode", () =>
{
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() =>
    {
        process.env.NODE_ENV = originalNodeEnv;
    });

    it("blocks the 6th login attempt within the window when NODE_ENV isn't 'test'", async () =>
    {
        process.env.NODE_ENV = "production";
        vi.resetModules();                                   // forces a fresh copy of rateLimiters.js to be loaded next

        const { loginLimiter } = await import("../src/middleware/rateLimiters.js");

        const testApp = express();                            // an isolated mini-app, not the real one - no DB, no other routes involved
        testApp.use(loginLimiter);
        testApp.get("/", (req, res) => res.status(200).send("ok"));

        for (let i = 0; i < 5; i++)
        {
            const response = await request(testApp).get("/");
            expect(response.status).toBe(200);
        }

        const sixthResponse = await request(testApp).get("/");
        expect(sixthResponse.status).toBe(429);
    });
});