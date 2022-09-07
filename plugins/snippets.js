function getSnippets(content) {

  // First, find all bits formatted as ((text)), and text does not end with ...
  let snippetRegex = /\(\(([\s\S]+?)(?!\.\.\.)\)\)/g
  // console.log(snippetRegex)

  let snippets = [], match
  while ( match = snippetRegex.exec(content) ) {
    snippets.push(match[1])
  }
  // console.log({snippets})

  return snippets

}

function insertSnippets(content, snippets, { insertAsHtml } = {}) {

  // Create an array of words that the snippets start with (don't forget to escape the regex)
  let snippetStarts = snippets.map(snippet => snippet.split(/\s/)[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
  // console.log({snippetStarts})
  // Remove duplicates
  snippetStarts = [...new Set(snippetStarts)]
  // Find bits starting with a snippet word and ending with a ...
  let snippetInsertionRegex = new RegExp(`((?:${snippetStarts.join('|')}).*?)\\.\\.\\.`, 'g')
  // console.log({snippetInsertionRegex})
  let match
  let ids = {}
  let last_id = 1
  while ( match = snippetInsertionRegex.exec(content) ) {

    // console.log({match})

    // Find a snippet starting with the same text
    let text = match[1]
    let snippet = snippets.find( snippet => snippet.startsWith(text) )
    // console.log({snippet})
    if ( !snippet ) {
      // console.warn('No snippet found for: ' + text)
      continue
    }

    // console.log({content})
    // console.log({insertAsHtml})
    if ( insertAsHtml ) {

      let id = ids[text]
      if ( !ids[text] ) {
        id = ids[text] = last_id++
        // Put an anchor on the original snippet text
        content = content.replace(`((${text}`, `((${text}<span id="snippet-${id}"></span>`)
      }
      // console.log({content})

      content = content.replace(match[0], `${text}<span 
        class="snippet"
        data-snippet="${snippet.replace(text, '')}"
        onclick="gotoid('snippet-${id}')"
      >...</span>`)
      // console.log({content})

    } else {
        
      content = content.replace(match[0], snippet)
      content = content.replace(/\(\(|\)\)/g, '')
  
    }

  }

  return content

}

export { getSnippets, insertSnippets }