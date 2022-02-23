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
      let styleClass = traverse.getMethodCallClass(ctx)
      if (styleClass.image !== "Styles" && styleClass.image !== "BaseStyles") {
        throw "not a valid style call"
      }

      let dot = ctx.Dot[0]
      if (dot.image !== ".") {
        throw "not a valid dot token"
      }

      styleCall = traverse.getMethodCall(ctx)
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
      let libCallNodeMaybe = ctx.fqnOrRefTypePartFirst[0]
      libCallNodeMaybe = libCallNodeMaybe.children.fqnOrRefTypePartCommon
      libCallNodeMaybe = libCallNodeMaybe[0].children.Identifier

      let node = ctx.fqnOrRefTypePartRest[0].children
      let identifier = node.fqnOrRefTypePartCommon[0].children.identifier

      // If its a call starting with j2html.TagCreator.<tag>
      if (libCallNodeMaybe[0].image === "j2html") {
        let dot = ctx.Dot

        if (dot.length !== 2) {
          throw "Incorrect number of Dot tokens"
        }

        // Double check its called by TagCreator
        let maybeTagCreator = ctx.fqnOrRefTypePartRest[0]
        maybeTagCreator = maybeTagCreator.children.fqnOrRefTypePartCommon
        maybeTagCreator = maybeTagCreator[0].children.Identifier
        maybeTagCreator = maybeTagCreator[0].image

        if (maybeTagCreator !== "TagCreator") {
          throw "Function not called from j2html.TagCreator so its not a HTML tag"
        }

        // Get the tag
        let maybeTag = ctx.fqnOrRefTypePartRest[1]
        maybeTag = maybeTag.children.fqnOrRefTypePartCommon
        maybeTag = maybeTag[0].children.Identifier
        maybeTag = maybeTag[0].image

        tag = maybeTag

      } // If its a call starting with TagCreator.<tag>
      else if (libCallNodeMaybe[0].image === "TagCreator") {
        let dot = ctx.Dot[0]

        // Get the tag
        let maybeTag = ctx.fqnOrRefTypePartRest[0]
        maybeTag = maybeTag.children.fqnOrRefTypePartCommon[0]
        maybeTag = maybeTag.children.Identifier[0].image

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
  //traverse(cst)

  visitor.visit(cst)
}

function getCalls() {
  return visitor.styleList
}

function getTags() {
  return visitor.tagList
}

// Small code snippets to uncomment for debugging
// or manually traversing small syntax tree to discover
// names of grammar rules
const javaCodeStyleCall = `
public class LoginForm extends BaseHtmlView {

  public ContainerTag mobilePage(Messages messages) {
    return div().withClasses(StyleUtils.responsiveSmall(Styles.TEXT_XL, Styles.W_2_3));
  }

  public ContainerTag mainContent(Messages messages) {
    return TagCreatorbody().withClasses(BaseStyles.LOGIN_PAGE);
  }
}
`

// Small code snippets to uncomment for debugging
// or manually traversing small syntax tree to discover
// names of grammar rules
const javaCodeTagFind = `
import static j2html.TagCreator.br;
import static j2html.TagCreator.a;
import static j2html.TagCreator.each;

public abstract class BaseHtmlView {

  public static Tag button(String textContents) {
    return j2html.TagCreator.body().with(renderHeader());
  }

  public static Tag button(String textContents) {
    return TagCreator.body().with(renderHeader());
  }
}
`
//parse(javaCodeStyleCall)
//parse(javaCodeTagFind)
//console.log(visitor.styleList)

module.exports = { parse, getCalls, getTags }
