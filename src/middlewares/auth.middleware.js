// src/middlewares/auth.middleware.js // 사용자 인증 미들웨어

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import dotenv from "dotenv";
dotenv.config();

export default async function (req, res, next) {
  try {
    let { accessToken, reFreshToken } = req.cookies;

    // accessToken 변수에 할당이유 : access토큰이 없다면 재할당하여 사용하기 위해서.
    // 함수 내에서 전역 + let으로 두었기 때문에 변수가 악용될 위험성 ↑?
    let resetAccess = accessToken;

    // 리프레시토큰이 없다면 에러 던짐
    if (!reFreshToken) {
      throw new Error("토큰이 존재하지 않습니다.");
    }

    // 토큰이 설정되어있는 타입 확인
    const refresh = await tokencheck(reFreshToken);

    // 타입 확인후 토큰을 사용하여 일치하는지 확인
    const isExistToken = await prisma.users.findFirst({
      where: {
        token: refresh,
      },
    });

    // 리프레시토큰은 있지만 access토큰이 없다면 재발급
    if (isExistToken && !accessToken) {
      // refreshToken복호화
      const decodedToken = jwt.verify(refresh, process.env.JWT_SECRET_KEY);

      // refreshToken안의 email을 사용하여 유저 검색
      const email = decodedToken.email;

      const user = await prisma.users.findFirst({
        where: {
          email: email,
        },
        select: {
          userId: true,
        },
      });

      // acceccToken재발급 로직
      accessToken = jwt.sign(
        {
          userId: user.userId, //payLoad에 userId를 인코딩 하여 넣는다
        },
        process.env.JWT_SECRET_KEY, // 지정된 비밀키를 사용하여 토큰을 서명
        { expiresIn: "12h" } // 유효시간 12시간
      );
      res.cookie("accessToken", `Bearer ${accessToken}`); // accessToken키에 표준 토큰 형식 값으로 넣는다.

      // 표준 형태의 토큰을 만들어 accessToken재설정해준다.
      resetAccess = `Bearer ${accessToken}`;
    }

    // accesstoken검증
    const access = tokencheck(resetAccess);

    // 토큰 복호화
    const decodedToken = jwt.verify(access, process.env.JWT_SECRET_KEY);

    // 복호화한 토큰의 id 가져옴.
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    // user가 없다면 토큰을 지우고 에러던짐(탈퇴 했을 경우?)
    if (!user) {
      res.clearCookie("reFreshToken");
      res.clearCookie("accessToken");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    // req.user에 사용자 정보를 저장합니다.
    req.user = user;

    next();
  } catch (error) {
    res.clearCookie("reFreshToken");
    res.clearCookie("accessToken");

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      // 토큰의 유효기간이 지났을 경우
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다. 다시 로그인 해주세요" });

      // 토큰의 검증이 실패한 경우
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });

      default:
        return res.status(401).json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}

// 토큰이 설정되어있는 타입 확인
function tokencheck(tokenKind) {
  const [tokenType, token] = tokenKind.split(" ");

  // authorization의 담겨있는 값의 형태가 표준과 일치 하지 않는 경우 에러 던짐
  if (tokenType !== "Bearer") throw new Error("토큰 타입이 일치하지 않습니다.");
  // 검증이 끝나면 토큰 반환
  else return token;
}
