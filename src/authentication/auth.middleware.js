import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";






const authenticate = (req, res, next) =>
{
    const authHeaders = req.headers.authorization;

    if((!authHeaders) || (!authHeaders.startsWith("Bearer ")))
    {
        throw new UnauthorizedError("Authentication required");
    }


    // now we need to extract the token for verification, but 'jwt.verify()' only wants 'eyJhb...', so we need to split it and isolate the part we need to use.

    const accessToken = authHeaders.split(" ")[1];         // this becomes: ["Bearer", "abc123"]


    // now we can verify the token, but we also need to consider the case where 'jwt.verify' throws. In this case we actually can't run an 'if' after it to check if something went wrong and throw our own 'UnauthorizedError', because 'jwt.verify' wouldn't return null - it would just throw itself and the function would never reach our 'if'. We must 'try-catch' this to catch jwt.verify's error and translate it into what we want.

    try
    {
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET);        // after verification, payload = {userId: 15, role: "USER"}

        req.user = payload;         // this adds '.user' to 'req'; now anything later in the pipeline where 'authenticate' was used can access 'req.user.userId'

         next();
    }

    catch(error)
    {
        throw new UnauthorizedError("Token is invalid or expired");
    }

};





const requireRole = (...allowedRoles) =>
{
    return (req, res, next) =>
    {
        if(!allowedRoles.includes(req.user.role))
        {
            throw new ForbiddenError("Action not allowed");
        }

        next();
    };
};
// Now. "return (req, res, next)". Notice how "() => {}" is how you create a function. NOT "function = () => {}", JUST "() => {}". And realize that we do not *have* to store a function inside a variable, we could simply create one ad hoc and execute it for that fleeting moment and there it goes. "return (req, res, next)" is a way to say: "I don't need this function inside a variable for later, just return (thus execute) it" 







export {
    authenticate,
    requireRole,
}