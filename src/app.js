import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

const corsConfig = {
    credentials: true,
    origin: "http://localhost:5173",
};
app.options("*", cors(corsConfig));
app.use(cors(corsConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// U S E R    R O U T E S
import { router } from "./routes/student.routes.js";
app.use("/api/v1/student", router);

// A D M I N    R O U T E S
import { adminRouter } from "./routes/admin.routes.js";
app.use("/api/v1/admin", adminRouter);

//F I L E      R O U T E S
import { fileRouter } from "./routes/file.routes.js";
app.use("/api/v1/file", fileRouter);

export default app;
