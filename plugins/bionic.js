// Function to enable bionic reading for all text nodes
function enableBionic({ root = document.body, settings = window.settings } = {} ) {

  // Array of functions to replace text
  let replaceFunctions = []

  // Create a walker to find all text nodes
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, 
    node => {

      // Only accept textnodes whose element parent is visible
      if ( getComputedStyle(node.parentElement).display === 'none' )
        return NodeFilter.FILTER_REJECT
      
      // Skip textnodes whose parent is or is a descendant to a .bionic element
      if ( ['.bionic', '.bionic *'].some( selector => node.parentElement.matches(selector) ) )
        return NodeFilter.FILTER_REJECT

      // If the textnode has no text, skip it
      if ( node.textContent.trim() === '' )
        return NodeFilter.FILTER_REJECT

      return NodeFilter.FILTER_ACCEPT

    }, false)

  console.time('Walked DOM')
  // Loop through all text nodes
  while ( walker.nextNode() ) {
   
    let { currentNode: node } = walker
    let { textContent: text } = node

    // Split the text by spaces
    let html = text.split(' ').map( word => {

      // // If the word is shorter than 4 characters, return it as is
      // if ( word.length < 4 )
      //   return word
      
      let partToBolden = word.slice(0, Math.ceil(word.length * settings.boldnessCutoff))
      let currentWeight = getComputedStyle(node.parentElement).fontWeight
      let newWeight = parseInt(currentWeight) + settings.boldnessIncrement

      return `<span style="text-shadow:1px 0;">${partToBolden}</span>${word.slice(partToBolden.length)}`

    }).join(' ')

    // console.log(newText)

    // If the text changed, create a span to hold the bionic text and replace the text node with it
    replaceFunctions.push( () => {
      let span = document.createElement('span')
      span.classList.add('bionic')
      span.innerHTML = html
      node.parentNode.replaceChild(span, node)
    } )

  }
  console.timeEnd('Walked DOM')

  console.time('Replaced text')
  // Run all the replace functions
  replaceFunctions.forEach( fn => fn() )
  console.timeEnd('Replaced text')
  console.log('Elements replaced:', replaceFunctions.length)

}

y=>0<!--y; export { enableBionic }