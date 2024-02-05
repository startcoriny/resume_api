import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { startKakaoLogin, finishKakaoLogin } from "../kakao/kakaoLogin.js";

const router = express.Router();

router.get("/kakao/start", startKakaoLogin);
router.get("/kakao/finish", finishKakaoLogin);

/** ------------------------ 회원가입 ------------------------------ **/
router.post("/sign-up", async (req, res, next) => {
  try {
    const { email, password, passwordCheck, userName } = req.body;

    const isExistuser = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (isExistuser) {
      return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
    }

    if (password !== passwordCheck || password.length < 6) {
      return res.status(400).json({
        message: "비밀번호의 길이가 짧거나 두 비밀번호가 일치하지 않습니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createduser = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password: hashedPassword,
          userName,
        },
      });

      const userInfo = await tx.users.findFirst({
        where: {
          id: user.id,
        },
        select: {
          id: true,
          email: true,
          userName: true,
        },
      });

      return userInfo;
    });

    return res.status(201).json({ userInfo: createduser });
  } catch (err) {
    next(err);
  }
});

/** ---------------------------------- 로그인 --------------------------------------- **/
router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.users.findFirst({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일 입니다." });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "12h" }
  );

  const reFreshToken = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "168h" }
  );

  await prisma.users.update({
    where: {
      id: user.id,
    },
    data: {
      token: reFreshToken,
    },
  });

  res.cookie("accessToken", `Bearer ${accessToken}`);
  res.cookie("reFreshToken", `Bearer ${reFreshToken}`);

  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});

/** ---------------------- 내정보 조회 --------------------------------- **/
router.post("/myInfo", authMiddleware, async (req, res) => {
  const { id } = req.user;

  const user = await prisma.users.findFirst({
    where: { id: +id },
    select: {
      id: true,
      email: true,
      userName: true,
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
