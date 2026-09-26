import { AppError } from "./AppError.js";



class ValidationError extends AppError
{
    constructor(message, details = null)        // "details = null" because details should be allowed to be null so it can work with other non-Zod errors
    {
        super(message, 400);

        this.details = details;
    }
}


export { ValidationError };