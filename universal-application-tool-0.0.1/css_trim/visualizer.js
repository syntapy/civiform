const node_organizer = require('./node_organizer')
const _ = require('lodash')

const IMAGE_MAP = {
  '.': 'DOT',
  '(': 'L_BRACE',
  ')': 'R_BRACE'
}

class DisplayModifier {
  constructor() {
    // Variables related to how deep of the tree to print
    //
    // E.g. is _GrammarRule is 'primary'
    // and if _CutoffLevel is 2, then every 'primary' 
    // node under the highest 'primary' node will print the full
    // code expression under it
    this._grammarRule = "primary"
    this._moddedLevel = 1
    this._level = 0
    this.hasPrintedCodeAlready = false
  }

  maybePush(grammarRule) {
    if (grammarRule === this._grammarRule) {
      this._level++
    }
  }

  maybePop(grammarRule) {
    if (grammarRule === this._grammarRule) {
      this._level--
      if (this.checkLevel(grammarRule) === true) {
        this.hasPrintedCodeAlready = false
      }
    }
  }
  
  checkLevel(grammarRule) {
    if (this._level > this._moddedLevel) {
      return -1
    } else if (this._level === this._moddedLevel) {
      return 0
    } else {
      return 1
    }
  }
}

// This is a text-based graph visualizer I used to look through
// the CST. The idea is to help a developer months or years later
// to easily understand the structure of the CST and how it relates 
// to the grammar so that the logic behind any changes to the parser
// can easily be determined in a hectic day
//
// TODO Incorporate into `bin/refresh-styles` as options
class GraphVisualizer {
  constructor(nodeOrganizer, displayMod) {
    this.nodeOrganizer = nodeOrganizer
    this.displayMod = displayMod
    this._level = 0
    this._printChildrenLevel = []
    this._printCoreRuleChildrenOnly = true
    this._printAllRules = true
    this._printNothing = true

    // Set this to true to find out what child nodes the primary
    // grammar rule has
    this.printCoreRuleChildrenOnly = true
  }

  _atCoreRuleChildrenLevel() {
    const length = this._printChildrenLevel.length
    if (length) {
      if (this._level === this._printChildrenLevel[length-1]) {
        return true
      }
    }

    return false
  }

  _pushChildrenLevel() {
    this._printChildrenLevel.push(this._level+1)
  }

  _popChildrenLevel() {
    this._printChildrenLevel.pop()
  }

  shouldPrintNormally() {
    return this.displayMod.checkLevel() === 1
  }

  pushGrammarRule(grammarRule, numChildren) {
    this._pushIndent()
    this.displayMod.maybePush(grammarRule)
    if (grammarRule === this.displayMod._grammarRule) {
      this._pushChildrenLevel()
    }
    //if (this.checkLevel()) {
    this._printGrammarRule(grammarRule, numChildren)
    //} //else {
      //this._printGrammarRule("===", numChildren)
    //}
  }

  pushIdentifier(identifier) {
    this._pushIndent()
    //if (this.checkLevel()) {
      this._printIdentifier(identifier)
    //} //else {
      //this._printIdentifier("$$$")
    //}
  }

  pop(grammarRule) {
    this._level--
    this.displayMod.maybePop(grammarRule)
    if (grammarRule === this.displayMod._grammarRule) {
      this._popChildrenLevel()
    }
    if (this._level < 0) {
      throw "Negative indent error!!!"
    }
  }

  printCode(grammarRule, identifierList) {
    const code = identifierList.join()
    this.pushIdentifier(code)
    this.pop(grammarRule)
    //this._printIdentifier(code)
    //if (this.displayMod.checkLevel(grammarRule) === false) {
    //  if (this.displayMod.hasPrintedCodeAlready === false) {
    //    const code = identifierList.join()
    //    this._printIdentifier(code)
    //    this.displayMod.hasPrintedCodeAlready = true
    //  }
    //}
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
    const levelState = this.displayMod.checkLevel(grammarRule)
    const prefix = this.displayMod._level.toString() + ' ' + levelState.toString()

    const isRoot = this._level === 0
    const hasOneChild = numChildren < 2
    const isCoreRule = this.displayMod._grammarRule === grammarRule

    let printGrammar = false

    if (this._printAllRules) {
      printGrammar = true
    } else if (isRoot) {
      printGrammar = true
    } else if (isCoreRule) {
      printGrammar = true
    }

    if (this._printCoreRuleChildrenOnly) {
      if (this._atCoreRuleChildrenLevel()) {
        printGrammar = true
      }
    } else {
      if (!hasOneChild) {
        printGrammar = true
      }
    }

    if (printGrammar) {
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
    if (this._printNothing === false) {
      console.log(leadup + literal)
    }
  }
}

function getVisualizer() {
  const nodeOrganizer = node_organizer.getOrganizer()
  const displayMod = new DisplayModifier()
  return new GraphVisualizer(nodeOrganizer, displayMod)
}

function test() {
  const visualizer = getVisualizer()
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

//test()

//throw "quit visualizer error"

module.exports = { test, getVisualizer }
