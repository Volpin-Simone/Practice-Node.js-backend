import { AppError } from "./AppError.js";



class UnhealthyError extends AppError
{
    constructor(message)
    {
        super(message, 503)
    }
}


export { UnhealthyError };