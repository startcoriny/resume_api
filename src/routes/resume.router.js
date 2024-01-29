import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();
/** 이력서 생성 **/
// 사용자(Users)는 여러개의 이력서(resume)을 등록
// 조건에 따라 사용자와 1:N의 관계를 가지고, 현재 로그인 한 사용자의 정보가 존재하였을 때만 이력서를 생성
router.post("/resume", authMiddleware, async (req, res, next) => {
  const { userId } = req.user; // 사용자 인증 미들웨어(authMiddleware)를 통해 클라이언트가 로그인된 사용자인지 검증
  const { title, context } = req.body;

  const resume = await prisma.resume.create({
    data: {
      userId: +userId,
      title,
      context,
    },
  });

  return res.status(201).json({ data: resume });
});

/** 이력서 목록 조회 API **/
router.get("/resume", async (req, res, next) => {
  const { orderkey, orderValue } = req.query;
  console.log("orderkey, orderValue => " + orderkey, orderValue);

  if (!orderValue || (orderValue !== "asc" && orderValue !== "desc")) {
    orderValue = "desc";
  }
  const resume = await prisma.resume.findMany({
    where: {
      userId: +orderkey,
    },
    select: {
      resumeId: true,
      title: true,
      context: true,
      user: {
        // user 필드를 선택하여 사용자 정보에 접근합니다.
        select: {
          userName: true, // userName 필드를 선택하여 사용자 이름을 추출합니다.
        },
      },
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: orderValue, // 이력서를 최신순으로 정렬합니다.
    },
  });

  return res.status(200).json({ data: resume });
});

/** 게시글 상세 조회 API **/
router.get("/resume/:resumeId", async (req, res, next) => {
  const { resumeId } = req.params;
  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
    select: {
      resumeId: true,
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

/** 이력서 수정 **/
router.patch("/resume/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.userId;
  const { title, context, status } = req.body;

  console.log("patch들어옴");
  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
  });
  console.log("patch들어옴");
  // 선택한 이력서가 존재하지 않을 경우, 메세지반환
  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  // 수정할 이력서 정보는 본인이 작성한 이력서에 대해서만 수정.
  if (userId !== resume.userId) {
    return res
      .status(400)
      .json({ message: "본인이 작성한 이력서가 아닙니다." });
  }

  // 검증이 끝난뒤 업데이트
  await prisma.resume.update({
    where: {
      resumeId: +resumeId,
    },
    data: {
      title,
      context,
      status,
    },
  });

  return res.status(201).json({ message: "수정이 완료되었습니다." });
});

/** 이력서 삭제 **/

router.delete("/resume/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.userId;

  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
  });

  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  if (userId !== resume.userId) {
    return res.status(401).json({ message: "삭제할수 있는 권한이 없습니다." });
  }

  await prisma.resume.delete({
    where: {
      resumeId: +resumeId,
    },
  });
  return res.status(200).json({ message: "삭제가 완료되었습니다." });
});

export default router;
