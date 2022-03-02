const parser = require('java-parser')
const traverse = require('./traverse')
var _ = require('lodash')

function sortKey(o) {
  let rval
  try {
    rval = o.location.startOffset 
  } catch(errorA) {
    try {
      rval = o.startOffset
    } catch(errorB) {
      throw errorB
    }
  }
  return rval
}

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
  constructor(cstVisualizer) {
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

    this.graphVisualizer = cstVisualizer
    this.callRegex = /[0-9A-Z_]+/
    this.tagRegex = /[0-6a-z:]+/
    this.styleList = []
    this.tagList = []
    this.validateVisitor()
  }

  _getExpression(identifiersList) {
    let expression = ''

    for (const identifier of identifiersList) {
      expression += identifier
    }

    return expression
  }

  // Core routine to traverse the concrete syntax tree and 
  // retrieve all leaf node identifiers before current node ctx
  _getIdentifiers(ctx, grammarRule, maybePrintSubNodes=true) {
    const subRulesAndMaybeIdentifiersList = Object.keys(ctx)
    const subNodesSorted = this._getNodes(ctx, subRulesAndMaybeIdentifiersList)

    const identifierList = []
    let  tmpArray

    for (const node of subNodesSorted) {
      if (this.nodeOrganizer.isIdentifier(node)) {
        this.graphVisualizer.pushIdentifier(node.image)
        identifierList.push(node.image)
      } else {
        this.graphVisualizer.pushGrammarRule
        tmpArray = this.visit(node)
        identifierList.concat(tmpArray)
      }
    }

    return identifierList
  }

  _getIdentifiersAndMaybePrint(ctx, grammarRule) {
    if (this.nodeOrganizer.isIdentifier(ctx)) {
    
    }
    this.graphVisualizer.push

    const identifiers = this._getIdentifiers(ctx, grammarRule)
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
    const identifiers = this._getIdentifiersAndPrint(ctx, "primary")
    //const printExpression = this._isBelowCoreExpressionCutoffLevelStart("primary")
    //this._indent++
    //this._indentedPrintStartLiteral("Whooooooo", true)
    //this._indentedPrintEnd()
    //this._indent--
    return identifiers
  }

  primaryPrefix(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "primaryPrefix")
    return identifiers
  }

  unaryExpression(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "unaryExpression")
    return identifiers
  }

  binaryExpression(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "binaryExpression")
    return identifiers
  }

  ternaryExpression(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "ternaryExpression")
    return identifiers
  }

  expression(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "expression")
    return identifiers
  }

  argumentList(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "argumentList")
    return identifiers
  }

  methodInvocationSuffix(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "methodInvocationSuffix")
    return identifiers
  }

  primarySuffix(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "primarySuffix")
    return identifiers
  }

  fqnOrRefType(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "fqnOrRefType")
    return identifiers
  }

  fqnOrRefTypePartFirst(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "fqnOrRefTypePartFirst")
    return identifiers
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
    const identifiers = this._getIdentifiersAndPrint(ctx, "fqnOrRefTypePartRest")
    return identifiers
  }

  // Forms similar to the base case in recursive
  fqnOrRefTypePartCommon(ctx) {
    const identifiers = this._getIdentifiersAndPrint(ctx, "fqnOrRefTypePartCommon")
    return identifiers
  }
}

const visitor = new CallsFinder()

module.exports = visitor
