const parser = require('java-parser')
var _ = require('lodash')

class TagFinder extends parser.BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()

    // Just make sure we're not overwriting anything from super class
    if (_.has(this, 'tagList')) {
      throw "TagFinder already has property 'tagList'. Use a different property name to hold dictionary of styles."
    }
    if (_.has(this, 'styleRegex')) {
      throw "TagFinder already has property 'tagRegex'. Use a different property name to hold dictionary of styles."
    }

    this.tagRegex = /[0-6a-z:]+/
    this.tagList = []
    this.validateVisitor()
  }

  packageOrTypeName(ctx) {
    let tag = ""

    try {
      let identifiers = ctx.Identifier

      if (identifiers.length !== 3) {
        throw "Wrong identifier length. The j2html import we want here has length 3"
      }

      if (identifiers[0].image !== "j2html") {
        throw "Not a j2thml import"
      }

      if (identifiers[1].image !== "TagCreator") {
        throw "Not the right j2hml tag"
      }

      if (identifiers[2].image === "each" || identifiers[2].image === "text") {
        throw "Not an html tag"
      }

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

  fqnOrRefType(ctx) {
    let tag = ""

    try {
      let libCallNodeMaybe = ctx.fqnOrRefTypePartFirst[0]
      libCallNodeMaybe = libCallNodeMaybe.children.fqnOrRefTypePartCommon
      libCallNodeMaybe = libCallNodeMaybe[0].children.Identifier

      let node = ctx.fqnOrRefTypePartRest[0].children
      let identifier = node.fqnOrRefTypePartCommon[0].children.identifier

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

      } else if (libCallNodeMaybe[0].image === "TagCreator") {
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
}

const visitor = new TagFinder()

// To look for html tags
function parseForTags(code) {
  const cst = parser.parse(code);
  visitor.tagList = []
  visitor.visit(cst)
}

function getTags() {
  return visitor.tagList
}

const javaCode = `
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
//parseForTags(javaCode)

module.exports = { parseForTags, getTags }
