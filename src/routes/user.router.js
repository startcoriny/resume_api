import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt"; // 단방향 암호화 (비밀번호 암호화)
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 회원가입 **/
router.post("/sign-up", async (req, res, next) => {
  try {
    const { email, password, passwordCheck, userName } = req.body;

    // 해당하는 유저가 있는지 확인
    const isExistuser = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    // 유저가 있으면 메세지와 함께 반환
    if (isExistuser) {
      return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
    }

    // 유저가 없다면 사용자 비밀번호와 비밀번호 확인이 일치하는지, 비밀번호의 최소 길이는 맞췄는지 확인
    if (password !== passwordCheck || password.length < 6) {
      return res.status(400).json({
        message: "비밀번호의 길이가 짧거나 두 비밀번호가 일치하지 않습니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hashedPassword 있는지 확인");
    // 유저 생성
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password: hashedPassword, // 암호화된 비밀번호 저장.
          userName,
        },
      });

      return user;
    });

    return res.status(201).json({ userInfo: [user.email, user.userName] });
  } catch (err) {
    next(err);
  }
});

export default router;
