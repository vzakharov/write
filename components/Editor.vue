<template>
  <div
    id="editor-wrapper"
    class="cool-shadow"
    :style="{
      'background-color': disabled ? '#eee' : '#fff',
      overflowY: 'scroll',
    }"
  >
    <div 
      id="editor"
      :contenteditable="!disabled"
      style="outline: none"
      v-html="html"
      @input="
        $emit( 'input', $event.target.innerText )
      "
      @blur="blur"
      @keydown.ctrl.z.exact="undo"
      @keydown.ctrl.shift.z="redo"
    />
  </div>
</template>

<script>

  import _ from 'lodash'

  export default {

    props: ['value', 'disabled', 'disableFormatting', 'refresh'],

    data() {
      
      return {

        content: this.value,
        history: [],
        historyIndex: -1,
        afterUndoOrRedo: false,
        
      }
    },

    computed: {

      html() {

          let { content } = this

          if (!content) {

            return ''

          }
          // Break content into paragraphs, wrapping each paragraph in a respective tag
          content = content?.split(/\n+/).map( paragraph => {
            
            let
              tag = 'p',
              attributes = '',
              headingRegex = /^(#+)(\s)/,
              headingLevel = headingRegex.exec(paragraph)?.[1].length,
              bulletRegex = /^([\*-])(\s+)/,
              numberedRegex = /^(\d+)\.\s+/,
              ctaRegex = /^(\[)(.+)(\])$/,
              hrRegex = /^(---)$/

            if ( !this.disableFormatting ) {

              const grayOut = text => `<span style="color: #ccc">${text}</span>`

              if ( headingLevel ) {
                tag = `h${headingLevel}`
                paragraph = paragraph.replace( headingRegex, grayOut('$1')+'$2' )
              } else if ( bulletRegex.test(paragraph) ) {
                tag = 'li'
                paragraph = paragraph.replace( bulletRegex, grayOut('$1')+'$2' )
              } else if ( numberedRegex.test(paragraph) ) {
                tag = 'p'
                attributes = ' class="pseudo-li"'
                paragraph = paragraph.replace( numberedRegex, 
                  '<span style="width: 1em; display: inline-block;"><strong>$1</strong>.&nbsp;</span>'
                )
              } else if ( ctaRegex.test(paragraph) ) {
                paragraph = paragraph.replace( ctaRegex, 
                  `<button class="btn btn-primary">${grayOut('$1')}$2${grayOut('$3')}</button>`
                )
              } else if ( hrRegex.test(paragraph) ) {
                attributes = ' class="hr"'
              }

              // If the paragraph is empty, add a heigh 1em attribute to the paragraph tag
              if ( !paragraph.trim() ) {
                attributes = ' style="min-height: 1em"'
              } else {

                let
                  boldOrItalicRegex = /(\*{1,2})(\S.*?\S)(\*{1,2})/g,
                  boldOrItalic = boldOrItalicRegex.exec(paragraph)?.[1].length

                if ( boldOrItalic ) {
                  let formatTag = ['em', 'strong'][boldOrItalic - 1]
                  paragraph = paragraph.replace( boldOrItalicRegex, 
                    `${grayOut('$1')}<${formatTag}>$2</${formatTag}>${grayOut('$3')}`
                  )
                }

                let linkRegex = /(\[)(.+?)(\]\(.+?\))/g

                if ( linkRegex.test(paragraph) ) {
                  paragraph = paragraph.replace( linkRegex, 
                    `${grayOut('$1')}<a href="$4">$2</a>${grayOut('$3')}`
                  )
                }

                let highlightRegex = /^(=+) (.+?) (=+)$/

                if ( highlightRegex.test(paragraph) ) {
                  let numOfEqualSigns = paragraph.match(highlightRegex)?.[1].length
                  let highlightColorsByLevel = [
                    // light green
                    '#b3ffd9',
                    // light yellow
                    '#ffffb3',
                    // light blue
                    '#b3d9ff',
                    // pleasantly pink
                    '#ffb3ff',
                  ]
                  paragraph = paragraph.replace( highlightRegex, 
                    `${grayOut('$1')}<mark style="background-color: ${highlightColorsByLevel[numOfEqualSigns - 1]}"> $2 </mark>${grayOut('$3')}`
                  )
                }

                let blockquoteRegex = /^(>\s+)(.+)/

                if ( blockquoteRegex.test(paragraph) ) {
                  paragraph = paragraph.replace( blockquoteRegex, 
                    `<blockquote>${grayOut('$1')}$2</blockquote>`
                  )
                }


              }

            }
            
            return `<${tag}${attributes}>${paragraph}</${tag}>`

          }).join('\n')

          // Enclose any content within /* */ (including newlines) in <small> tags and add a .comment class
          content = content.replace(/\/\*[\s\S]*?\*\//g, `<small class="comment">$&</small>`)

          // Make all content within {{}} hidden, witht he ability to switch back and forth
          content = content.replace(/(<p>{{<\/p>)([\s\S]*?)(<p>}}<\/p>)/g,
            '<div class="pre-hide" data-show="👀">$1</div><div class="hide muffled">$2</div><div class="post-hide">$3</div>')

          // For every .pre-hide span, add an onclick event that toggles the .hide div
          this.$nextTick(() => document.querySelectorAll('.pre-hide').forEach( div => {
            div.onclick = () => {
              let element = div.nextElementSibling
              console.log(element)
              element.classList.toggle('hide')
              div.setAttribute('data-show', element.classList.contains('hide') ? '👀' : '🙈')
            }
          }))
          
          return content

      }

    },

    methods: {

      blur($event) {
        // Only fire if the active element is not the editor
        if ( document.activeElement !== $event.target ) {
          this.content = this.value
        }
      },

      undo() {
        console.log('undo')
        this.walkHistory(1)
      },

      redo() {
        console.log('redo')
        this.walkHistory(-1)
      },

      walkHistory(direction) {

        console.log(this.historyIndex)

        let { history } = this

        if ( history.length ) {

          this.historyIndex += direction

          if ( this.historyIndex < 0 ) {
            this.historyIndex = 0
          } else if ( this.historyIndex >= history.length ) {
            this.historyIndex = history.length - 1
          }

          let {
            caretPosition, content 
          } = history[this.historyIndex]

          this.caretPosition = caretPosition
          this.afterUndoOrRedo = true
          this.$emit('input', content)

        }

      },

      setCaretPosition(caretPosition) {

        let walker = document.createTreeWalker(
          editor, NodeFilter.SHOW_ALL,
          node => {
            if ( caretPosition <= getText(node).length ) {
              if ( node.nodeType === Node.TEXT_NODE ) {
                // console.log('accepting', node)
                return NodeFilter.FILTER_ACCEPT
              } else {
                // console.log('skipping', node)
                return NodeFilter.FILTER_SKIP
              }
            } else {
              caretPosition -= getText(node).length
              if ( node.nodeType === Node.ELEMENT_NODE && window.getComputedStyle(node).display === 'block' ) {
                caretPosition--
              }
              // console.log('rejecting', node, 'caretPosition', caretPosition)
              return NodeFilter.FILTER_REJECT
            }
          }
        )
        
        let node = walker.nextNode()
        
        // console.log(node)

        // Set the caret position
        let range = document.createRange()

        if ( node ) {
          range.setStart(node, caretPosition)
          range.collapse(true)
        } else {
          range.selectNodeContents(editor)
          range.collapse(false)
        }

        selection.removeAllRanges()
        selection.addRange(range)

      }

    },

    watch: {

      refresh() {
        this.content = this.value
      },

      content() {
        // Scroll to bottom of editor
        // this.$nextTick(() => {
        //   let editor = document.getElementById('editor')
        //   editor.scrollTop = editor.scrollHeight
        // })
      },

      value(value) {

        let { history, content, afterUndoOrRedo, caretPosition } = this

        // Remember current caret position if needed; set content to value; restore caret position

        this.$nextTick(() => {

          let { caretPosition } = this

          if ( afterUndoOrRedo ) {

            this.afterUndoOrRedo = false
            
          } else {
         
            // First, get the current caret position
            // To do this, we find all text nodes descending from the editor until we find the one that contains the caret
            let editor = document.getElementById('editor')
            let selection = window.getSelection()
            let { anchorNode, anchorOffset } = selection

            // If the anchorNode is not within the editor, return
            if ( !editor.contains(anchorNode) ) {
              return
            }

            let caretPosition = 0
            let getText = node => node?.innerText || node?.textContent || ''

            let walker = document.createTreeWalker(
              // We start at the editor element
              editor                
              // We want text & element nodes
            , NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
            , node => {
                if ( node.contains(anchorNode) ) {
                  // Is the text the same as the anchorNode?
                  if ( getText(node) === getText(anchorNode) ) {
                    // If so, we've reached the anchorNode
                    // console.log('accepting', node)
                    // If it's a newline, add 1 to the caret position
                    if ( getText(node) === '\n' ) {
                      caretPosition++
                    }
                    return NodeFilter.FILTER_ACCEPT
                  } else {
                    // If not, we need to keep looking deeper
                    // console.log('skipping', node)
                    return NodeFilter.FILTER_SKIP
                  }
                } else {
                  caretPosition += getText(node).length
                  // If it's a newline-containing element, add 1 to the caret position
                  if ( node.nodeType === Node.ELEMENT_NODE && window.getComputedStyle(node).display === 'block' ) {
                    caretPosition++
                  }
                  // console.log('rejecting', node, 'caretPosition', caretPosition)
                  return NodeFilter.FILTER_REJECT
                }
              }
            )

            walker.nextNode()
            caretPosition += anchorOffset

            // console.log({ caretPosition })

            // Delete all history entries with a lesser index than the current history index
            history.splice(0, this.historyIndex - 1)
            // Add the current content and caret position to the history

          }

          this.content = value

          // Now, restore the caret position
          this.$nextTick( () => this.setCaretPosition(caretPosition) )

        })


      }
      
    }

  }

</script>

<style scoped>

  #editor-wrapper {
    font-size: 1.1em;
    font-family: 'Georgia', serif;
    /* Rounded shadow, no borders */
    border-radius: 5px;

    height: calc(100vh - 120px);
    padding: 80px 60px 200px 60px;
    
    background-color: #fff;
  }

  * >>> h1, * >>> h2, * >>> h3, * >>> h4, * >>> h5, * >>> h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  * >>> .comment {
    /* Gray-green color */
    color: #5f9ea0;
  }

  /* Indent li */
  * >>> li {
    margin-left: 1em;
  }

  * >>> .pseudo-li {
    /* Gray-green color */
    margin-left: 3em;
    text-indent: -1em;
  }

  /* Add a margin-top to a p after an li */
  * >>> li + p {
    margin-top: 1em;
  }

  * >>> .hide {
    position: fixed;
    z-index: -1;
    height: 0;
  }

  * >>> .pre-hide:after {
    cursor: pointer;
    content: attr(data-show);
    color: #5f9ea0;
    font-family: sans-serif;
    font-size: 0.8em;
  }

  * >>> .pre-hide, * >>> .post-hide, * >>> .pre-hide p, * >>> .post-hide p {
    display: inline;
    /* Gray and small*/
    color: #ccc;
    font-size: 0.8em;
  }

  * >>> mark {
    /* Bright yellow */
    background-color: #ffd700;
  }

  * >>> .muffled {
    color: #ccc;
    background-color: #fff;
  }

  * >>> .muffled * {
    color: inherit;
    background-color: inherit;
    font-size: 75%;
    border: 0;
  }

  * >>> blockquote {
    /* Border on the left + indent */
    border-left: 4px solid #ddd;
    margin-left: 1em;
    padding-left: 1em;
  }

  * >>> .hr {
    /* Gray and small */
    color: #ccc;
    font-size: 0.8em;
    margin-top: 3em;
    margin-bottom: 2em;
    border: 0;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  

</style>