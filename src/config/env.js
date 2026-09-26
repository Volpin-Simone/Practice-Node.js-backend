

const requiredEnvVars = 
[
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRES_IN",
    "SESSION_DURATION_DAYS",
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_USER",
    "DATABASE_NAME"
];



for(const variable of requiredEnvVars)
{
    if(!process.env[variable])
    {
        throw new Error(`Missing required environment variable: ${variable}`);
    }
}
// there's a good reason we're using a standard Error class and not a custom one: our custom error classes represent HTTP/application operations (look at the code, look at what they do), whereas this failure is happening before your application is even serving requests. This is a startup failure, not a request failure. Like, if this happens, 'app.listen()' isn't even reached, we're not even handling requests