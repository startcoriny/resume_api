import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger-output.json" assert { type: "json" };
import LogMiddleware from "./src/middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import UserLouter from "./src/routes/user.router.js";
import ResumeLouter from "./src/routes/resume.router.js";
import AdminLouter from "./src/routes/admin.router.js";

dotenv.config();

const app = express();
const PORT = 3007;
app.get("/", (req, res) => {
  return res.status(200).json({ message: "안녕" });
});
app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use("/api", [UserLouter, ResumeLouter, AdminLouter]);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT + "포트로 서버가 시작되었습니다.");
});
