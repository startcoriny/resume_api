// 인가 받기
export const startKakaoLogin = (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/authorize"; // 인가 받는 베이스 url
  const config = {
    client_id: process.env.KAKAO_CLIENT, //REST API키
    redirect_uri: process.env.KAKAO_RIDIRECT_URL, // Redirect URI경로
    response_type: "code",
  };
  const params = new URLSearchParams(config).toString();

  const finalUrl = `${baseUrl}?${params}`; // 최종 생성되는 URL
  return res.redirect(finalUrl);
};

// 토큰발급 및 로그인
export const finishKakaoLogin = async (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/token";
  const config = {
    client_id: process.env.KAKAO_CLIENT,
    client_secret: process.env.KAKAO_SECRET,
    grant_type: "authorization_code",
    redirect_uri: process.env.KAKAO_RIDIRECT_URL,
    code: req.query.code,
  };

  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const kakaoTokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
    })
  ).json();

  if ("access_token" in kakaoTokenRequest) {
    const { access_token } = kakaoTokenRequest;
    const userRequest = await (
      await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-type": "application/json",
        },
      })
    ).json();
    return res.status(200).json({ message: userRequest });
  } else {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
};
