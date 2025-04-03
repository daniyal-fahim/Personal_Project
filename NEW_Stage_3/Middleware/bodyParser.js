import bodyParser from "body-parser";

const bodyParserMiddleware = [
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true })
];

export default bodyParserMiddleware;
