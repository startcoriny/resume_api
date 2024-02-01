import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();
/** ------------------------------ 이력서 생성 ---------------------------------- **/
router.post("/resume", authMiddleware, async (req, res, next) => {
  const { userId } = req.user; // 사용자 인증 미들웨어(authMiddleware)를 통해 클라이언트가 로그인된 사용자인지 검증
  const { title, context } = req.body;

  await prisma.resume.create({
    data: {
      userId: +userId,
      title,
      context,
    },
  });

  // status 200상태(OK : 서버가 요청을 성공적으로 처리)로 return
  return res.status(200).json({ message: "이력서 생성이 완료되었습니다." });
});

/** -------------------------- 이력서 목록 조회 ------------------------------------ **/
router.get("/resume", async (req, res, next) => {
  // 쿼리 형태로 전달된 orderkey와 orderValue를 구조분해할당.
  let { orderKey, orderValue } = req.query;

  // userId가 없거나 비어있으면 0으로 초기화
  if (!orderValue || orderKey === "") {
    orderKey = "0";
  }

  // 쿼리 형태로 전달된 ordervalue 초기화 안되어 있거나 정렬문자열이아니라면 desc로 초기화 시키기
  if (!orderValue || (orderValue.toLowerCase() !== "asc" && orderValue.toLowerCase() !== "desc")) {
    orderValue = "desc";
  }

  // orderKey, ordervalue를 사용하여 관련된 모든 정보 꺼내오기
  const resume = await prisma.resume.findMany({
    where: {
      userId: +orderKey,
    },
    select: {
      resumeId: true,
      title: true,
      context: true,
      // user 필드를 선택하여 사용자 정보에 접근.(join)
      user: {
        select: {
          userName: true, // user의 userName 필드를 선택하여 사용자 이름을 추출합니다.
        },
      },
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: orderValue.toLowerCase(), // orderValue를 소문자변환합니다.
    },
  });

  // status 200상태(OK : 서버가 요청을 성공적으로 처리)로 return
  return res.status(200).json({ data: resume });
});

/** ------------------------------- 이력서 상세 조회 ----------------------------- **/
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

  // status 200상태(OK : 서버가 요청을 성공적으로 처리)로 return
  return res.status(200).json({ data: resume });
});

/** ---------------------------- 이력서 수정 ------------------------------ **/
router.patch("/resume/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.userId;
  const { title, context, status } = req.body;

  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
  });
  // 선택한 이력서가 존재하지 않을 경우, 메세지반환
  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  // 수정할 이력서 정보는 본인이 작성한 이력서에 대해서만 수정.
  if (userId !== resume.userId) {
    console.log("본인이 작성한 이력서가 아닙니다.");
    return res.status(400).json({ message: "본인이 작성한 이력서가 아닙니다." });
  }

  // 검증이 끝난뒤 일반 회원일때 업데이트
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

  // status 201상태(Created : 요청이 처리되어서 새로운 리소스가 생성)로 return
  return res.status(201).json({ message: "수정이 완료되었습니다." });
});

/** ------------------ 이력서 삭제 ------------------------ **/
router.delete("/resume/:resumeId", authMiddleware, async (req, res) => {
  // 삭제할 이력서 번호
  const { resumeId } = req.params;

  // 삭세할 이력서 본인인증
  const userId = req.user.userId;

  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
  });

  // 이력서가 존재하지 않는다면 에러 반환
  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  // 본인이 맞지 않다면 에러반환
  if (userId !== resume.userId) {
    return res.status(401).json({ message: "삭제할수 있는 권한이 없습니다." });
  }

  // 해당 이력서 삭제
  await prisma.resume.delete({
    where: {
      resumeId: +resumeId,
    },
  });

  // status 200상태(OK : 서버가 요청을 성공적으로 처리)로 return
  return res.status(200).json({ message: "삭제가 완료되었습니다." });
});

export default router;
