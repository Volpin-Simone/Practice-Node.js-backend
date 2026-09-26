import { Router } from 'express';
import * as userController from "./user.controller.js";
import * as userValidation from "../../middleware/validation/validate.js";
import {
    userIdSchema,
    createUserSchema,
    updateProfileSchema,
    changePasswordSchema
} from "./user.validationSchema.js";
import { authenticate } from "../../authentication/auth.middleware.js";
import { requireRole } from "../../authentication/auth.middleware.js";
import { changePasswordLimiter } from "../../middleware/rateLimiters.js";






const router = Router();


router.get
(
    "/",
    authenticate,
    userController.getAllUsers
);


router.get
(
    "/:userId",
    authenticate,
    requireRole("ADMIN"),
    userValidation.validateParams(userIdSchema),
    userController.lookupUserById
);





router.post
(
    "/",
    userValidation.validateBody(createUserSchema),
    userController.createUser
);



router.put
(
    "/me",
    authenticate,
    userValidation.validateBody(updateProfileSchema),
    userController.updateProfile
);



router.patch
(
    "/me/password",
    changePasswordLimiter,
    authenticate,
    userValidation.validateBody(changePasswordSchema),
    userController.changePassword
);


router.delete
(
    "/me",
    authenticate,
    userController.deleteUser
);



export default router;