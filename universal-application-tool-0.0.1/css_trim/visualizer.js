const node_organizer = require('./node_organizer')
const _ = require('lodash')

const IMAGE_MAP = {
  '.': 'DOT',
  '(': 'L_BRACE',
  ')': 'R_BRACE'
}

class GraphVisualizer {
  constructor(nodeOrganizer) {
    this.nodeOrganizer = nodeOrganizer
    this._level = 0

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

  pushGrammarRule(grammarRule, numChildren) {
    this._pushIndent()
    this._printGrammarRule(grammarRule, numChildren)
  }

  pushIdentifier(identifier) {
    this._pushIndent()
    this._printIdentifier(identifier)
  }

  pop() {
    this._level--
    if (this._level < 0) {
      throw "Negative indent error!!!"
    }
  }

  _pushIndent() {
    this._level++
  }

  // Everything on line of node printed, but before it, i.e. what leads up to it
  // For an Identifier, this is usually dashed lines for visibility
  _getIdentifierLeadup() {
    return '- '.repeat(this._level)
  }

  _getGrammarLeadup() {
    return '  '.repeat(this._level)
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
    if (this._level === 1 || numChildren < 2) {
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
    this._printLiteral(leadup, identifierLiteral)
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

    if (this._level === 0) {
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

function test() {
  const nodeOrganizer = node_organizer.getOrganizer()
  const visualizer = new GraphVisualizer(nodeOrganizer)

  visualizer.pushGrammarRule("Level 1", 1)
  visualizer.pushGrammarRule("Level 2a", 1)
  visualizer.pushGrammarRule("Level 3a", 2)
  visualizer.pushIdentifier("ID a")
  visualizer.pop()
  visualizer.pushIdentifier("ID b")
  visualizer.pop()
  visualizer.pop()
  visualizer.pushGrammarRule("Level 3b", 2)
  visualizer.pushIdentifier("ID a")
  visualizer.pop()
  visualizer.pushIdentifier("ID b")
  visualizer.pop()
  visualizer.pop()
  visualizer.pop()
  visualizer.pop()
}

test()

throw "quit visualizer error"

module.exports = { test }
