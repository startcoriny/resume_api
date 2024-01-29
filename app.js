import express from "express";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(PORT + "포트로 서버가 시작되었습니다.");
});
