(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{289:function(e,t,o){var content=o(295);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[e.i,content,""]]),content.locals&&(e.exports=content.locals);(0,o(103).default)("7500e137",content,!0,{sourceMap:!1})},294:function(e,t,o){"use strict";o(289)},295:function(e,t,o){var n=o(102)(!1);n.push([e.i,'#editor-wrapper[data-v-00675c90]{font-size:1.1em;font-family:"Georgia",serif;border-radius:5px;height:calc(100vh - 120px);padding:80px 60px 200px;background-color:#fff}*[data-v-00675c90] h1,*[data-v-00675c90] h2,*[data-v-00675c90] h3,*[data-v-00675c90] h4,*[data-v-00675c90] h5,*[data-v-00675c90] h6{margin-top:1.5em;margin-bottom:.5em}*[data-v-00675c90] .comment{color:#5f9ea0;font-size:.8em}*[data-v-00675c90] .li-numbered{margin-left:3em;text-indent:-1em}*[data-v-00675c90] .li-bullet{margin-left:3em;text-indent:-1.5em}*[data-v-00675c90] .li-bullet:before{content:"•";margin-right:.5em}*[data-v-00675c90] .hide:not([data-show="+"]){position:fixed;z-index:-1;height:0}*[data-v-00675c90] .pre-hide:after{cursor:pointer;content:attr(data-show);color:#5f9ea0;font-family:sans-serif;font-size:.8em}*[data-v-00675c90] .post-hide,*[data-v-00675c90] .post-hide p,*[data-v-00675c90] .pre-hide,*[data-v-00675c90] .pre-hide p{display:inline;color:#ccc;font-size:.8em;cursor:pointer}*[data-v-00675c90] mark{background-color:gold}*[data-v-00675c90] .muffled{color:#ccc;background-color:#fff}*[data-v-00675c90] .muffled *{color:inherit;background-color:inherit;font-size:75%;border:0}*[data-v-00675c90] blockquote{border-left:4px solid #ddd;margin-left:1em;padding-left:1em}*[data-v-00675c90] .hr{color:#ccc;font-size:.8em;margin-top:3em;margin-bottom:2em;border:0;border-top:1px solid rgba(0,0,0,.1)}',""]),e.exports=n},303:function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},316:function(e,t,o){"use strict";o.r(t);o(17),o(16),o(12),o(28),o(36),o(20),o(15),o(156),o(1),o(3);var n=o(291),r=o.n(n),c=(o(314),Object.assign),l=function(e){return(null==e?void 0:e.innerText)||(null==e?void 0:e.textContent)||""},d={props:{value:{default:""},readonly:{default:!1},disableFormatting:{default:!1},refresh:{default:!1},zoom:{default:100}},data:function(){var content=this.value||"",e=this.value.length;return{content:content,caretPosition:e,past:[{content:content,caretPosition:e}],future:[],afterUndoOrRedo:!1}},computed:{html:function(){var e,t=this,content=this.content;return content?(content=(content=(content=null===(e=content)||void 0===e?void 0:e.split(/\n\n|\n/).map((function(e){var o;e=e.trim();var n="p",r="",c=/^(#+)(\s)/,l=null===(o=c.exec(e))||void 0===o?void 0:o[1].length,d=/^(\d+)\.\s+/,f=/^([\*-])(\s+)/,h=/^(\[)(.+)(\])$/;if(!t.disableFormatting){var m=function(text){return'<span style="color: #ccc">'.concat(text,"</span>")};if(l?(n="h".concat(l),e=e.replace(c,m("$1")+"$2")):d.test(e)?(n="p",r=' class="li-numbered"',e=e.replace(d,'<span style="width: 1em; display: inline-block;"><strong>$1</strong>.&nbsp;</span>')):f.test(e)?(n="p",r=' class="li-bullet"',e=e.replace(f,"".concat(m("$1"),"$2"))):h.test(e)?e=e.replace(h,'<button class="btn btn-primary">'.concat(m("$1"),"$2").concat(m("$3"),"</button>")):/^(---)$/.test(e)?r=' class="hr"':/^(\/\/)(.+)$/.test(e)&&(r=' class="comment"'),e.trim()){var v=/\*\*([^*]+?)\*\*/g;v.test(e)&&(e=e.replace(v,"".concat(m("**"),"<strong>$1</strong>").concat(m("**"))));var y=/([^*])(\*)(\w[^*]+?)\2/g;y.test(e)&&(e=e.replace(y,"$1".concat(m("$2"),"<em>$3</em>").concat(m("$2"))));var $=/(\[)(.+?)(\]\(.+?\))/g;$.test(e)&&(e=e.replace($,"".concat(m("$1"),'<a href="$4">$2</a>').concat(m("$3"))));var k=/^(=+) (.+?) \1$/;if(k.test(e)){var E,w=null===(E=e.match(k))||void 0===E?void 0:E[1].length;e=e.replace(k,"".concat(m("$1"),'<mark style="background-color: ').concat(["#b3ffd9","#ffffb3","#b3d9ff","#ffb3ff"][w-1],'"> $2 </mark>').concat(m("$1")))}var T=/^(>\s+)/;T.test(e)&&(n="blockquote",e=e.replace(T,"".concat(m("$1"))))}else r=' style="min-height: 1em"'}return"<".concat(n).concat(r,">").concat(e,"</").concat(n,">")})).join("\n")).replace(/\/\*[\s\S]*?\*\//g,'<div class="comment">$&</div>')).replace(/(<p>{{(\+?)<\/p>)([\s\S]*?)(<p>}}<\/p>)/g,'<div class="pre-hide">$1</div><div data-show="$2" class="hide muffled">$3</div><div class="post-hide">$4</div>'),this.$nextTick((function(){return document.querySelectorAll(".pre-hide").forEach((function(div){div.onclick=function(){var element=div.nextElementSibling;console.log(element),element.classList.toggle("hide"),div.setAttribute("data-show",element.classList.contains("hide")?"👀":"🙈")}}))})),content):""}},methods:{blur:function(e){document.activeElement!==e.target&&(this.content=this.value)},undo:function(){console.log("undo"),this.traverse("past","future")},redo:function(){console.log("redo"),this.traverse("future","past")},traverse:function(e,t){this[e].length&&(this[t].push(r.a.pick(this,["content","caretPosition"])),c(this,this[e].pop()),this.afterUndoOrRedo=!0)},setCaretPosition:function(e){var t=document.createTreeWalker(editor,NodeFilter.SHOW_ALL,(function(t){return e<=l(t).length?t.nodeType===Node.TEXT_NODE?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP:(e-=l(t).length,t.nodeType===Node.ELEMENT_NODE&&"block"===window.getComputedStyle(t).display&&e--,NodeFilter.FILTER_REJECT)})),o=t.nextNode(),n=document.createRange();o?(n.setStart(o,e),n.collapse(!0)):(n.selectNodeContents(editor),n.collapse(!1));var r=window.getSelection();r.removeAllRanges(),r.addRange(n)}},watch:{refresh:function(){this.content=this.value,this.past=[],this.future=[]},value:function(e){var t=this,o=this.readonly,n=this.disableFormatting,r=this.afterUndoOrRedo,content=this.content,c=this.caretPosition;if(!o&&!n){if(r)this.afterUndoOrRedo=!1;else{this.future=[],this.past.push({content:content,caretPosition:c});var d=document.getElementById("editor"),f=window.getSelection(),h=f.anchorNode,m=f.anchorOffset;if(!d.contains(h))return;c=0,document.createTreeWalker(d,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,(function(e){return e.contains(h)?l(e)===l(h)?("\n"===l(e)&&c++,NodeFilter.FILTER_ACCEPT):NodeFilter.FILTER_SKIP:(c+=l(e).length,e.nodeType===Node.ELEMENT_NODE&&"block"===window.getComputedStyle(e).display&&c++,NodeFilter.FILTER_REJECT)})).nextNode(),c+=m,this.caretPosition=c}this.content=e,this.$nextTick((function(){return t.setCaretPosition(c)}))}}}},f=(o(294),o(65)),component=Object(f.a)(d,(function(){var e=this,t=e.$createElement,o=e._self._c||t;return o("div",{staticClass:"cool-shadow",style:{"background-color":e.readonly?"#eee":"#fff",overflowY:"scroll"},attrs:{id:"editor-wrapper"}},[o("div",{style:{outline:"none",zoom:e.zoom+"%"},attrs:{id:"editor",contenteditable:!e.readonly},domProps:{innerHTML:e._s(e.html)},on:{input:function(t){!e.readonly&&e.$emit("input",t.target.innerText)},blur:e.blur,keydown:[function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"z",void 0,t.key,void 0)?null:t.ctrlKey?t.shiftKey||t.altKey||t.metaKey?null:e.undo.apply(null,arguments):null},function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"z",void 0,t.key,void 0)?null:t.ctrlKey&&t.shiftKey?e.redo.apply(null,arguments):null}]}})])}),[],!1,null,"00675c90",null);t.default=component.exports}}]);