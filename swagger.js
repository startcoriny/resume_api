import { createRequire } from "module";
const require = createRequire(import.meta.url);

const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "54.180.121.240/:3007",
  schemes: ["https"],
};
// 경로 = localhost:3007/swagger
const outputFile = "./swagger-output.json"; // swagger-autogen이 실행 후 생성될 파일 위치와 이름
const endpointsFiles = ["./app.js"]; //읽어올 Router가 정의되어 있는 js파일들

swaggerAutogen(outputFile, endpointsFiles, doc);
