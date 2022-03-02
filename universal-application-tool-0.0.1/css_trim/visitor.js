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

class GraphVisualizer {
  constructor() {
    this._indent=0

    // Variables related to how deep of the tree to print
    //
    // E.g. is _coreExpressionGrammarRule is 'primary'
    // and if _coreExpressionCutoffLevel is 2, then every 'primary' 
    // node under the highest 'primary' node will print the full
    // code expression under it
    this._coreExpressionGrammarRule = "primary"
    this._coreExpressionCutoffLevel = 1
    this._coreExpressionCurrentLevel = 0
    this._coreExpressionNodeStack = []
  }

  _pushGrammarRule(grammarRule, numChildren) {
    this._pushIndent()
    this._printGrammarRule(numChildren)
  }

  _pushIdentifier(identifier) {
    this._pushIndent()
    this._printIdentifier(identifier)
  }

  push(ctx) {
    
  }

  pop() {
    this._popIndent()
  }

  _pushIndent() {
    this._indent++
  }

  _popIndent() {
    this._indent--
    if (this._indent < 0) {
      throw "Negative indent error!!!"
    }
  }

  // Everything on line of node printed, but before it, i.e. what leads up to it
  // For an Identifier, this is usually dashed lines for visibility
  _getIdentifierLeadup() {
    return '- '.repeat(this._indent)
  }

  _getGrammarLeadup() {
    return '  '.repeat(this._indent)
  }

  _getIdentifierLiteral(identifier) {
    if (_.has(IMAGE_MAP, identifier)) {
      return IMAGE_MAP[identifier]
    } 

    return identifier
  }

  // Sometimes we don't want to print the grammar rule literally, and instead 
  // use a '\' character. This is for cases in which a node has only one child
  // and helps with visually seeing whats going on
  //
  // The whole point is to be able to find the grammar rule that has access to the 
  // expression we need so we can do the logic there
  //
  // numChildren: The number of subnodes for that node in the tree, including Identifiers
  _getGrammarLiteral(grammarRule, numChildren) {
    if (numChildren <= 1) {
      return grammarRule
    } else {
      return '\\'
    }
  }

  _printGrammarRule(grammarRule, numChildren) {
    const leadup = this._getGrammarLeadup()
    const grammarLiteral = this._getGrammarLiteral(grammarRule, numChildren)
    this._printLiteral(leadup, grammarLiteral)
  }

  _printIdentifier(identifier) {
    const leadup = this._getIdentifierLeadup()
    const identifierLiteral = this._getIdentifierLiteral(identifier)
  }

  // leadup: white space or dashed lines before the node being printed
  // literal: the node being printed, could be a grammar rule or an identifier
  _printLiteral(leadup, literal) {
    console.log(leadup + literal)
  }

  /****************************************************/
  /*   B E L O W  IS  G A R B A G E                   */
  /****************************************************/

  // Tests if 
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

  // Methods to print basic Concrete Syntax Tree //

  _indentedPrintStartRule(grammarRule, subNodesSorted) {
    let shouldPrint = this._shouldPrint(subNodesSorted)
    if (true || shouldPrint) {
      this._indentedPrintStartLiteral(grammarRule)
    } else {
      this._indentedPrintStartLiteral('\\')
    }
  }

  _indentedPrintStartIdentifier(node) {
    const image = node.image
    this._indentedPrintStartLiteral(image, true)
  }


  // Methods to handle which levels of the tree are printed as grammar, and
  // which levels are printed as full code expressions (under the specific node)

  _isBelowCoreExpressionCutoffLevel() {
    if (this._coreExpressionCurrentLevel > this._coreExpressionCutoffLevel) {
      return 1
    } else if (this._coreExpressionCurrentLevel === this._coreExpressionCutoffLevel) {
      return 0
    } else {
      return -1
    }
  }

  _isBelowCoreExpressionCutoffLevelStart(grammarRule) {
    if (grammarRule === this._coreExpressionGrammarRule) {
      this._coreExpressionCurrentLevel++
      //console.log('DESCENDING', this._coreExpressionCurrentLevel)
    }
    
    return this._isBelowCoreExpressionCutoffLevel()
  }

  _isBelowCoreExpressionCutoffLevelEnd(grammarRule) {
    if (grammarRule === this._coreExpressionGrammarRule) {
      this._coreExpressionCurrentLevel--
      if (this._coreExpressionCurrentLevel < 0) {
        throw "Negative core expression level"
      }
    }
  }
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

  _isIdentifier(node) {
    if (_.has(node, 'image') && _.has(node, 'startOffset')) {
      return true
    }
    return false
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
      if (this._isIdentifier(node)) {
        identifierList.push(node.image)
      } else {
        tmpArray = this.visit(node)
        identifierList.concat(tmpArray)
      }
    }

    return identifierList
  }

  _getIdentifiersAndPrint(ctx, grammarRule) {
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
