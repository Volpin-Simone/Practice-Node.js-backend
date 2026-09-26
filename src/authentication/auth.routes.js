import * as authController from "./auth.controller.js";
import * as userValidation from "../middleware/validation/validate.js";
import { loginSchema, refreshSchema } from "./auth.validationSchema.js";
import { Router } from "express";
import { loginLimiter, refreshLimiter } from "../middleware/rateLimiters.js";





const router = Router();



router.post
(
    "/login",
    loginLimiter,
    userValidation.validateBody(loginSchema),
    authController.login
);


router.post
(
    "/refresh",
    refreshLimiter,
    userValidation.validateBody(refreshSchema),
    authController.refresh
);



export default router;