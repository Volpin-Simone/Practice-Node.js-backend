import { ZodError } from "zod";
import { ValidationError } from "../../errors/ValidationError.js";






const validate = (schema, source) => (req, res, next) =>
{
    try
    {
        const data = schema.parse(req[source]);

        req[source] = data;

        next();
    }
    catch(error)
    {
        if(error instanceof ZodError)
        {
            throw new ValidationError(
                "Request validation failed",
                error.issues
            );
        }

        throw error;
    }
};



const validateBody = (schema) => validate(schema, "body");
const validateParams = (schema) => validate(schema, "params");
const validateQuery = (schema) => validate(schema, "query");








export {
    validateBody,
    validateParams,
    validateQuery
};