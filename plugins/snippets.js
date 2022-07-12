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

  // Find bits starting with an uppercase and ending with ...
  let snippetInsertionRegex = /(([A-Z][\w\s]+?)\.\.\.)/g
  // console.log(snippetInsertionRegex)
  let match
  let ids = {}
  let last_id = 1
  while ( match = snippetInsertionRegex.exec(content) ) {

    // console.log({match})

    // Find a snippet starting with the same text
    let text = match[2]
    let snippet = snippets.find( snippet => snippet.startsWith(text) )
    if ( !snippet ) {
      // console.warn('No snippet found for: ' + text)
      continue
    }

    if ( insertAsHtml ) {

      let id = ids[text]
      if ( !ids[text] ) {
        id = ids[text] = last_id++
        // Put an anchor on the original snippet text
        content = content.replace(`((${text}`, `((${text}<span id="snippet-${id}"></span>`)
      }

      content = content.replace(match[0], `${text}<span 
        class="snippet"
        data-snippet="${snippet.replace(text, '')}"
        onclick="gotoid('snippet-${id}')"
      >...</span>`)

    } else {
        
      content = content.replace(match[0], snippet)
      content = content.replace(/\(\(|\)\)/g, '')
  
    }

  }

  return content

}

export { getSnippets, insertSnippets }