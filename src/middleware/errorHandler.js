import { AppError } from "../errors/AppError.js";



const errorHandler = (err, req, res, next) =>
{
    console.error(err);

    if(err instanceof AppError)
    {

        const response = 
        {
            message: err.message
        };


        if(err.details)
        {
            response.details = err.details;
        }


        return res.status(err.statusCode).json(response);
    }


    res.status(500).json({ message: "Internal server error" });

};




export { errorHandler };