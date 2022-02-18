const parser = include('./parser')

function test_1() {
  const code = ' public static final String RING_OFFSET_PINK_200 = "ring-offset-pink-200";'
  const result = parser.parseStyles(code)
  console.log(result)
}

module.exports = { test_1 }
