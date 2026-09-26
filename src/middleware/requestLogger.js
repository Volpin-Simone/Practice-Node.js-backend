

const requestLogger = (req, res, next) =>
{
    console.log("Logger before next");

    next();

    console.log("Logger after next");
};



export {requestLogger};