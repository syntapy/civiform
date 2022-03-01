const parser = require('java-parser')
const traverse = require('./traverse')
var _ = require('lodash')

const IMAGE_MAP = {
  '.': 'DOT',
  '(': 'L_BRACE',
  ')': 'R_BRACE'
}

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
var displayValsasdfg = false
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
  _indentedPrintStart(grammarRuleOrId, isId=false) {
    let indentation = '  '.repeat(1)
    let idPrefix = '  '
    let printStr = grammarRuleOrId
    if (isId) {
      indentation = '--'.repeat(1)
      idPrefix = '-- '
      if (_.has(IMAGE_MAP, printStr)) {
        printStr = IMAGE_MAP[printStr]
      }
    }

    let prefix = indentation.repeat(this._indent) + idPrefix

    if (grammarRuleOrId === '*fqnOrRefType') {
      prefix = prefix.replace(/ /g, '=')
    }
    console.log(prefix + grammarRuleOrId)
    this._indent++
  }

  _indentedPrintIdentifier(node) {
    const image = node.image
    this._indentedPrintStart(image, true)
    this._indentedPrintEnd()
  }

  _indentedPrintEnd() {
    this._indent--
  }

  _isIdentifier(node) {
    if (_.has(node, 'image') && _.has(node, 'startOffset')) {
      return true
    }
    return false
  }

  _getNodes(ctx, attributesList) {
    const nodesList = []
    for (const attribute of attributesList) {
      if (_.has(ctx, attribute)) {
        for (const node of ctx[attribute]) {
          nodesList.push(node)
        }
      }
    }

    let nodesSorted = []

    if (nodesList.length > 0) {
      nodesSorted = _.sortBy(nodesList, [sortKey])
    }

    displayValsasdfg = false
    return nodesSorted
  }

  _shouldPrint(subNodesSorted) {
    let count = 0
    let hasIdentifier = false

    if (this._indent === 0) {
      return true
    }

    for (const node of subNodesSorted) {
      if (this._isIdentifier(node)) {
        return true
      }
      count++
    }

    return count > 1
  }

  // Core routine to traverse the concrete syntax tree and 
  // retrieve all leaf node identifiers before current node ctx
  _getIdentifiers(ctx, grammarRule) {
    const subRulesAndMaybeIdentifiersList = Object.keys(ctx)
    const subNodesSorted = this._getNodes(ctx, subRulesAndMaybeIdentifiersList)

    let shouldPrint = this._shouldPrint(subNodesSorted)
    if (shouldPrint) {
      this._indentedPrintStart(grammarRule)
    } else {
      this._indentedPrintStart('\\')
    }

    const identifiers = []
    let  tmpArray

    for (const node of subNodesSorted) {
      if (this._isIdentifier(node)) {
        this._indentedPrintIdentifier(node)
        identifiers.push(node.image)
      } else {
        tmpArray = this.visit(node)
        identifiers.concat(tmpArray)
      }
    }

    this._indentedPrintEnd()
    return identifiers
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
    const identifiers = this._getIdentifiers(ctx, "primary")
    return identifiers
  }

  primaryPrefix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primaryPrefix")
    return identifiers
  }

  unaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "unaryExpression")
    return identifiers
  }

  binaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "binaryExpression")
    return identifiers
  }

  ternaryExpression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "ternaryExpression")
    return identifiers
  }

  expression(ctx) {
    const identifiers = this._getIdentifiers(ctx, "expression")
    return identifiers
  }

  argumentList(ctx) {
    const identifiers = this._getIdentifiers(ctx, "argumentList")
    return identifiers
  }

  methodInvocationSuffix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "methodInvocationSuffix")
    return identifiers
  }

  primarySuffix(ctx) {
    const identifiers = this._getIdentifiers(ctx, "primarySuffix")
    return identifiers
  }

  fqnOrRefType(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefType")
    return identifiers
  }

  fqnOrRefTypePartFirst(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartFirst")
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
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartRest")
    return identifiers
  }

  // Forms similar to the base case in recursive
  fqnOrRefTypePartCommon(ctx) {
    const identifiers = this._getIdentifiers(ctx, "fqnOrRefTypePartCommon")
    return identifiers
  }
}

const visitor = new CallsFinder()

module.exports = visitor
