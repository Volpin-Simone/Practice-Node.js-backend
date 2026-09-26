import { Router } from 'express';
import { readinessCheck, liveCheck } from "./health.controller.js";





const router = Router();


router.get(
    "/live",
    liveCheck
);

router.get(
    "/ready",
    readinessCheck
);



export default router;