// src/middlewares/auth.middleware.js // 사용자 인증 미들웨어

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import dotenv from "dotenv";
dotenv.config();
export default async function (req, res, next) {
  try {
    console.log("인증토큰 들어옴");
    const { authorization } = req.cookies;

    if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    // authorization의 담겨있는 값의 형태가 표준과 일치 하지 않는 경우 에러 던짐
    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decodedToken.userId;

    if (!userId) throw new Error("로그인이 필요합니다.");

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      res.clearCookie("authorization");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    // req.user에 사용자 정보를 저장합니다.
    req.user = user;

    next();
  } catch (error) {
    res.clearCookie("authorization");

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      // 토큰의 유효기간이 지났을 경우
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });

      // 토큰의 검증이 실패한 경우
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
