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
            saved = false
            // Set favicon to a regular icon
            setFavicon('./favicon.png')
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
        Start timer on input
      </b-check>

      <!-- Sync with Notion switch -->
      <b-check
        v-model="settings.write.syncWithNotion"
        size="sm"
        variant="outline-secondary"
        class="m-1"
        switch
      >
        <span
          @contextmenu.prevent="$refs.notionSyncSettings.show()"
        >
          Sync with Notion
        </span>
      </b-check>

      <!-- Notion sync settings modal -->
      <b-modal
        ref="notionSyncSettings"
        id="notion-sync-settings"
        size="sm"
        :title="'Notion sync settings'"
        hide-footer
        centered
        @hidden="
          // if no settings are set, undo the checkbox
          if ( !settings.notionKey || !settings.write.notionDatabaseId ) {
            settings.write.syncWithNotion = false
          }
        "
      >
        <!-- API key -->
        <b-form-group
          label="Notion API key"
          label-for="notionApiKey"
        >
          <b-input
            lazy
            id="notionApiKey"
            v-model="settings.notionKey"
            size="sm"
            type="text"
            placeholder="Enter your Notion API key"
          />
        </b-form-group>
        <!-- Database id -->
        <b-form-group
          label="Notion database ID"
          label-for="notionDatabaseId"
        >
          <b-input
            id="notionDatabaseId"
            v-model="settings.write.notionDatabaseId"
            size="sm"
            type="text"
            placeholder="Enter your Notion database ID"
          />
        </b-form-group>
        <p
          v-if="settings.notionKey && settings.write.notionDatabaseId"
          class="text-success small"
        >
          To open this modal again in the future, right-click the “Sync with Notion” switch.
        </p>
      </b-modal>

    </div>

    <b-row
      id="workspace"
      :style="{
        '--full-height': `calc(100vh - ${workspaceTop}px)`,
      }"
      class="full-height m-0"
    >
      <!-- Sidebar, toggleable. On small screens, it has absolute positioning -->
      <b-col
        v-show="showSidebar"
        :class="{
          'position-absolute': width < 768,
          'cool-shadow bg-white full-height p-2': true
        }"
        :style="{
          opacity: width < 768 && 0.9,
          overflowY: 'auto',
          fontSize: '0.7em',
          zIndex: 1,
        }"
        cols="8" md="5" lg="4" xl="3"
      >

        <!-- Add new document button -->
        <b-button
          class="m-1"
          @click="
            doc = newDoc()
            docs = [...docs, doc]
          "
          size="sm"
          variant="light"
        >
          🗎
        </b-button>

        <!-- Button top open/close list of docs -->
        <b-button
          @click="() => showDocs = !showDocs"
          size="sm"
          :variant="showDocs ? 'outline-secondary' : 'light'"
          class="m-1"
        >
          {{ showDocs ? '🗀' : '🗁' }}
        </b-button>
        <template 
          v-if="showDocs"
        >
          <!-- List of documents, their content cut with ellipsis -->
          <b-row
            v-for="(d, key) in docs"
            :key="key"
            class="m-0"
          >
            <b-col
              cols="9"
              class="p-2"
              :style="{
                overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis',
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
            >
              <nuxt-link
                :to="{ query: { id: d.id } }"
                class="text-secondary"
                v-text="computeTitle(d) || createdDateAndTime(d)"
              />                
            </b-col>
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
        </template>

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

          <!-- Select for chartAxes (options: minutes vs words, minutes vs wph, words vs wph) -->
          <b-select
            v-if="showHistoryChart"
            class="mt-2"
            v-model="chartAxes"
            size="sm"
            variant="outline-secondary"            
            :options="[
              { value: ['minutes', 'words'], text: 'X: minutes, Y: words' },
              { value: ['minutes', 'wph'], text: 'X: minutes, Y: words per hour' },
              { value: ['words', 'wph'], text: 'X: words, Y: words per hour' },
            ]"
          />
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
                label: 'Time',
                formatter: timeAsHHMMSS
              },
              {
                key: 'wordcount',
                label: 'Words'
              },
              {
                key: 'remove',
                label: ''
              }
            ]"
            @row-clicked="item => {
              if ( historyPreviewFixed && historyPreview == item) {
                historyPreview = null
                historyPreviewFixed = false
              } else {
                historyPreview = item
                historyPreviewFixed = true
              }
            }"
            @row-hovered="item => {
              if ( !historyPreviewFixed ) {
                historyPreview = item
                window.clearTimeout(historyPreviewTimeout)
              }
            }"
            @row-unhovered="item => {
              historyPreviewTimeout = window.setTimeout(() => {
                if ( !historyPreviewFixed && historyPreview === item ) {
                  historyPreview = null
                }
              }, 1000)
            }"
            :tbody-tr-class="item => {
              return 'cursor-pointer ' + (
                historyPreview === item ?
                  historyPreviewFixed ?
                    'fixed-tr' :
                    'hovered-tr'
                  : '' 
                )
            }"
          >            

            <template #cell(remove)="{ item }">
              <b-button-close
                v-if="doc.history.indexOf(item) > 0"
                size="sm"
                @click="() => {
                  if ( window.confirm('Are you sure? THERE IS NO UNDO!') ) {
                    let i = doc.history.indexOf(item)
                    doc.history = without(doc.history, item)
                    // recalculate delta unless it's the last item
                    if ( i < doc.history.length ) {
                      $set( doc.history[i], 'delta', withDelta( 'create', doc.history[i-1].content, doc.history[i].content ) )
                    }
                    saved = false
                  }
                }"
              />
            </template>

          </b-table>
          
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
            :value="(historyPreview || doc).content"
            @input="!historyPreview && ( doc.content = $event )"
            :refresh="historyPreview && historyPreview.time || doc.id"
            :readonly="historyPreview"
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
              Copy
            </b-button>

            <!-- Save button -->
            <b-button
              @click="save"
              size="sm"
              :variant="saved || saving ? 'light' : 'outline-danger'"
              :disabled="saved || saving"
            >
              {{ saved ? 'All changes saved.' : saving ? 'Saving...' : 'Save' }}
            </b-button>
          
            <!-- Button to exit preview -->
            <b-button
              v-if="historyPreview && historyPreviewFixed"
              class="mt-2"
              @click="
                historyPreview = null
                historyPreviewFixed = false
              "
              size="sm"
              variant="outline-secondary"
            >
              Exit preview
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
  import { encode } from 'dahnencode'
  import Notion from '~/plugins/notion'


  function newDoc() {
    let created = Date.now()
    return {
      content: '',
      created,
      id: encode(created),
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
        title: preTitle + 'Write.',
        // Favicon
        link: [
          { rel: 'icon', type: 'image/x-icon', href: this.favicon || './favicon.png', hid: 'favicon' },
        ]
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
        historyPreviewFixed: false,
        historyPreviewTimeout: null,
        showHistoryChart: true,
        historyChart: null,
        autoStartDocTimer: true,
        disableFormatting: false,
        console,
        document,
        chartMode: 1,
        chartAxes: ['minutes', 'words'],
        saved: true,
        saving: false,
        showDocs: false,
        favicon: null,
        settings: {
          notionKey: undefined,
          write: {
            syncWithNotion: false,
          }
        },
        notion: null
      }

    },

    mounted() {

      // Load all settings from localStorage and watch them afterwards
      for ( let key in this.settings ) {

        let localValue = localStorage.getItem( key )
        let defaultValue = this.settings[key]

        console.log({ key, localValue, defaultValue })
        
        // If the existing value is an object, we need to parse the localStorage value
        let isObject = typeof defaultValue === 'object'
        let isArray = Array.isArray( defaultValue )
        if ( isObject ) {
          localValue = JSON.parse( localValue || null )
        }

        this.settings[key] = 
          isObject && !isArray ?
            { ...defaultValue, ...localValue }
            : localValue || defaultValue

        this.$watch( 'settings.' + key, { deep: true, handler: value => {
          localStorage.setItem(key, isObject ? JSON.stringify(value) : value)
        }})
      }


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
          id: this.$route.query.id || localStorage.getItem( 'lastDocId' )
        } ) 
        || this.docs[0]

      const onResize = () => {
        this.width = window.innerWidth
        this.workspaceTop = document.getElementById('workspace').offsetTop
        // this.showSidebar = this.width >= 768
      }

      // Monitor innerWidth to toggle sidebar
      window.addEventListener('resize', onResize)

      // If the user intends to leave, check if there are unsaved changes and ask if they want to save
      window.onbeforeunload = event => {
        event.preventDefault()
        if ( !this.saved ) {
          return 'You have unsaved changes. Are you sure you want to leave?'
        }
      }
      console.log('beforeunload listener added')

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
          doc, chartAxes,
        } = this

        let data = doc.history.map( ({ time, content }) => {
          let words = this.getWordcount( content )
          return {
            minutes: time / 60,
            words,
            wph: words / ( time / 3600 )
          }
        } )

        return {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: `${chartAxes[0]} vs ${chartAxes[1]}`,
                backgroundColor: 'rgba(54,162,235,0.2)',
                borderColor: 'rgba(54,162,235,1)',
                data: [
                  ...data?.map( item => ({
                    x: item[chartAxes[0]],
                    y: item[chartAxes[1]]
                  }) ),
                  // ...!this.historyPreview && this.doc.time && this.wordcount ? [{ x: this.doc.time/60, y: this.wordcount }] : []
                ]
              }
            ]
          },
          options: {
            // Do not show dataset label
            plugins: {
              legend: {
                display: false
              }
            },
            // Disable animation
            animation: {
              duration: 0,
            },
            // x and y min is 0
            scales: {
              // x: {
              //   min: 0
              // },
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

      setFavicon( href ) {
        this.favicon = href
      },

      computeTitle(doc) {
        return doc?.content?.match(/\w[\w\s-]*\w|\w/)?.[0]
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

        // Remove all history items whose time is spaced less than 1/60 of the difference between doc.time and the first item's time
        let { history } = this.doc
        let i = 1
        while ( i < history.length ) {
          let timeBetween = history[i].time - history[i-1].time
          if ( timeBetween < ( this.doc.time - history[0].time ) / 60 ) {
            this.$delete( history, i )
            this.saved = false
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

        if ( !this.docTimer ) {
          this.docTimer = setInterval(() => {
            this.doc.time += 1
          }, 1000)

          // Set favicon to a play  icon
          this.setFavicon('./red-play-button.png')

        }


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

        // Remove any content within ^==...==$ (any number of equal signs) for the sake of wordcount
        content = content.replace( /^=+.+?=+$/gm, '' )

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

      async save() {

        if ( this.saving )
          return

        try {
          
          this.saved = false
          this.saving = true
          let { doc } = this
              
          // Save current content to history, creating it if it doesn't exist
          let history = doc.history || this.$set( doc, 'history', [] )

          // Push current content to history
          let { time, content } = doc
          history.push({
            time,
            content,
            delta: history.length && this.withDelta( 'create', history[history.length - 1].content, content )
          })

          let docToSave = {
            ...doc,
            history: _.map(doc.history, ( item, i ) =>
              // Remove 'content' for space saving
              i ? _.omit( item, 'content' ) : item
            )
          }

          localStorage.setItem(`doc_${doc.id}`, JSON.stringify(docToSave))

          if ( this.settings.write.syncWithNotion ) {

            let database_id = this.settings.write.notionDatabaseId
            // Find page with name = doc.id. If none, create one
            let page = await this.notion.getPageBy(
              database_id,
              { localId: doc.id}
            )

            let dataToSave = {
              properties: {
                name: this.computeTitle(doc),
                localId: doc.id,
                time: doc.time,
              },
              content: {
                plain: doc.content
              }
            }

            console.log({ page, dataToSave })

            await this.notion.createPage({
              parent: { database_id },
              ...dataToSave
            })

            if ( page ) {
              // Delete old page; don't wait for it to be deleted
              this.notion.deleteBlock( page.details.id )
            }

          }


          // Show a "Saved!" toast
          console.log('Saved!')
          this.$nextTick( () => this.saved = true )
        
        } catch (e) {

          console.error(e)
          this.$bvToast.toast( 'Error saving: ' + JSON.stringify(e, null, 2), {
            title: 'Error',
            autoHideDelay: 2000,
            appendToast: true,
            variant: 'danger'
          })

        } finally {

          this.saving = false

        }


      },

      newDoc, without, findIndex

    },

    watch: {

      async 'settings.notionKey'( key, oldKey ) {

        if ( key ) {

          console.log('Loading Notion data...')

          this.notion = new Notion(key)


          try {

            console.log('Athenticating...')

            await this.notion.getUser()
            console.log('Authenticated!')

          } catch (e) {

            console.log('Authentication failed!')
            this.notion = null
            this.settings.notionKey = oldKey
            this.$bvToast.toast( 'Invalid Notion key', {
              title: 'Error',
              autoHideDelay: 2000,
              appendToast: true,
              variant: 'danger'
            })
            this.$bvModal.show('notion-sync-settings')

          }

        }

      },



      'settings.write.syncWithNotion'( sync ) {
        // Open the modal if sync is enabled and no notion settings are set
        if ( sync ) {
          if ( !this.settings.notionKey || !this.settings.write.notionDatabaseId )
            this.$bvModal.show('notion-sync-settings')
        }
      },

      '$route.query.id'( id ) {

        this.doc = _.find( this.docs, { id } )

      },

      'doc.id': {

        handler() {

          // Change tempContent on doc change
          this.tempContent = this.doc.content
          this.showDocs = false

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
            try {
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

              this.$set( 
                history[i],
                'wordcount',
                this.getWordcount( history[i].content )
              )
              
            } catch ( e ) {
              console.error( e )
              // Remove all history entries after and including the one that caused the error
              history.splice( i )
              break
            }

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
            this.saved = true
            return
          }

          this.saved = false

          // Reset the idle timer
          clearTimeout( this.idleTimer )

          this.idleTimer = setTimeout(this.save, 5000)

          // Start doc timer
          if ( this.autoStartDocTimer )
            this.$nextTick(() => this.startDocTimer())

        }

      },

      docs: {

        // Delete any doc_[doc.id] keys from localStorage if they are not in docs
        handler(docs) {

          _( localStorage )
          .keys()
          .filter( key => key.startsWith( 'doc_' ) )
          .filter( key => !docs.find( doc => doc.id === key.replace( 'doc_', '' ) ) )
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

.hovered-tr {
  /* Yellow highlight for hovered rows */
  background-color: #f0f68c;
}

.fixed-tr {
  /* Green highlight for fixed rows */
  background-color: #c8e6c9;
}

.cursor-pointer {
  cursor: pointer;
}

</style>