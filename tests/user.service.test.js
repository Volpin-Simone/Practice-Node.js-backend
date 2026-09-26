import { describe, it, expect, vi } from "vitest";

vi.mock("../src/config/prisma.js", () => ({
    default: { user: { delete: vi.fn() } }
}));

import prisma from "../src/config/prisma.js";
import { deleteUser } from "../src/features/users/user.service.js";
import { NotFoundError } from "../src/errors/NotFoundError.js";



// this is standalone because we're breaking our database on command, which isn't a reasonable thing to engineer through Supertest. "vi.mock("../src/config/prisma.js", ...)"" doesn't scope itself to the one test or describe block it sits inside — Vitest hoists it and applies it to every import of that path anywhere in the file, for the entire file's run. users.test.js already has import prisma from "../src/config/prisma.js" at the top, used for real, against your real test database, by dozens of other tests. If you add that "vi.mock(...)"" call anywhere in that same file, it silently swaps every one of those real imports for the fake "{ user: { delete: vi.fn() } }"" object too — so the moment any other test tries 'prisma.user.create' or 'prisma.session.findMany' during a real request, it hits undefined and the whole suite collapses

describe("deleteUser", () =>
{
    it("throws NotFoundError when Prisma reports the record doesn't exist", async () =>
    {
        prisma.user.delete.mockRejectedValueOnce({ code: "P2025" });

        await expect(deleteUser(999)).rejects.toThrow(NotFoundError);
    });

    it("re-throws any other Prisma error unchanged", async () =>
    {
        const dbError = new Error("Connection lost");
        prisma.user.delete.mockRejectedValueOnce(dbError);

        await expect(deleteUser(1)).rejects.toBe(dbError);
    });
});