const parser = require('java-parser')
const traverse = require('./traverse')
var _ = require('lodash')

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

  // All directly imported tags (from e.g. import j2html.TagCreator.<tag>) 
  // will get added to tailwind.css
  /*packageOrTypeName(ctx) {
    super.packageOrTypeName(ctx)
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
  }*/

  // Need to chain together the visitor methods so that all nodes are visited
  // See: https://chevrotain.io/docs/guide/concrete_syntax_tree.html#traversing
  primary(ctx) {
    if (_.has(ctx, 'primaryPrefix')) {
      for (const node of ctx.primaryPrefix) {
        this.visit(node)
      }
    }

    if (_.has(ctx, 'primarySuffix')) {
      for (const node of ctx.primarySuffix) {
        this.visit(node)
      }
    }
  }

  primaryPrefix(ctx) {
    if (_.has(ctx, 'fqnOrRefType')) {
      for (const node of ctx.fqnOrRefType) {
        this.visit(node)
      }
    }
  }

  unaryExpression(ctx) {
    if (_.has(ctx, 'primary')) {
      for (const node of ctx.primary) {
        this.visit(node)
      }
    }
  }

  binaryExpression(ctx) {
    if (_.has(ctx, 'unaryExpression')) {
      for (const node of ctx.unaryExpression) {
        this.visit(node)
      }
    }
  }

  ternaryExpression(ctx) {
    if (_.has(ctx, 'binaryExpression')) {
      for (const node of ctx.binaryExpression) {
        this.visit(node)
      }
    }
  }

  expression(ctx) {
    if (_.has(ctx, 'ternaryExpression')) {
      for (const node of ctx.ternaryExpression) {
        this.visit(node)
      }
    }
  }

  argumentList(ctx) {
    if (_.has(ctx, 'expression')) {
      for (const node of ctx.expression) {
        this.visit(node)
      }
    }
  }

  methodInvocationSuffix(ctx) {
    if (_.has(ctx, 'argumentList')) {
      for (const node of ctx.argumentList) {
        this.visit(node)
      }
    }
  }

  primarySuffix(ctx) {
    if (_.has(ctx, 'methodInvocationSuffix')) {
      for (const node of ctx.methodInvocationSuffix) {
        this.visit(node)
      }
    }
  }

  fqnOrRefType(ctx) {
    if (_.has(ctx, 'fqnOrRefTypePartFirst')) {
      for (const node of ctx.fqnOrRefTypePartFirst) {
        this.visit(node)
      }
    }

    if (_.has(ctx, 'fqnOrRefTypePartRest')) {
      for (const node of ctx.fqnOrRefTypePartRest) {
        this.visit(node)
      }
    }
  }

  fqnOrRefTypePartFirst(ctx) {
    if (_.has(ctx, 'fqnOrRefTypePartCommon')) {
      for (const node of ctx.fqnOrRefTypePartCommon) {
        this.visit(node)
      }
    }
  }

  fqnOrRefTypePartCommon(ctx) {
    console.log(ctx)
    if (_.has(ctx, 'Identifier')) {
      for (const node of ctx.Identifier) {
        // Access identifier
      }
    }
  }

  fqnOrRefTypePartRest(ctx) {
    if (_.has(ctx, 'fqnOrRefTypePartCommon')) {
      for (const node of ctx.fqnOrRefTypePartCommon) {
        this.visit(node)
      }
    }
  }
}

const visitor = new CallsFinder()

module.exports = visitor


/*class CallsFinder extends parser.BaseJavaCstVisitorWithDefaults {
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

  // Find calls to Styles.XYZ or BaseStyles.XYZ
  // ctx: Node in the concrete syntax tree
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

  // Find html tags
  // ctx: node in the concrete syntax tree
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
    console.log(ctx)
    this._findCalls(ctx)
    this._findTags(ctx)
  }
}*/
