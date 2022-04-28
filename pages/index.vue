<template>
  <!-- A eimple editor with a sidebar. Save on Ctrl+S -->
  <b-container 
    fluid
    class="px-0"
    v-if="doc"
    style="overflow: hidden"
    @keydown.ctrl.s.prevent="save"
  >
    <!-- Toolbar -->
    <div 
      class="d-flex justify-content-start align-items-center sticky-top pb-1 border"
    >

      <!-- Toggle sidebar -->
      <b-button
        @click="() => showSidebar = !showSidebar"
        size="sm"
        :variant="showSidebar ? 'outline-secondary' : 'light'"
        class="m-1"
      >
        ≡
      </b-button>

      <!-- Start/stop doc timer -->
      <b-button
        class="m-1"
        @click="() => {
          if ( !docTimer ) {
            startDocTimer()
          } else {
            window.clearInterval(docTimer)
            docTimer = null
          }
        }"
        size="sm"
        :variant="docTimer ? 'outline-danger' : 'success'"
      >
        {{ docTimer ? 'Stop timer' : 'Start timer' }}
      </b-button>

      <!-- Doc time formatted as hh:mm:ss -->
      <b-form-input
        class="m-1"
        v-model="docTimeAsHHMMSS"
        type="text"
        size="sm"
        variant="outline-secondary"
        style="max-width: 100px"
      />

      <!-- Switch to autostart the doc timer on content change -->
      <b-check
        v-model="autoStartDocTimer"
        size="sm"
        variant="outline-secondary"
        class="m-1"
        switch
      >
        Start on input
      </b-check>

    </div>

    <b-row
      id="workspace"
      :style="{
        '--full-height': `calc(100vh - ${workspaceTop}px)`,
      }"
      class="full-height px-2"
    >
      <!-- Sidebar, toggleable. On small screens, it has absolute positioning -->
      <b-col
        v-show="showSidebar"
        :class="{
          'position-absolute': width < 768,
          'cool-shadow bg-white full-height': true
        }"
        :style="{
          opacity: width < 768 && 0.9,
          overflowY: 'auto',
          fontSize: '0.7em',
          zIndex: 1,
        }"
        cols="8" md="5" lg="4" xl="3"
      >
        <!-- List of documents, their content cut with ellipsis -->
        <b-row
          v-for="(d, key) in docs"
          :key="key"
        >
          <b-col
            cols="9"
            class="p-2"
            v-text="
              computeTitle(d)
              || 
              createdDateAndTime(d)
            "
            :style="{
              //'cursor: pointer; overflow: hidden; white-space: nowrap; text-overflow: ellipsis': true,
              cursor: 'pointer', overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis',
              // gray italic if no content
              ...( !d.content.trim() && {
                'font-style': 'italic',
                'color': '#868686'
              } ),
              // bold if current
              ...( d === doc && {
                'font-weight': 'bold'
              } )
            }"
            @click="
              doc = d
              $router.push({
                query: {
                  id: d.id
                }
              })
            "
          />
          <!-- Delete icon, not shown if there is just one document -->
          <b-col>
            <b-button-close
              v-if="docs.length > 1"
              size="sm"
              @click="
                if ( window.confirm('Are you sure? THERE IS NO UNDO!') ) {
                  doc = docs[key - 1] || docs[key + 1] || null
                  docs = without(docs, d)
                }
              "
            />
          </b-col>
        </b-row>
        <!-- Add new document button -->
        <b-button
          class="mt-2"
          @click="
            doc = newDoc()
            docs = [...docs, doc]
          "
          size="sm"
          variant="outline-secondary"
        >
          +
        </b-button>

        <!-- History of wordcount vs time -->
        <template
          v-if="doc.history && doc.history.length"
        >
          <h5
            class="mt-4"
          >
            Revision history
          </h5>

          <!-- Switch between chart/table button -->
          <b-button
            size="sm"
            class="mt-2"
            variant="outline-secondary"
            @click="showHistoryChart = !showHistoryChart"
          >
            {{ showHistoryChart ? 'Table' : 'Chart' }}
          </b-button>

          <canvas
            :style="{
              display: showHistoryChart ? 'block' : 'none'
            }"
            :id="'history-chart'"
          />

          <b-table
            v-if="!showHistoryChart"
            sort-by="time"
            sort-desc
            :items="doc.history"
            :fields="[
              {
                key: 'time',
                label: 'Time'
              },
              {
                key: 'content',
                label: 'Words',
                formatter: getWordcount
              },
              {
                key: 'remove',
                label: ''
              }
            ]"
          >

            <template #cell(time)="{ item }">
              <!-- Button to preview content at that time; sets historyPreview to that item -->
              <span
                v-text="timeAsHHMMSS(item.time)"
                :style="{
                  cursor: 'pointer',
                  'font-weight': item === historyPreview ? 'bold' : 'normal'
                }"
                @click="
                  historyPreview = item
                "
                @mouseover="
                  historyPreview = item
                "
                @mouseleave="
                  window.setTimeout(() => {
                    historyPreview == item && ( historyPreview = null )
                  }, 1000)
                "
              />
            </template>

            <template #cell(remove)="{ item }">
              <b-button-close
                v-if="doc.history.indexOf(item) > 0"
                size="sm"
                @click="() => {
                  if ( window.confirm('Are you sure? THERE IS NO UNDO!') ) {
                    let i = doc.history.indexOf(item)
                    doc.history = without(doc.history, item)
                    // recalculate delta
                    $set( doc.history[i], 'delta', withDelta( 'create', doc.history[i-1].content, doc.history[i].content ) )
                  }
                }"
              />
            </template>

          </b-table>
          <!-- Button to exit preview -->
          <b-button
            v-if="historyPreview"
            class="mt-2"
            @click="
              historyPreview = null
            "
            size="sm"
            variant="outline-secondary"
          >
            Exit preview
          </b-button>
          
          <!-- Clear history button -->
          <b-button
            class="mt-2"
            @click="
              if ( window.confirm('Are you sure? THERE IS NO UNDO!') ) {
                doc.history = []
              }
            "
            size="sm"
            variant="outline-secondary"
          >
            Clear history
          </b-button>

          <!-- Copy as TSV button -->
          <b-button
            class="mt-2"
            @click="
              copyToClipboard(
                `hours\twords\n${doc.history.map(
                  item => `${item.time/3600}\t${getWordcount(item.content)}`
                ).join('\n')}`
              )
            "
            size="sm"
            variant="outline-secondary"
          >
            Copy as TSV
          </b-button>

          <!-- Prune history (remove entries spaced less than 1 minute apart) -->
          <b-button
            class="mt-2"
            @click="pruneHistory"
            size="sm"
            variant="outline-secondary"
          >
            Prune history
          </b-button>

          <!-- Switch chart mode -->
          <b-check
            v-model="chartMode"
            :value="0"
            :unchecked-value="1"
            switch
            class="mt-2"
            size="sm"
            variant="outline-secondary"
          >
            Show wph vs words
          </b-check>

        </template>

      </b-col>

      <!-- Main content -->
      <b-col
        class="full-height bg-light pt-4"
        style="overflow: auto;"
      >
        <div 
          :style="{
            maxWidth: '900px',
            margin: '0 auto',
          }"
        >
          <!-- Editor div -->


          <Editor 
            v-model="(historyPreview || doc).content"
            :refresh="historyPreview && historyPreview.time || doc.id"
            v-bind="{ disableFormatting }"
          />

          <div 
            class="d-flex justify-content-start align-items-center sticky-top px-2 py-1 border"
            style="gap: 1rem;"
          >
            <!-- Switch to disable formatting -->
            <b-check
              v-model="disableFormatting"
              size="sm"
              variant="outline-secondary"
              switch
            >
              Disable formatting
            </b-check>
            <!-- Button to copy content -->
            <b-button
              @click="
                copyToClipboard(
                  removeComments(( historyPreview || doc ).content)
                )
              "
              size="sm"
              variant="outline-secondary"
            >
              Copy to clipboard
            </b-button>
            <!-- Wordcount in small text on the right -->
            <div
              class="small ml-auto text-muted"
            >
              {{ wordcount }} {{ wordcount === 1 ? 'word' : 'words' }}
              <!-- Words per hour -->
              ~{{ Math.round(wordcount / ( historyPreview || doc ).time * 3600 / 10 ) * 10 }} words/hour
            </div>
          </div>

        </div>


      </b-col>
    </b-row>
  </b-container>
