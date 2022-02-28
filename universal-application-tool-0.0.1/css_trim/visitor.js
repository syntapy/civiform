const parser = require('java-parser')
const traverse = require('./traverse')
var _ = require('lodash')

// TODO The logic in these visitor methods are looking to be very confusing.
// And it also seems like it would be easy for the case where a developer uses
// some more advanced / complex stylistic approaches in their code that would evade
// some of the syntactic structures captured in this visitor.
//
// So that, combined with the complexity of the code, is kinda making me concerned about
// the future maintainability of this thing
//
// Maybe theres a way to capture the logic in a more readable way?
// And add tons of comments describing how this works so that someone can
// easily jump on and make a modification in case a new coding style breaks
// the style capture
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
    if (_.has(this, '_indent')) { throw "CallsFinder already has property '_indent'. Use a different property name to hold indentation info." }

    this.callRegex = /[0-9A-Z_]+/
    this.tagRegex = /[0-6a-z:]+/
    this.styleList = []
    this.tagList = []
    this.validateVisitor()
    this._indent=0
  }

  // Method for visualizing grammar + syntax
  _indentedPrintStart(grammarRule, isEnd=false) {
    let indentation = ' '.repeat(1)
    let prefix = '   '
    if (isEnd) {
      prefix = '-- '
    }
    console.log(indentation.repeat(this._indent) + prefix + grammarRule)
    this._indent++
  }

  _indentedPrintEnd() {
    this._indent--
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

  // This is where most of the decision making in regards whether it encountered
  // e.g. a StyleUtils.uvwXY(..), a Styles.XYZ, or a BaseStyles.UVW
  // Need to chain together the visitor methods so that all nodes are visited
  // See: https://chevrotain.io/docs/guide/concrete_syntax_tree.html#traversing
  primary(ctx) {
    this._indentedPrintStart("primary")
    const primaryResult = {
      prefix: [],
      suffix: [],
    }
    if (_.has(ctx, 'primaryPrefix')) {
      for (const node of ctx.primaryPrefix) {
        const resultIterable = this.visit(node)
        for (const result of resultIterable) {
          if (result === 'Styles') {
            primaryResult.prefix.push(result)
          }
        }
      }
    }

    if (_.has(ctx, 'primarySuffix')) {
      for (const node of ctx.primarySuffix) {
        const resultIterable = this.visit(node)
        //for (const result of resultIterable) {
        //}
      }
    }

    this._indentedPrintEnd()
    return primaryResult
  }

  primaryPrefix(ctx) {
    this._indentedPrintStart("primaryPrefix")
    if (_.has(ctx, 'fqnOrRefType')) {
      for (const node of ctx.fqnOrRefType) {
        const iterList = []
        for (const iter of this.visit(node)) {
          iterList.push(iter)
        }
        return iterList
      }
    }

    this._indentedPrintEnd()
    return null
  }

  unaryExpression(ctx) {
    this._indentedPrintStart("unaryExpression")
    if (_.has(ctx, 'primary')) {
      for (const node of ctx.primary) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  binaryExpression(ctx) {
    this._indentedPrintStart("binaryExpression")
    if (_.has(ctx, 'unaryExpression')) {
      for (const node of ctx.unaryExpression) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  ternaryExpression(ctx) {
    this._indentedPrintStart("ternaryExpression")
    if (_.has(ctx, 'binaryExpression')) {
      for (const node of ctx.binaryExpression) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  expression(ctx) {
    this._indentedPrintStart("expression")
    if (_.has(ctx, 'ternaryExpression')) {
      for (const node of ctx.ternaryExpression) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  argumentList(ctx) {
    this._indentedPrintStart("argumentList")
    if (_.has(ctx, 'expression')) {
      for (const node of ctx.expression) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  methodInvocationSuffix(ctx) {
    this._indentedPrintStart("methodInvocationSuffix")
    if (_.has(ctx, 'argumentList')) {
      for (const node of ctx.argumentList) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  primarySuffix(ctx) {
    this._indentedPrintStart("primarySuffix")
    if (_.has(ctx, 'methodInvocationSuffix')) {
      for (const node of ctx.methodInvocationSuffix) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  *fqnOrRefType(ctx) {
    this._indentedPrintStart("*fqnOrRefType")
    //this._findCalls(ctx)
    //this._findTags(ctx)
    if (_.has(ctx, 'fqnOrRefTypePartFirst')) {
      const node = ctx.fqnOrRefTypePartFirst
      const length = node.length

      // Could loop through it, but since left side of the fork
      // here is expected to be length 1 only, mmight as well
      // constrain it here
      if (length > 1) {
        throw "Unexpected length of fqnOrRefTypePartFirst list"
      } else if (length === 1) {
        yield this.visit(node[0])
      }

      //for (const node of nodeIter) {
      //  yield this.visit(node)
      //}
    }

    // Could be a full expression under here
    // Which would be needed to be processed if its arguments
    // to a 'StyleUtils' method call
    //
    // Or such a thing may be higher up the tree
    if (_.has(ctx, 'fqnOrRefTypePartRest')) {
      for (const node of ctx.fqnOrRefTypePartRest) {
        // This may or may not bring anything on each yield pass
        // depending on whether an 'expression' is ultimately under it
        yield this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  fqnOrRefTypePartFirst(ctx) {
    this._indentedPrintStart("fqnOrRefTypePartFirst")
    if (_.has(ctx, 'fqnOrRefTypePartCommon')) {
      const node = ctx.fqnOrRefTypePartCommon
      const length = node.length
      if (length > 1) {
        throw "Unexpected length of fqnOrRefTypePartCommon list"
      } else if (length === 1) {
        return this.visit(node[0])
      }
      //for (const node of ctx.fqnOrRefTypePartCommon) {
      //  this.visit(node)
      //}
    }

    this._indentedPrintEnd()
    return null
  }

  // TODO: May need to loop through the sub visits of
  // this one cuz it may have multiple ones for chained calls
  // For example: 
  // div().with(
  //      StylesUtils
  //        .responsiveMedium(...)
  //      .with(
  //        SytyleUtils.responsiveLarge(...)
  //      )
  //    )
  fqnOrRefTypePartRest(ctx) {
    this._indentedPrintStart("fqnOrRefTypePartRest")
    if (_.has(ctx, 'fqnOrRefTypePartCommon')) {
      const nodeIter = ctx.fqnOrRefTypePartCommon
      const length = nodeIter.length
      for (const node of ctx.fqnOrRefTypePartCommon) {
        this.visit(node)
      }
    }
    this._indentedPrintEnd()
  }

  // Forms similar to the base case in recursive
  fqnOrRefTypePartCommon(ctx) {
    this._indentedPrintStart("fqnOrRefTypePartCommon")
    if (_.has(ctx, 'Identifier')) {
      const node = ctx.Identifier
      const length = node.length
      if (length > 1) {
        throw "Unexpected length of identifier list"
      } else if (length === 1) {
        const image = node[0].image
        this._indentedPrintStart(image, true)
        this._indentedPrintEnd()
        return image
      }
      //for (const node of ctx.Identifier) {
      //}
    }

    this._indentedPrintEnd()
    return null
  }
}

const visitor = new CallsFinder()

module.exports = visitor
