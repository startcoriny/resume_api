import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/*
관리자 정보
관리자 이메일 : 0000
관리자 비밀번호 : 121212
*/

/** -------------------------------- 관리자 이력서 조회 -------------------------------------- **/
router.get("/adminResumes", authMiddleware, async (req, res, next) => {
  let { orderValue } = req.query;
  const role = req.user.role;

  if (!(role === "ADMIN")) {
    return res.status(400).json({ message: "권한이 존재하지 않습니다. 관리자가 아닙니다." });
  }

  if (!orderValue || (orderValue.toLowerCase() !== "asc" && orderValue.toLowerCase() !== "desc")) {
    orderValue = "desc";
  }

  const resume = await prisma.resume.findMany({
    select: {
      id: true,
      title: true,
      context: true,
      user: {
        select: {
          userName: true,
        },
      },
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: orderValue.toLowerCase(),
    },
  });

  return res.status(200).json({ data: resume });
});

/** ---------------------------------------- 관리자 수정 ---------------------------------------------- **/
router.patch("/adminResumes/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const { status } = req.body;
  const role = req.user.role;

  const resume = await prisma.resume.findFirst({
    where: {
      id: +resumeId,
    },
  });

  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  if (!(role === "ADMIN")) {
    return res.status(400).json({ message: "권한이 존재하지 않습니다." });
  }

  await prisma.resume.update({
    where: {
      id: +resumeId,
    },
    data: {
      status,
    },
  });
  return res.status(201).json({ message: "상태수정이 완료되었습니다." });
});

export default router;