</template>

<script>

  // const { assign } = Object

  import _ from 'lodash'
  const {
    findIndex, without
  } = _

  import Chart from 'chart.js/auto'
  import fossilDelta from 'fossil-delta'



  function newDoc() {
    return {
      content: '',
      created: Date.now(),
      id: Math.round( Date.now() + Math.random() ) * 1000,
      history: [{
        time: 0,
        content: ''
      }]
    }
  }

  export default {

    head() {

      let 
        preTitle = '',
        { doc } = this

      if ( doc )
        preTitle = (
          this.computeTitle(this.doc) || this.createdDateAndTime( this.doc?.created )
        ) + ' · '

      return {
        // Extract first line from doc content (starting and ending with a \w). Otherwise take created
        title: preTitle + 'Write.'
      }

    },

    data() {

      return {
        mounted: false,
        showSidebar: null,
        width: null,
        tempContent: null,
        workspaceTop: 0,
        docs: null,
        doc: null,
        docChanged: true,
        window: null,
        docTimer: null,
        idleTimer: null,
        historyPreview: null,
        showHistoryChart: true,
        historyChart: null,
        autoStartDocTimer: true,
        disableFormatting: false,
        console,
        document,
        chartMode: 1,
        saved: false,
      }

    },

    mounted() {

      // Load all doc_[id] keys from localStorage and add them to docs
      this.docs =
        _( localStorage )
        .keys()
        .filter( key => key.startsWith( 'doc_' ) )
        .map( key => JSON.parse( localStorage.getItem( key ) ) )
        .value()
      
      if ( !this.docs.length ) {
        this.docs = [ newDoc() ]
      }
      
      this.doc = 
        _.find( this.docs, {
          id: Number( this.$route.query.id || localStorage.getItem( 'lastDocId' ) )
        } ) 
        || this.docs[0]

      const onResize = () => {
        this.width = window.innerWidth
        this.workspaceTop = document.getElementById('workspace').offsetTop
        this.showSidebar = this.width >= 768
      }

      // Monitor innerWidth to toggle sidebar
      window.addEventListener('resize', onResize)

      this.window = window

      
      this.mounted = true

      this.$nextTick(() => {

        onResize()

        this.$watch('chartConfig', { immediate: true, handler(config) {

          let chartElement = document.getElementById('history-chart')
          // console.log(chartElement)
          if ( !this.historyChart ) {
            this.historyChart = new Chart(
              chartElement, config
            )
          } else {

            Object.assign( this.historyChart, config )
            this.historyChart.update()

          }

        }})
        
      })

    },

    computed: {

      content: {
        get() {
          return ( this.historyPreview || this.doc ).content.trim()
          // return this.historyPreview?.content || this.tempContent
        },

        set(value) {
          ( this.historyPreview || this.doc ).content = value
        }
      },

      formattedContent: {

        get() {
          let { content } = this
          // Break content into paragraphs, wrapping each paragraph in a respective tag
          content = content.split('\n+').map( paragraph => {

            return `<p>${paragraph}</p>`

          }).join('\n') || '<p></p>'
          
          return content
        },

        set(value) {
          this.content = value.replace(/(?!\*\*)(<strong>.+?<\/strong>(?!\*\*))/g, '**$1**')
        }

      },

      docTimeAsHHMMSS: {
          
          get() {
  
            return this.timeAsHHMMSS( this.doc.time )
  
          },
  
          set( value ) {
  
            const {
              doc
            } = this

            // Check format for \d\d:\d\d:\d\d
            if ( !value.match( /^\d\d?:\d\d:\d\d$/ ) ) {
              return
            }
  
            const [hh, mm, ss] = value.split(':')
  
            doc.time = Number( hh ) * 3600 + Number( mm ) * 60 + Number( ss )
  
          }
  
      },

      wordcount() {
        let { content } = this.historyPreview || this.doc
        return this.getWordcount( content )

      },

      chartConfig() {

        let { 
          chartMode
        } = this

        return {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: chartMode ?  'Words vs minutes' : 'Words per hour vs words',
                backgroundColor: 'rgba(54,162,235,0.2)',
                borderColor: 'rgba(54,162,235,1)',
                data: [
                  ...this.doc.history?.map( ({ time, content }) => {

                    let words = this.getWordcount( content )

                    return chartMode ? {
                      x: time/60,
                      y: words
                    } : {
                      x: words,
                      y: words / ( time / 3600 )
                    }
                  }),
                  // ...!this.historyPreview && this.doc.time && this.wordcount ? [{ x: this.doc.time/60, y: this.wordcount }] : []
                ]
              }
            ]
          },
          options: {
            // Disable animation
            animation: {
              duration: 0,
            },
            // x and y min is 0
            scales: {
              x: {
                min: 0
              },
              y: {
                min: 0
              }
            },
            onHover: (event, [ item ]) =>{
              // console.log(item)
              if ( item ) {
                // Find the doc corresponding to the item
                // console.log(item)
                const doc = this.doc.history[item.index]
                // Set preview to the doc
                this.historyPreview = doc
                // console.log(doc)
              } else {
                const doc = this.historyPreview
                // Clear preview after a while
                setTimeout(() => {
                  this.historyPreview == doc && (this.historyPreview = null)
                }, 1000)
              }
            }
          },
        }
      },

    },

    methods: {

      computeTitle(doc) {
        return doc?.content?.match(/\w.*\w/)?.[0]
      },

      createdDateAndTime(d) {
        // Created date and time written as e.g. 'Thu, Apr 10, 10:00 am'
        return new Date(d.created).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        })
      },

      pruneHistory() {

        // Remove all history items whose time is spaced less than 60 seconds apart
        let { history } = this.doc
        let i = 1
        while ( i < history.length ) {
          let timeBetween = history[i].time - history[i-1].time
          if ( timeBetween < 60 ) {
            this.$delete( history, i )
          } else {
            // recalculate delta
            this.$set( history[i], 'delta', this.withDelta( 'create', history[i-1].content, history[i].content ) )
            i++
          }
        }

      },

      copyToClipboard( text ) {
        navigator.clipboard.writeText( text )
        // Show bvtoast
        this.$bvToast.toast( 'Copied to clipboard', {
          title: 'Copied!',
          autoHideDelay: 2000,
          appendToast: true,
          variant: 'success'
        })
      },

      startDocTimer() {

        if ( typeof this.doc.time === 'undefined' ) {
          this.$set( this.doc, 'time', 0 )
        }

        if ( !this.docTimer )
          this.docTimer = setInterval(() => {
            this.doc.time += 1
          }, 1000)

      },

      timeAsHHMMSS( time ) {

        if ( !time )
          return '--:--:--'

        const hh = Math.floor( time / 3600 )
        const mm = Math.floor( ( time - hh * 3600 ) / 60 )
        const ss = time - hh * 3600 - mm * 60

        return `${hh}:${mm < 10 ? '0' : ''}${mm}:${ss < 10 ? '0' : ''}${ss}`

      },

      removeComments( content ) {
        // Remove any content within /* */ (including newlines) for the sake of wordcount
        content = content.replace( /\/\*[\s\S]*?\*\//g, '' )

        // Convert any >3 newlines to 2 newlines
        content = content.replace( /\n{3,}/g, '\n\n' )

        content = content.trim()

        return content
      },

      getWordcount( content ) {

        if ( !(content?.trim()) )
          return 0

        // Strip HTML tags
        // let stripped = content.replace( /<[^>]+>/g, ' ' )
        // console.log('stripped', stripped)

        content = this.removeComments(content)

        let words = content.split( /[^\w-]+/ ).filter( word => word.trim() )
        // console.log('words', words)
        return words.length

      },

      withDelta( action, ...texts ) {

        let bytes = texts.map( text => new TextEncoder()?.encode( text ) )
        let resultBytes = fossilDelta[action]( ...bytes ) // action is 'create' or 'apply'
        let result = new TextDecoder().decode( Uint8Array.from( resultBytes ) )

        return result

      },

      save() {
            
        // Save current content to history, creating it if it doesn't exist
        let history = doc.history || this.$set( doc, 'history', [] )

        // Push current content to history
        let { time, content } = doc
        history.push({
          time,
          content,
          delta: history.length && this.withDelta( 'create', history[history.length - 1].content, content )
        })

        localStorage.setItem(`doc_${doc.id}`, JSON.stringify({
          ...doc,
          history: _.map(doc.history, ( item, i ) =>
            // Remove 'content' for space saving
            i ? _.omit( item, 'content' ) : item
          )
        }))

        // Show a "Saved!" toast
        this.saved = true

      },

      newDoc, without, findIndex

    },

    watch: {

      'doc.id': {

        handler() {

          // Change tempContent on doc change
          this.tempContent = this.doc.content

          // Focus editor
          this.$nextTick(() => {
            document.getElementById('editor')?.focus()
          })

          // Write the last doc id to localStorage
          localStorage.setItem( 'lastDocId', this.doc.id )

          let { history } = this.doc

          for ( let i = 1; i < history?.length; i++ ) {
            let [ before, after ] = [ i - 1, i ].map( index => history[index].content )
            let { delta } = history[i]            
            let deltaDefined = typeof delta !== 'undefined'
            let missingKey = deltaDefined ? 'content' : 'delta'
            let missingValue = this.withDelta(
              deltaDefined ? 'apply' : 'create',
              before,
              deltaDefined ? delta : after
            )

            this.$set( 
              history[i],
              missingKey,
              missingValue
            )

          }

          this.docChanged = true

        }

      },

      'doc.content': {

        handler() {
          
          let {
            doc
          } = this

          // Exit if the doc itself is different (not just content)
          if ( this.docChanged ) {
            this.docChanged = false
            return
          }

          // Reset the idle timer
          clearTimeout( this.idleTimer )

          this.idleTimer = setTimeout(this.save, 5000)

          // Start doc timer
          if ( this.autoStartDocTimer )
            this.startDocTimer()

        }

      },

      doc: {

        // Write to localStorage under key = 'doc_[doc.id]'
        handler() {
          
          this.saved = false

        },

        deep: true

      },

      docs: {

        // Delete any doc_[doc.id] keys from localStorage if they are not in docs
        handler(docs) {

          _( localStorage )
          .keys()
          .filter( key => key.startsWith( 'doc_' ) )
          .filter( key => !docs.find( doc => doc.id === parseInt( key.replace( 'doc_', '' ) ) ) )
          .forEach( key => localStorage.removeItem( key ) )

        },

      }



    }

  }

</script>

<style>

[contenteditable]:empty:after {
  content: 'Hello world!';
  color: #999;
}

.full-height {
  height: calc(100vh - 48px);
  /*var(--full-height);*/
}

/* Hide ql toolbar */
.ql-toolbar {
  display: none;
}

.cool-shadow {
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

</style>