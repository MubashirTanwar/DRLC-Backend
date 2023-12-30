import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN

}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())
 
// U S E R    R O U T E S 
import { router } from "./routes/student.routes.js"
app.use("/api/v1/student", router)

// A D M I N    R O U T E S 
import { adminRouter } from "./routes/admin.routes.js";
app.use("/api/v1/admin", adminRouter)





export default app