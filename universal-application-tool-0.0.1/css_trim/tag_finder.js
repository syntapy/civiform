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
      let identifiers = ctx.children.Identifier

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
      libCallNodeMaybe = libCallNodeMaybe.children.fqnOrRefTypePartCommon[0]
      libCallNodeMaybe = libCallNodeMaybe.children.Identifier[0]

      if (libCallNodeMaybe.image !== "TagCreator") {
        throw "Not a j2html.TagCreator invocation"
      }

      // Just to make extra sure theres a '.' token
      let dot = ctx.Dot[0]

      let functionCallNodeMaybe = ctx.fqnOrRefTypePartRest[0]
      functionCallNodeMaybe = functionCallNodeMaybe.children.fqnOrRefTypePartCommon[0]
      functionCallNodeMaybe = functionCallNodeMaybe.children.Identifier[0]

      tag = functionCallNodeMaybe.image

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
import static j2html.TagCreator.each;

public abstract class BaseHtmlView {

  public static Tag button(String textContents) {
    return TagCreator.button(text(textContents)).withType("button");
  }
}
`
//parseForTags(javaCode)

module.exports = { parseForTags, getTags }
