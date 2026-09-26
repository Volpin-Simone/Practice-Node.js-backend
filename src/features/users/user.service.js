import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { AppError } from "../../errors/AppError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { ForbiddenError } from "../../errors/ForbiddenError.js";



const getAllUsers = () =>
{   
    return prisma.user.findMany(
    {
        select: 
        {
            userId: true,
            name: true
        }
    });
};



const getUserById = async (userId) =>
{
    const foundUser = await prisma.user.findUnique(
        {
            where: { userId }
        });

    if(!foundUser)
    {
        throw new NotFoundError("The user could not be found");
    }

    return foundUser;
};



const findUserById = (userId) =>
{
    const foundUser = prisma.user.findUnique(
    {
        where: { userId}
    });

    return foundUser;

};
// findById versus findByEmail discussion: finding by id is kinda general purpose because it's the canonical identifier of a user; what if the user's email or name was changed? Id always stays the same, it's consistent and reliable; finding by id is generally the one you need. BUT, for a login/registration? You have to check if the user (already) exists; this means you don't even know whether they have an id yet, so you can't find by id! You ask them or the email, and you find by the email they gave you! It's like: "Okay, you wanna login? Tell me your account's email and I'll see if it really exists", then the user gives the email, and your Controller can receive the email, pass it over to the Service, and the Service says: "Alright, time to see if this user gave me working credentials, let's see if this email exists", and so you must find by email, because that's what you got to work with for the check. Think a login, think a reauthentication; you're gonna have to use different 'findBy...' methods depending on what the user is giving you as a key to access a feature (findByEmail, findByVerificationToken). And by the way you'd never 'findByPassword' for like a password change or a password request; you'd compare 'currentPassword' with 'user.passwordHash'


const findUserByEmail = async (email) =>
{
    const foundEmail = await prisma.user.findUnique(
    {
        where: { email } 
    });


    return foundEmail;
};
// initially I had a NotFound error here, but it's actually better *not* to force a throw any time the email isn't found, since that's not necessarily something that should always constitute a throw: the email isn't found, so it's available for sign up, that's actually good. So, it's better to either return the email, or null - and let the caller decide what to do with the result. The broader principle is: "Don't force one business meaning onto a generic lookup function"
// another thing: we actually don't need a Controller for this method - and by extention neither a route for it - because this is just an internal helper used by some services, not necessarily a public API endpoint



const createUser = async (user) =>
{

    const emailExists = await findUserByEmail(user.email);


    if(emailExists)
    {
        throw new ConflictError("Email already exists");        
    }


    const passwordHash = await bcrypt.hash(user.password, 10);


    const createdUser = await prisma.user.create(
        {
            data:
            {
                name: user.name,
                email: user.email,
                passwordHash,
                pet: user.pet
            },

            select:                 // this part is important as, otherwise, we'd be returning the user object *with passwordHash included*. We can't have that.
            {
                userId: true,
                name: true,
                email: true,
                pet: true
            }
        });

    return createdUser;
};
// here we're passing a user object as a parameter, and we could also pass the object as data ("data: user") - but we're making a conscious security choice to define exactly what the user can input for user creation i.e. whitelisting fields (since passing the whole object would also mean stuff like 'userId','createdAt' or 'role' which we do *not* want the user to choose. We can then ignore giving the functionality to choose the other fields because in our Model we've specified they're either chosen by the database/server by default like userId/role, or they can be null). Otherwise, if I *know* 'user' would have already been validated by some validation library, it should be safe to just write "data: user"




const updateProfile = (userId, user) =>
{
    return prisma.user.update(
        {
            where: { userId },

            data: 
            {
                name: user.name,
                email: user.email,
                pet: user.pet
            }
        });
};
// here it's better to pass 'userId' and the 'user' object as two separate parameters as opposed to using destructuring and passing the whole object as basically a single parameter ("({ userId, name, email, password, pet })"). It shouldn't be a safety concern as I obviouly don't pass the id as data, but two separate values like this maps cleaner to the http request being split into requesting the id, and then the body - making it so in the controller I can just pass 'req.userId' and 'req.body' to 'updateUser()' a opposed to having to bundle them together into a variable for 'updateUser()' if I'd passed a single object as an argument



const changePassword = async (userId, currentPassword, newPassword) =>
{
    const foundUser = await getUserById(userId);
    
    const passwordMatch = await bcrypt.compare(currentPassword, foundUser.passwordHash);
    
    if(!passwordMatch)
    {
        throw new UnauthorizedError("Incorrect password");
    }


    const passwordHash = await bcrypt.hash(newPassword, 10);


    return prisma.user.update(
        {
            where: { userId },

            data:
            {
                passwordHash
            }
        });
};





const RECORD_NOT_FOUND = "P2025";       // we keep this here so it's create once on module load, not with every single error

const deleteUser = async (userId) =>
{
    try
    {
        return await prisma.user.delete(
        {
            where: { userId }
        });
    }

    catch(error)
    {
        if(error.code === RECORD_NOT_FOUND)
        {
            throw new NotFoundError("User was not found");
        }

        throw error;     // this is necessary because if the error does not match the code, it would be "swallowed" and nothing would happen
    }                 // it means: "I only know how to translate one specific Prisma error. Everything else should continue bubbling upward"
};
/* at first I had an "if(!removedUser)" that would lead to a 'throw', but 'delete()'can never return 'null', actually; it either returns the deleted record, or throws. Which means my 'if' would never run. We *could* solve that by cleanly finding by id and *then* deleting, but that would be two queries and it opens up the tiny chance of a "Race Condition" (someone deletes the user between the check and the delete).
This means our method becomes asynchronous, because 'delete()' returns a promise (a receipt; if we want the actual result, we need to wait for it) - in order for 'catch' to actually catch the error, it needs to wait for 'delete()' to return the actual result.
Now, we can't just catch any "error"; say the server is offline or something like that - the application would give "Not found", which would be misleading. We need to catch the *specific* Prisma error, and for that we need to consult the documentation and look up the "The requested record doesn't exist" error. 
*/



export {
    getAllUsers,
    getUserById,
    findUserById,
    findUserByEmail,
    createUser,
    updateProfile,
    changePassword,
    deleteUser
};