"use strict";
const chevrotain = require("chevrotain");
const { stylesDotJavaTokens, baseStyleCallTokens } = require("./tokens");

const Parser = chevrotain.Parser;

class JavaStylesParser extends chevrotain.Parser {
  constructor(input) {
    super(input, allTokens, { outputCst: true });
  }
}
