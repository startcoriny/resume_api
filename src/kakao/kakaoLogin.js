import dotenv from "dotenv";
dotenv.config();

export const startKakaoLogin = (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/authorize"; // 인가 받는 베이스 url
  const config = {
    client_id: "104390bfe78a47ca4eb5921507bc127f", //REST API키
    redirect_uri: "http://localhost:3000/api/kakao/finish", // Redirect URI경로
    response_type: "code",
  };
  const params = new URLSearchParams(config).toString();
  // URLSearchParams 메서드는 객체에 나눠져 있는 문자열을 URL 처럼 합쳐준다.
  // 오브젝트로 반환되기 때문에 toString()메서드를 사용하여 문자열로 바꿔줌
  // 최종 요청해야하는 URL
  // https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}

  const finalUrl = `${baseUrl}?${params}`; // 최종 생성되는 URL
  console.log(finalUrl);
  return res.redirect(finalUrl);
};

// 토큰발급 및 로그인
export const finishKakaoLogin = async (req, res) => {
  const baseUrl = "https://kauth.kakao.com/oauth/token"; // 토큰 받는 베이스 url
  const config = {
    client_id: process.env.KAKAO_CLIENT, // //REST API키
    client_secret: process.env.KAKAO_SECRET, // 카카오에서 받은 secret 키, 토큰 발급 시, 보안을 강화하기 위해 추가 확인하는 코드
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:3000/api/kakao/finish", // 토큰을 받은뒤 리 다이렉트할 URI
    code: req.query.code, // startKakaoLogin이 끝나면 code=~~로 쿼리스트링으로 문자열이 들어옴.
  };

  const params = new URLSearchParams(config).toString(); // 마찬가지로 config를 한 url로 설정해준다.
  const finalUrl = `${baseUrl}?${params}`;
  // node.js에서는 fetch를 지원하지 않기 때문에 node-fetch를 install해야함.
  const kakaoTokenRequest = await (
    await fetch(finalUrl, {
      method: "POST", // 토큰을 받는것이기 때문에 post
      headers: {
        "Content-type": "application/json", // 이 부분을 명시하지않으면 text로 응답을 받게됨
      },
    })
  ).json();
  /** 토큰 받아온 것 확인하는 코드 위에 await().json()을 제거해주고 확인바람 **/
  //   const json = await kakaoTokenRequest.json();
  //   console.log(json);
  //   res.send(JSON.stringify(json)); // 프론트엔드에서 확인하려고

  if ("access_token" in kakaoTokenRequest) {
    // kakaoTokenRequest안에 access_Token이 있다면?
    // api진입
    const { access_token } = kakaoTokenRequest;
    const userRequest = await (
      await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${access_token}`, // 토큰 생성
          "Content-type": "application/json",
        },
      })
    ).json();
    console.log(userRequest);
  } else {
    // access 토큰이 없다면 로그인
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
};
