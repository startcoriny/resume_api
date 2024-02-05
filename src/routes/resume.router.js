import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** ------------------------------ 이력서 생성 ---------------------------------- **/
router.post("/resume", authMiddleware, async (req, res, next) => {
  const { id } = req.user;
  const { title, context } = req.body;

  await prisma.resume.create({
    data: {
      user_id: +id,
      title,
      context,
    },
  });

  return res.status(200).json({ message: "이력서 생성이 완료되었습니다." });
});

/** -------------------------- 이력서 목록 조회 ------------------------------------ **/
router.get("/resume", async (req, res, next) => {
  let { orderKey, orderValue } = req.query;

  if (!orderValue || orderKey === "") {
    orderKey = "0";
  }

  if (!orderValue || (orderValue.toLowerCase() !== "asc" && orderValue.toLowerCase() !== "desc")) {
    orderValue = "desc";
  }

  const resume = await prisma.resume.findMany({
    where: {
      user_id: +orderKey,
    },
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

/** ------------------------------- 이력서 상세 조회 ----------------------------- **/
router.get("/resume/:resumeId", async (req, res, next) => {
  const { resumeId } = req.params;
  const resume = await prisma.resume.findFirst({
    where: {
      id: +resumeId,
    },
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
  });

  return res.status(200).json({ data: resume });
});

/** ---------------------------- 이력서 수정 ------------------------------ **/
router.patch("/resume/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const id = req.user.id;
  const { title, context, status } = req.body;

  const resume = await prisma.resume.findFirst({
    where: {
      id: +resumeId,
    },
  });
  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  if (id !== resume.user_id) {
    return res.status(400).json({ message: "본인이 작성한 이력서가 아닙니다." });
  }

  await prisma.resume.update({
    where: {
      id: +resumeId,
    },
    data: {
      title,
      context,
      status,
    },
  });

  return res.status(201).json({ message: "수정이 완료되었습니다." });
});

/** ------------------ 이력서 삭제 ------------------------ **/
router.delete("/resume/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;

  const id = req.user.id;

  const resume = await prisma.resume.findFirst({
    where: {
      id: +resumeId,
    },
  });

  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  if (id !== resume.user_id) {
    return res.status(401).json({ message: "삭제할수 있는 권한이 없습니다." });
  }

  await prisma.resume.delete({
    where: {
      id: +resumeId,
    },
  });

  return res.status(200).json({ message: "삭제가 완료되었습니다." });
});

export default router;
