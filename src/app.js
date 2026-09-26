import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import userRoutes from "./features/users/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./authentication/auth.routes.js";
import healthRoutes from "./health/health.routes.js";
import cors from "cors";




const app = express();




app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());


app.use("/health", healthRoutes);

app.use(requestLogger);

app.use("/users", userRoutes);

app.use("/auth", authRoutes);




app.use(errorHandler);



export default app;