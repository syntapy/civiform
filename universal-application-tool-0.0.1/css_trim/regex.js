class Regex {
  constructor() {
    // e.g. the 'XYZ' in 'Styles.XYZ'
    this._styleVarRegex = /^[A-Z0-9_]+$/

    // actual Tailwind style
    this._styleLiteralRegex = /^"[a-z0-9-/]+"$/
  }
}

function get() {
  return new Regex()
}

module.exports = { get }
