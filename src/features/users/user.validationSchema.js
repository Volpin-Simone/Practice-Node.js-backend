import { z } from "zod";
import {
    USER_RULES,
    PASSWORD_RULES,
    isNotNumbersOnly,
    containsNoNumbers
} from "./user.rules.js";






// schema factories to avoid repetition of whole code blocks

const nameHelper = () =>
    z
    .string(
        {
            error: "Name must be a string"
        })
    .trim()
    .min(USER_RULES.NAME.MIN,
        {
            error: `Name must be at least ${USER_RULES.NAME.MIN} characters long`
        })
    .max(USER_RULES.NAME.MAX,
        { 
            error: `Name can only be a maximum of ${USER_RULES.NAME.MAX} characters long` 
        })
    .refine(isNotNumbersOnly,
        {
            error: "Name cannot consist entirely of numbers"
        })



const petHelper = () =>
    z
    .string(
        {
            error: "Pet name must be a string"
        })
    .trim()
    .min(USER_RULES.PET.MIN,
        {
            error: `Pet name must be at least ${USER_RULES.PET.MIN} characters long`
        })
    .max(USER_RULES.PET.MAX,
        { 
            error: `Pet name can only be a maximum of ${USER_RULES.PET.MAX} characters long` 
        })
    .refine(containsNoNumbers,
        {
            error: "Pet name cannot contain numbers"
        })
// since '.optional()' is used in all our 'pet' schemas anyway, we *could* add that here in the helper - but it *does* potentially make the helper less reusable, so juuust in case it *is* smarter to omit '.optional()'


const passwordHelper = () =>
    z
    .string(
        {
            error: "Password must be a string"
        })
    .min(PASSWORD_RULES.MIN,
        {
            error: `Password must be at least ${PASSWORD_RULES.MIN} characters long`
        })
    .max(PASSWORD_RULES.MAX,
        { 
            error: `Password can only be a maximum of ${PASSWORD_RULES.MAX} characters long` 
        })







// validation schemas

const userIdSchema = z.object(
{
    userId: z.coerce.number(
                    {
                        error: "User Id must be a number"
                    })
                    .int(
                    {
                        error: "User Id must be an integer"
                    })
                    .positive(
                    {
                        error: "User Id must be a positive integer"
                    })
});



const createUserSchema = z.object(
{
    name: nameHelper(),

    email: z.email({ error: "Enter a valid email address" }),


    password: passwordHelper(),


    pet: petHelper() .optional()
});



const updateProfileSchema = z.object(
{
    name: nameHelper() .optional(),

    email: z.email({ error: "Enter a valid email address" }) .optional(),

    pet: petHelper() .optional()
});



const changePasswordSchema = z.object(
{
    currentPassword: 
        z
        .string(
            {
                error: "Current password must be a string"
            })
        .min(1,
            {
                error: "Current password is required"
            }),

    newPassword: passwordHelper()
});









export {
    userIdSchema,
    createUserSchema,
    updateProfileSchema,
    changePasswordSchema
};
