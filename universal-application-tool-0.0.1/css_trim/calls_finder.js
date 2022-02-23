const parser = require('java-parser')
const traverse = require('./traverse')
var _ = require('lodash')

const PREFIXES = {
  'even':'even',
  'focus':'focus',
  'focusWithin':'focus-within',
  'hover':'hover',
  'disabled':'disabled',
  'resonsiveSmall':'sm',
  'responsiveMedium':'md',
  'responsiveLarge':'lg',
  'responsiveXLarge':'xl',
  'responsive2XLarge':'2xl'
};

class CallsFinder extends parser.BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()

    // Just make sure we're not overwriting anything from super class
    if (_.has(this, 'prefixList')) { throw "CallsFinder already has property 'prefixList'. Use a different property name to hold dictionary of prefix calls." }
    if (_.has(this, 'styleList')) { throw "CallsFinder already has property 'styleList'. Use a different property name to hold dictionary of styles." }
    if (_.has(this, 'styleRegex')) { throw "CallsFinder already has property 'styleRegex'. Use a different property name to hold dictionary of styles." }
    if (_.has(this, 'tagList')) { throw "CallsFinder already has property 'tagList'. Use a different property name to hold dictionary of styles." }
    if (_.has(this, 'styleRegex')) { throw "CallsFinder already has property 'tagRegex'. Use a different property name to hold dictionary of styles." }
    if (_.has(this, '_findCalls')) { throw "CallsFinder already has property '_findCalls'. Use a different property name to hold dictionary of styles." }
    if (_.has(this, '_findTags')) { throw "CallsFinder already has property '_findTags'. Use a different property name to hold dictionary of styles." }

    this.callRegex = /[0-9A-Z_]+/
    this.tagRegex = /[0-6a-z:]+/
    this.styleList = []
    this.tagList = []
    this.validateVisitor()
  }

  // All directly import tags (from e.g. import j2html.TagCreator.<tag>) 
  // will get added to tailwind.css
  packageOrTypeName(ctx) {
    let tag = ""

    try {
      let identifiers = ctx.Identifier

      if (identifiers.length !== 3) { throw "Wrong identifier length. The j2html import we want here has length 3" }
      if (identifiers[0].image !== "j2html") { throw "Not a j2thml import" }
      if (identifiers[1].image !== "TagCreator") { throw "Not the right j2hml tag" }
      if (identifiers[2].image === "each" || identifiers[2].image === "text") { throw "Not an html tag" }

      tag = identifiers[2].image

    } catch (error) {}

    if (typeof(tag) === 'string') {
      if (tag.length > 0) {
        if (this.tagRegex.test(tag) === true) {
          this.tagList.push(tag)
        }
      }
    }
  }

  /* Find calls to Styles.XYZ or BaseStyles.XYZ
   * ctx: Node in the concrete syntax tree
   */
  _findCalls(ctx) {
    let styleCall = ""

    // Errors here will fail silently, thus preventing an invalid style call
    // from being pushed to tailwind
    try {
      let styleClass = traverse.getMethodCallClass(ctx, 0, 0, 0)
      if (styleClass.image !== "Styles" && styleClass.image !== "BaseStyles") {
        throw "not a valid style call"
      }

      let dot = ctx.Dot[0]
      if (dot.image !== ".") {
        throw "not a valid dot token"
      }

      styleCall = traverse.getMethodCall(ctx, 0, 0, 0)
    } catch(error) {}

    if (typeof(styleCall) === 'string') {
      if (styleCall.length > 0) {
        if (this.callRegex.test(styleCall) === true) {
          this.styleList.push(styleCall)
        }
      }
    }
  }

  /* Find html tags
   * ctx: node in the concrete syntax tree
   */
  _findTags(ctx) {
    let tag = ""

    try {
      let libCallNodeMaybe = traverse.getMethodCallClass(ctx, false)

      if (libCallNodeMaybe.image === "TagCreator") {
        let dot = ctx.Dot[0]

        // Get the tag
        let maybeTag = traverse.getCalledIdentifier(ctx, 0, 0, 0, false)
        maybeTag = maybeTag.image

        tag = maybeTag
      }

      if (tag === "each" || tag === "text") {
        tag = ""
        throw "Not an html tag"
      }
    } catch(error) {}

    if (typeof(tag) === 'string') {
      if (tag.length > 0) {
        if (this.tagRegex.test(tag) === true) {
          this.tagList.push(tag)
        }
      }
    }
  }

  // Method name 'fqnOrRefType' matches grammar rule pattern 
  // in java-parser/src/production/expression.js
  //
  // Hence during CST visiting it runs on every instance of that rule found during parsing
  fqnOrRefType(ctx) {
    this._findCalls(ctx)
    this._findTags(ctx)
  }
}

const visitor = new CallsFinder()
const printer = require('./traverse')

// To read Styles.java and BaseStyles.java
function parse(code) {
  const cst = parser.parse(code);
  visitor.styleList = []
  visitor.tagList = []
  visitor.prefixList = []

  visitor.visit(cst)
}

function getCalls() {
  return visitor.styleList
}

function getTags() {
  return visitor.tagList
}

/* Small code snippets for testing
 * or manually traversing small syntax tree to discover
 *names of grammar rules
 */
const javaTestCode = `
import static j2html.TagCreator.div;
import static j2html.TagCreator;

public class LoginForm extends BaseHtmlView {

  public ContainerTag mobilePage(Messages messages) {
    return div().withClasses(StyleUtils.responsiveSmall(Styles.TEXT_XL, Styles.W_2_3));
  }

  public ContainerTag mainContent(Messages messages) {
    return TagCreator.body().withClasses(BaseStyles.LOGIN_PAGE);
  }

  public ContainerTag header(Messages messages) {
    return TagCreator.h1().withClasses(Styles.BG_BLUE_200, Styles.TEXT_2XL);
  }
}
`

// Small code snippets to uncomment for debugging
// or manually traversing small syntax tree to discover
// names of grammar rules
function test() {
  console.log("Testing parser for CSS trimming")
  parse(javaTestCode)
  const calls = _.sortBy(getCalls())
  const tags = _.sortBy(getTags())

  const knownCalls = _.sortBy(["TEXT_XL", "W_2_3", "LOGIN_PAGE", "BG_BLUE_200", "TEXT_2XL"])
  const knownTags = _.sortBy(["div", "body", "h1"])

  let hasError = false

  let msgCalls = ""
  let msgTags = ""

  if (!_.isEqual(calls, knownCalls)) {
    msgCalls = "Problem finding style calls in test code snippet: \n"
    msgCalls += "Style calls found:    " + calls.toString() + "\n"
    msgCalls += "Style calls expected: " + knownCalls.toString() + "\n"
    hasError = true
  }

  if (!_.isEqual(tags, knownTags)) {
    msgTags = "Problem finding HTML tags in test code snippet: \n"
    msgTags += "HTML tags found:    " + tags.toString() + "\n"
    msgTags += "HTML tags expected: " + knownTags.toString() + "\n"
    hasError = true
  }

  if (hasError) {
    let msg = msgCalls + "\n" + msgTags
    throw msg
  } else {
    console.log("Parsing tests passed!")
  }
}

// Automated test
test()

module.exports = { parse, getCalls, getTags }
