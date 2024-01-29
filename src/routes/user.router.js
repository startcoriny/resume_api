import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt"; // 단방향 암호화 (비밀번호 암호화)
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/auth.middleware.js";

dotenv.config();
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

/** 로그인 **/
router.post("/sign-in", async (req, res) => {
  // 이메일과 비밀번호로 로그인 요청
  const { email, password } = req.body;

  // 해당 이메일을 가지고 있는 유저가 있는지 검색
  const user = await prisma.users.findFirst({ where: { email } });

  // 없다면 존재하지 않는 이메일입니다.
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일 입니다." });

    // 이메일은 있지만사용자가 입력한 비밀번호와 암호화된 비밀번호가 일치하지 않는다면 에러문구와 함께 return
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  // 이메일과 비밀번호 다 통과가 된다면 토큰 발급
  const token = jwt.sign(
    {
      userId: user.userId, //payLoad에 userId를 인코딩 하여 넣는다
    },
    process.env.JWT_SECRET_KEY, // 지정된 비밀키를 사용하여 토큰을 서명
    { expiresIn: "12h" } // 유효시간 12시간
  );

  res.cookie("authorization", `Bearer ${token}`); // authorization이라는 키에 표준 토큰 형식 값으로 넣는다.
  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});

/** 내정보 조회 **/
router.get("/myInfo", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      userName: true,
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
