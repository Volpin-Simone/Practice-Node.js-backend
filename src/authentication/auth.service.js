import bcrypt from "bcrypt";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import * as userService from "../features/users/user.service.js";
import jwt from "jsonwebtoken";
import { findUserById } from "../features/users/user.service.js";
import prisma from "../config/prisma.js";



const login = async (email, password) =>
{
    const foundUser = await userService.findUserByEmail(email)

    if(!foundUser)
    {
        throw new UnauthorizedError("Incorrect email or password");
    }


    const passwordMatch = await bcrypt.compare(password, foundUser.passwordHash);

    if(!passwordMatch)
    {
        throw new UnauthorizedError("Incorrect email or password");
    }



    // token creation
    const accessPayload = 
    {
        userId: foundUser.userId,
        role: foundUser.role
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});


    // refresh token creation
    const refreshPayload = 
    {
        userId: foundUser.userId        // better to use a dedicated 'refreshPayload' so we can keep this as lean as it can be (for security purposes of course)
    };

    const refreshToken = jwt.sign(refreshPayload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN});

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create(
    {
        data:
            {
                refreshTokenHash,

                userId: foundUser.userId,

                expiresAt: new Date(
                    Date.now() +
                    Number(process.env.SESSION_DURATION_DAYS) *
                    24 *
                    60 *
                    60 *
                    1000
                )
            }
    });
    // it might seem more sensible to check if a session already exists, create it only if it doesn't, and just update it if it does - but making a new session at every login is better. Yes, it bloats the database, but databases can handle millions and billions of rows - plus it's good for auditing (leaving lots of activity footprints).


    // updating 'lastLogin' now that login was successful
    await prisma.user.update(
    {
        where: 
            {
                userId: foundUser.userId   // we must specify "Update this field using this variable", or it wouldn't know where to take the info from
            },

        data:
            {
                lastLogin: new Date()
            }
    });


    return { accessToken, refreshToken };
    // we're returning a token *object* as opposed to just "return token" because the object is centralized and we'd only need to modify it once
};










const refresh = async (refreshToken) =>     // think about what you're receiving; 'refreshToken' is a string, we can only destructure an object: the decoded payload
{

    // 1. verify refresh token signature; we're doing this in a try-catch because that's the best way to display our own error message for the client

    const verifyRefreshToken = (refreshToken) =>
    {
        try
        {
            return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        }

        catch
        {
            throw new UnauthorizedError("Token invalid or expired");
        }
    }

    const refreshPayload = verifyRefreshToken(refreshToken);
    // we need this because 'verifyRefreshToken' is a function, and we obviously couldn't do 'verifyRefreshToken.userId' - so we need to store the result of this function in a variable we can later call to grab the result of the function inside



    // 2. find the user's active sessions thanks to the payload

    const sessions = await prisma.session.findMany(         // 'findMany()' because a user has multiple sessions, remember?
        {
            where:                                // I guess this is sort of how you concatenate more search criteria like an '&&'? 
            {
                userId: refreshPayload.userId,
                revokedAt: null                  // this actually makes a later check for token revocation (and consequent throw) unnecessary
            } 
        });


    
    // 3. find which session belongs to this refresh token, and throw if none match

    let matchingSession;
    // we need to declare this now as declaring it from inside the loop later will lead to a scope error - and we can't use const here since 'consts' cannot be later reassigned

    for (const session of sessions)
    {
        const tokenMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);

        if(tokenMatch)
        {
            matchingSession = session;
            break;
        }
    }
    // we cannot do this with a simple "if(session.rereshTokenHash === refreshToken)" comparison; we need the bcrypt.compare because 'refreshToken' is the actual refresh token string, whereas refreshTokenHash is the *hashed* version of that string - they obviously couldn't be compared normally

    if(!matchingSession)
    {
        throw new UnauthorizedError("Token invalid or expired");
    }



    // 4. check the database session's expiration (revocation was handled by the above "where: { revokedAt: null }" 

    if(matchingSession.expiresAt < new Date())                  // "new Date()" means "The current date and time at the moment this line executes"
    {
        throw new UnauthorizedError("Session invalid or expired");
    }
    // right now we *are* checking for the expiration of the *session*, which is *not* the same thing as the refresh token's expiration



    /* 5. record that this session was used
       This is useful for showing active sessions to the user, security dashboards, automatically removing very old/inactive sessions, displaying "last active" information */

    await prisma.session.update(
    {
        where:
        {
            sessionId: matchingSession.sessionId
        },

        data:
        {
            lastUsedAt: new Date()
        }
    });



    // 6. issue a new access token

    const foundUser = await findUserById(refreshPayload.userId);    // reminder that 'refreshToken' is a hashed string, it doesn't have 'userId'

    const accessPayload =
    {
        userId: refreshPayload.userId,
        role: foundUser.role
    };
    // the refresh token payload doesn't have 'role', and even if it did I want to abide to the database as the only source of truth; what if the user's assigned role changed in-between tokens?

    const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });



    // 7. return the access token

    return accessToken;
};








export {
    login,
    refresh
}