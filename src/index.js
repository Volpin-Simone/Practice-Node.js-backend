import dotenv from "dotenv";
import app from "./app.js";
import "./config/env.js";



dotenv.config();


const PORT = process.env.PORT || 8000;


app.listen(PORT, () => 
    {
        console.log(`Server running on port ${PORT}`);
    });
