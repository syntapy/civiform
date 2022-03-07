const fs = require('fs');
const cssTrimmer = require('./css_trim')

// Used in the main tailwind's method of the transform obj to ensure we only
// read certain files (e.g. typescript) only once, since those have their contents read directly

function genStylesDict() {
  const folder = './app/views/style/'
  const specialFiles = ['Styles.java', 'BaseStyles.java', 'ReferenceClasses.java'];
  try {
    for (file of specialFiles) {
      let code = fs.readFileSync(folder+file, 'utf8');
      cssTrimmer.parseForDict(code)
      //let stylesReader = new StylesJavaReader(code.split('\n'));
      //stylesReader.getMatches(matches);
    }
  } catch (error) {
    throw 'error reading Styles.java for tailwindcss processing: ' + error.message;
  }

  cssTrimmer.generateStylesAggregator()
}

genStylesDict()

module.exports = {
  purge: {
    enabled: true,
    content: [
      './app/views/**/*.java',
    ],
    extract: {
      java: (content) => {
        return content
      },
    },
    transform: {
      java: (content) => {
        cssTrimmer.resetTrimmed()
        cssTrimmer.parseForStyles(content)
        return cssTrimmer.getTrimmed()
      },
    },
  },

  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'civiform-white': {
          DEFAULT: '#f8f9fa',
        },
        'seattle-blue': {
          DEFAULT: '#113f9f',
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['disabled', 'odd'],
      textColor: ['disabled'],
      opacity: ['disabled'],
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
