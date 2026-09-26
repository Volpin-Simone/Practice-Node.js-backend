import { z } from "zod";






const loginSchema = z.object(
{
    email: z.email(),
    password: z.string({ error: "Password must be a string" })
});
// for the password it would also make sense to validate max and min lengths. However, we're intentionally leaving password validation minimal because say 5 years ago our min length was 4 characters. An old user tries to log into their account, and while the password is correct they get rejected at validation because our min length policies have changed. We've now locked a user out of their account. So the best thing is to keep password validation minimal



const refreshSchema = z.object(
    {
        refreshToken: 
            z
            .string({ error: "Refresh token must be a string" })
            .min(1, 
                {
                    error: "Refresh token is required"
                }

        )
    });
// we're staying consistent with naming across layers and calling this property 'refreshToken' like in out HTTP request, like in our service






export {
    loginSchema,
    refreshSchema
};