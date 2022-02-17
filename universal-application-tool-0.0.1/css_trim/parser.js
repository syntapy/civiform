"use strict";
const chevrotain = require("chevrotain");
const stylesDotJavaLexer = require('./lexer');
const stylesDotJavaTokens= require("./tokens");

class StylesDotJavaParser extends chevrotain.CstParser {
  constructor() {
    super(stylesDotJavaLexer);

    const $ = this
  }
}

//const parser = new StylesDotJavaParser();

//function parseInput(inputText) {
//  const lexResult = stylesDotJavaLexer.tokenize(inputText);
//  parser.input = lexResult.tokens;
//}

//module.exports = StylesDotJavaParser;
