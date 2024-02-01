import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger-output.json" with { type: "json" };
import LogMiddleware from "./src/middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import UserLouter from "./src/routes/user.router.js";
import ResumeLouter from "./src/routes/resume.router.js";
import AdminLouter from "./src/routes/admin.router.js";

// .env 파일을 읽어서 process.env에 추가합니다.
dotenv.config();

const app = express();
const PORT = 3000;
app.get("/", (req, res) => {
  return res.status(200).json({ message: "안녕" });
});
app.use(LogMiddleware); // 로그 미들웨어
app.use(express.json());
app.use(cookieParser());
app.use("/api", [UserLouter, ResumeLouter, AdminLouter]);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile)); // docs 대신 swagger로
app.use(ErrorHandlingMiddleware); // error 미들웨어

app.listen(PORT, () => {
  console.log(PORT + "포트로 서버가 시작되었습니다.");
});
