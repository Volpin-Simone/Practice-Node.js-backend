import { rateLimit } from "express-rate-limit";






const loginLimiter = rateLimit(
{
    windowMs: 30 * 60 * 1000,

    limit: process.env.NODE_ENV === "test" ? 100 : 5,

    standardHeaders: "draft-8",

    legacyHeaders: false
});





const changePasswordLimiter = rateLimit(
{
    windowMs: 30 * 60 * 1000,

    limit: process.env.NODE_ENV === "test" ? 100 : 5,

    standardHeaders: "draft-8",

    legacyHeaders: false
});




const refreshLimiter = rateLimit(
{
    windowMs:  30 * 60 * 1000,
    
    limit: process.env.NODE_ENV === "test" ? 100 : 5,

    standardHeaders: "draft-8",

    legacyHeaders: false
});








export {
    loginLimiter,
    changePasswordLimiter,
    refreshLimiter
};