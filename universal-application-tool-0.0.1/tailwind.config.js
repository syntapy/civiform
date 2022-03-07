const fs = require('fs');
const cssTrimmer = require('./css_trim')

// Used in the main tailwind's method of the transform obj to ensure we only
// read certain files (e.g. typescript) only once, since those have their contents read directly

function genStylesDict() {
  const folder = './app/views/style/'
  const specialFiles = ['Styles.java', 'ReferenceClasses.java'];
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

var processedTs = false

function processTypescript(output) {
  const assetsFolder = './app/assets/javascripts/';
  let files = fs.readdirSync(assetsFolder);

  for (const f of files) {
    let data = fs.readFileSync(assetsFolder + f, 'utf8').split('\n');
    for (const line of data) {
      matches = line.matchAll(/["'][\.a-z0-9/:-]+["']/g);
      for (m of matches) {
        let mr = m[0].replace(/['"]+/g, '');
        output.push(mr);
      }
    }
  }
}

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
        output = cssTrimmer.getTrimmed()

        if (processedTs === false) {
          processTypescript(output)
          processedTs = true
        }

        return output
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
