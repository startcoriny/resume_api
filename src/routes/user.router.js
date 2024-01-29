import express from "express";

const router = express.Router();

router.get("/test", async (req, res) => {
  return res.status(201).json({ message: "테스트 성공" });
});

export default router;
