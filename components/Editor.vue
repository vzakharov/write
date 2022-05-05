<template>
  <div
    id="editor-wrapper"
    class="cool-shadow"
    :style="{
      'background-color': readonly ? '#eee' : '#fff',
      overflowY: 'scroll',
    }"
  >
    <div 
      id="editor"
      :contenteditable="!readonly"
      :style="{
        outline: 'none',
        zoom: zoom + '%',
      }"
      v-html="html"
      @input="
        !readonly && $emit( 'input', $event.target.innerText )
      "
      @blur="blur"
      @keydown.ctrl.z.exact="undo"
      @keydown.ctrl.shift.z="redo"
    />
  </div>
</template>

<script>

  import _ from 'lodash'
  import { diffChars, diffWords } from 'diff'


  const { 
    assign
  } = Object

  let getText = node => node?.innerText || node?.textContent || ''

  export default {

    props: {
      value: {
        default: '',
      },
      readonly: {
        default: false,
      },
      disableFormatting: {
        default: false,
      },
      refresh: {
        default: false,
      },
      zoom: {
        default: 100,
      },
    },

    data() {

      let content = this.value || ''
      let caretPosition = this.value.length
      
      return {

        content,
        caretPosition,
        past: [{ content, caretPosition }],
        future: [], 
        afterUndoOrRedo: false
        
      }
    },

    computed: {

      html() {

          let { content } = this

          if (!content) {

            return ''

          }
          // Break content into paragraphs, wrapping each paragraph in a respective tag
          content = content?.split(/\n\n|\n/).map( paragraph => {

            paragraph = paragraph.trim()
            
            let
              tag = 'p',
              attributes = '',
              headingRegex = /^(#+)(\s)/,
              headingLevel = headingRegex.exec(paragraph)?.[1].length,
              numberedRegex = /^(\d+)\.\s+/,
              bulletRegex = /^([\*-])(\s+)/,
              ctaRegex = /^(\[)(.+)(\])$/,
              hrRegex = /^(---)$/,
              commentRegex = /^(\/\/)(.+)$/

            if ( !this.disableFormatting ) {

              const grayOut = text => `<span style="color: #ccc">${text}</span>`

              if ( headingLevel ) {
                tag = `h${headingLevel}`
                paragraph = paragraph.replace( headingRegex, grayOut('$1')+'$2' )
              } else if ( numberedRegex.test(paragraph) ) {
                tag = 'p'
                attributes = ' class="li-numbered"'
                paragraph = paragraph.replace( numberedRegex, 
                  '<span style="width: 1em; display: inline-block;"><strong>$1</strong>.&nbsp;</span>'
                )
              } else if ( bulletRegex.test(paragraph) ) {
                tag = 'p'
                attributes = ' class="li-bullet"'
                paragraph = paragraph.replace( bulletRegex,
                  `${grayOut('$1')}$2`
                )
              } else if ( ctaRegex.test(paragraph) ) {
                paragraph = paragraph.replace( ctaRegex, 
                  `<button class="btn btn-primary">${grayOut('$1')}$2${grayOut('$3')}</button>`
                )
              } else if ( hrRegex.test(paragraph) ) {
                attributes = ' class="hr"'
              } else if ( commentRegex.test(paragraph) ) {
                attributes = ' class="comment"'
              }

              // If the paragraph is empty, add a heigh 1em attribute to the paragraph tag
              if ( !paragraph.trim() ) {
                attributes = ' style="min-height: 1em"'
              } else {

                let boldRegex = /\*\*([^*]+?)\*\*/g

                if ( boldRegex.test(paragraph) ) {
                  paragraph = paragraph.replace( boldRegex, 
                    `${grayOut('**')}<strong>$1</strong>${grayOut('**')}`
                  )
                }

                let italicRegex = /([^*])(\*)(\w[^*]+?)\2/g

                if ( italicRegex.test(paragraph) ) {
                  paragraph = paragraph.replace( italicRegex, 
                    `$1${grayOut('$2')}<em>$3</em>${grayOut('$2')}`
                  )
                }


                let linkRegex = /(\[)(.+?)(\]\(.+?\))/g

                if ( linkRegex.test(paragraph) ) {
                  paragraph = paragraph.replace( linkRegex, 
                    `${grayOut('$1')}<a href="$4">$2</a>${grayOut('$3')}`
                  )
                }

                let highlightRegex = /^(=+) (.+?) \1$/

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
                    `${grayOut('$1')}<mark style="background-color: ${highlightColorsByLevel[numOfEqualSigns - 1]}"> $2 </mark>${grayOut('$1')}`
                  )
                }

                let blockquoteRegex = /^(>\s+)/

                if ( blockquoteRegex.test(paragraph) ) {
                  tag = 'blockquote'
                  paragraph = paragraph.replace( blockquoteRegex, 
                    `${grayOut('$1')}`
                  )
                }


              }

            }
            
            return `<${tag}${attributes}>${paragraph}</${tag}>`

          }).join('\n')

          // Multiline comments: Enclose any content within /* */ (including newlines) in a .comment class
          content = content.replace(/\/\*[\s\S]*?\*\//g, `<div class="comment">$&</div>`)

          // Make all content within {{}} hidden, witht he ability to switch back and forth
          content = content.replace(/(<p>{{(\+?)<\/p>)([\s\S]*?)(<p>}}<\/p>)/g,
            `<div class="pre-hide">$1</div><div data-show="$2" class="hide muffled">$3</div><div class="post-hide">$4</div>`)

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
        this.traverse('past', 'future')     
      },

      redo() {
        console.log('redo')
        this.traverse('future', 'past')
      },

      traverse(fromKey, toKey) {
        if (!this[fromKey].length) {
          return
        }
        this[toKey].push(_.pick(this, ['content', 'caretPosition']))
        assign(this, this[fromKey].pop())
        this.afterUndoOrRedo = true
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
        
        let selection = window.getSelection()

        selection.removeAllRanges()
        selection.addRange(range)

      }

    },

    watch: {

      refresh() {
        this.content = this.value
        this.past = []
        this.future = []
      },

      value(value) {

        let { readonly, disableFormatting, afterUndoOrRedo, content, caretPosition } = this

        if ( readonly || disableFormatting )
          return

        if ( afterUndoOrRedo ) {

          this.afterUndoOrRedo = false
          
        } else {

          // Delete all future states (no redo is possible if we made a change)
          this.future = []
          // // Calculate the diff between the last stored state and the current value
          // let diff = this.past.length && diffChars(_.last(this.past).content, value)
          // if ( 
          //   !diff || diff.filter(part => part.added || part.removed).length > 1 
          //   || diff.find(part => part.added || part.removed)?.value.match(/\W$/)
          // ) {
          //   console.log(diff)
            this.past.push({ content, caretPosition })
          //   console.log('past', this.past)
          // }         
          
        
          // Get the current caret position
          // To do this, we find all text nodes descending from the editor until we find the one that contains the caret
          let editor = document.getElementById('editor')
          let selection = window.getSelection()
          let { anchorNode, anchorOffset } = selection

          // If the anchorNode is not within the editor, return
          if ( !editor.contains(anchorNode) ) {
            return
          }

          caretPosition = 0

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

          this.caretPosition = caretPosition


          }

          this.content = value

          // Now, restore the caret position
          this.$nextTick( () => this.setCaretPosition(caretPosition) )

      },

      // past(value) {
      //   console.log('past', JSON.stringify(value))
      // },

      // future(value) {
      //   console.log('future', JSON.stringify(value))
      // }
      
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
    /* Smaller font size */
    font-size: 0.8em;
  }

  * >>> .li-numbered {
    margin-left: 3em;
    text-indent: -1em;
  }

  * >>> .li-bullet {
    margin-left: 3em;
    text-indent: -1.5em;
  }

  * >>> .li-bullet:before {
    content: '•';
    margin-right: 0.5em;
  }

  * >>> .hide:not([data-show='+']) {
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
    cursor: pointer;
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