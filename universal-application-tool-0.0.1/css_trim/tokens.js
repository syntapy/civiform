"use strict";
const chevrotain = require('chevrotain');
const xregexp = require("xregexp");

const Lexer = chevrotain.Lexer;
const createToken = chevrotain.createToken;

function MAKE_PATTERN(def, flags) {
  return xregexp.build(def, fragments, flags);
}

const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_\\$][a-zA-Z_\\$0-9]*/
});

function createKeywordToken(options) {
  // A keyword 'like' token uses the "longer_alt" config option
  // to resolve ambiguities, see: http://sap.github.io/chevrotain/docs/features/token_alternative_matches.html
  options.longer_alt = Identifier;
  return createToken(options);
}

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const LineBreak = createToken({
  name: "Linebreak",
  pattern: /\n/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const Public = createToken({
  name: "Public",
  pattern: /public/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'public'"
});

const Static = createToken({
  name: "Static",
  pattern: /static/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'static'"
});

const Final = createToken({
  name: "Final",
  pattern: /final/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'final'"
});

const Class = createToken({
  name: "Class",
  pattern: /class/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'class'"
});

const StringType = createToken({
  name: "String",
  pattern: /String/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'string'"
});

const StyleClass = createToken({
  name: "StyleClass",
  pattern: /Styles/,
  longer_alt: Identifier,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'StyleClass'"
});

const StyleIdentifier = createToken({
  name: "StyleIdentifier",
  pattern: /[A-Z0-9_]+/,
  longer_alt: Identifier,
  label: "'StyleIdentifier'"
});

const Equals = createToken({
  name: "Equals",
  pattern: /=/,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'='"
});

const Dot = createToken({
  name: "Dot",
  pattern: /\./,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'.'"
});

const StyleLiteral = createToken({
  name: "StyleLiteral",
  //group: chevrotain.Lexer.SKIPPED,
  pattern: /"[a-z0-9-/]+"/,
  longer_alt: Identifier,
});

const QuoteMark = createToken({
  name: "QuoteMark",
  pattern: /"/,
});

const LCurly = createToken({
  name: "LCurly",
  // using a string literal to get around a bug in regexp-to-ast
  // so lexer optimizations can be enabled.
  pattern: "{",
  //group: chevrotain.Lexer.SKIPPED,
  label: "'{'"
});

const RCurly = createToken({
  name: "RCurly",
  pattern: /}/,
  //group: chevrotain.Lexer.SKIPPED,
  label: "'}'"
});

const LPar = createToken({
  name: "LPar",
  pattern: /\(/,
  label: "'('"
});

const RPar = createToken({
  name: "RPar",
  pattern: /\)/,
  label: "')'"
});

const LBracket = createToken({
  name: "LBracket",
  pattern: /\[/,
  label: "'['"
});

const RBracket = createToken({
  name: "RBracket",
  pattern: /\]/,
  label: "']'"
});

const LineComment = createToken({
  name: "LineComment",
  pattern: /\/\/+.*/,
  //pattern: /\/\/[^\n\r]*((\n|[\r][^\n]|\r\n)s*){2,}/,
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: false,
  label: "'//'"
});

const SemiColon = createToken({
  name: "SemiColon",
  pattern: /;/,
  //group: chevrotain.Lexer.SKIPPED,
  label: "';'"
});

const Comma = createToken({
  name: "Comma",
  pattern: /,/,
  label: "','"
});

const At = createToken({
  name: "At",
  pattern: /@/,
  label: "'@'"
});

const Select = createToken({
  name: "Select",
  pattern: /SELECT/,
  longer_alt: Identifier
});

const Other = createToken({
  name: "Other",
  pattern: /.+/,
  //group: chevrotain.Lexer.SKIPPED,
  line_breaks: false
});

const OtherSkip = createToken({
  name: "Other",
  pattern: /[a-zA-Z0-9_/\\()\[\]]+/,
  //group: chevrotain.Lexer.SKIPPED,
  line_breaks: true
});

const EnterComment = createToken({
  name: "EnterComment",
  pattern: /\/\*/,
  push_mode: "comment_mode",
  group: chevrotain.Lexer.SKIPPED,
  line_breaks: true,
});

const ExitComment = createToken({
  name: "ExitComment",
  pattern: /\*\//,
  group: chevrotain.Lexer.SKIPPED,
  pop_mode: true
});

// For lexing the Styles.java file
const stylesDotJavaTokens = {
  modes: {
    normal_mode: [
      WhiteSpace,
      LineBreak,
      LineComment,
      LCurly,
      RCurly,
      LPar,
      RPar,
      LBracket,
      RBracket,
      At,
      Public,
      Static,
      Final,
      Dot,
      Comma,
      StringType,
      Equals,
      StyleClass,
      StyleIdentifier,
      StyleLiteral,
      Identifier,
      SemiColon,
      EnterComment,
      Other
    ],
    comment_mode: [
      ExitComment,
    ]
  },

  defaultMode: "normal_mode"
}

// For lexing any java file with a call to Styles.XYZ
const baseStyleCallTokens = [
  WhiteSpace,
  StyleClass,
  Dot,
  StyleIdentifier
];

const exampleTokens = require("./sql_example")
module.exports = { stylesDotJavaTokens, exampleTokens };
