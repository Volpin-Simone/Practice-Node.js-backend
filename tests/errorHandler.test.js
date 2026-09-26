import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { NotFoundError } from "../src/errors/NotFoundError.js";
import { validateBody } from "../src/middleware/validation/validate.js";



function createMockRes()
{
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}



describe("errorHandler", () =>
{
    it("exposes the real status and message for a known AppError", () =>
    {
        const res = createMockRes();

        errorHandler(new NotFoundError("User was not found"), {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User was not found" });
    });

    it("hides the real message and falls back to a generic 500 for an unexpected error", () =>
    {
        const res = createMockRes();

        errorHandler(new TypeError("Cannot read properties of undefined"), {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});


// handing Zod something that isn't a ZodError
describe("validate", () =>
{
    it("re-throws an error unchanged when it isn't a ZodError", () =>
    {
        const brokenSchema = {
            parse: () => { throw new Error("Schema itself is broken"); }
        };

        const middleware = validateBody(brokenSchema);

        expect(() => middleware({ body: {} }, {}, vi.fn())).toThrow("Schema itself is broken");
    });
});