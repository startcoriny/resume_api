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

  // 쿼리 형태로 전달된 ordervalue 초기화 안되어 있거나 정렬문자열이아니라면 desc로 초기화 시키기
  if (!orderValue || (orderValue.toLowerCase() !== "asc" && orderValue.toLowerCase() !== "desc")) {
    orderValue = "desc";
  }

  // orderKey, ordervalue를 사용하여 관련된 모든 정보 꺼내오기
  const resume = await prisma.resume.findMany({
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
    orderBy: {
      createdAt: orderValue.toLowerCase(), // orderValue를 소문자변환합니다.
    },
  });
  // status 200상태(OK : 서버가 요청을 성공적으로 처리)로 return
  return res.status(200).json({ data: resume });
});

/** ---------------------------------------- 관리자 수정 ---------------------------------------------- **/
router.patch("/adminResumes/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const { status } = req.body;
  const role = req.user.role;

  const resume = await prisma.resume.findFirst({
    where: {
      resumeId: +resumeId,
    },
  });

  // 선택한 이력서가 존재하지 않을 경우, 메세지반환
  if (!resume) {
    return res.status(401).json({ message: "이력서 조회에 실패하였습니다." });
  }

  // 관리자가 아니라면?
  if (!(role === "ADMIN")) {
    return res.status(400).json({ message: "권한이 존재하지 않습니다." });
  }

  //검증이 끝난뒤 관리자일때는 status만 수정가능
  await prisma.resume.update({
    where: {
      resumeId: +resumeId,
    },
    data: {
      status,
    },
  });
  // status 201상태(Created : 요청이 처리되어서 새로운 리소스가 생성)로 return
  return res.status(201).json({ message: "상태수정이 완료되었습니다." });
});

export default router;
