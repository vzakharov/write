(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{287:function(t,e,n){var content=n(290);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,n(103).default)("ecf8e8da",content,!0,{sourceMap:!1})},289:function(t,e,n){"use strict";n(287)},290:function(t,e,n){var o=n(102)(!1);o.push([t.i,'#editor[data-v-85d3e1f0]{font-size:1.1em;font-family:"Sorts Mill Goudy","Georgia",serif;border-radius:5px;height:calc(100vh - 120px);padding:80px 60px 200px;background-color:#fff}*[data-v-85d3e1f0] h1,*[data-v-85d3e1f0] h2,*[data-v-85d3e1f0] h3,*[data-v-85d3e1f0] h4,*[data-v-85d3e1f0] h5,*[data-v-85d3e1f0] h6{margin-top:1.5em;margin-bottom:.5em}*[data-v-85d3e1f0] .comment{color:#5f9ea0}*[data-v-85d3e1f0] li{margin-left:1em}*[data-v-85d3e1f0] li+p{margin-top:1em}*[data-v-85d3e1f0] .hide{position:fixed;z-index:-1;height:0}*[data-v-85d3e1f0] .pre-hide:after{cursor:pointer;content:attr(data-show);color:#5f9ea0;font-family:sans-serif;font-size:.8em}*[data-v-85d3e1f0] mark{background-color:gold}*[data-v-85d3e1f0] .muffled{color:#ccc;background-color:#fff}*[data-v-85d3e1f0] .muffled *{color:inherit;background-color:inherit;font-size:75%;border:0}',""]),t.exports=o},300:function(t,e,n){"use strict";n.r(e);n(17),n(16),n(12),n(30),n(20),n(15),n(36),n(1),n(3);var o={props:["value","disabled","disableFormatting","refresh"],data:function(){return{content:this.value}},computed:{html:function(){var t,e=this,content=this.content;return content?(content=(content=(content=null===(t=content)||void 0===t?void 0:t.split(/\n+/).map((function(t){var n,o="p",c="",r=/^(#+) /,l=null===(n=r.exec(t))||void 0===n?void 0:n[1].length,d=/^(\*) /,f=/^(\[)(.+)(\])$/;if(!e.disableFormatting){var h=function(text){return'<span style="color: #ccc">'.concat(text,"</span>")};if(l?(o="h".concat(l),t=t.replace(r,h("$1 "))):d.test(t)?(o="li",t=t.replace(d,h("$1 "))):f.test(t)&&(t=t.replace(f,'<button class="btn btn-primary">'.concat(h("$1"),"$2").concat(h("$3"),"</button>"))),t.trim()){var v,m=/(\*{1,2})(\S.*?\S)(\*{1,2})/g,$=null===(v=m.exec(t))||void 0===v?void 0:v[1].length,x=/(\[)(.+?)(\]\(.+?\))/g,k=/(==)(.+?)(==)/g;if($){var w=["em","strong"][$-1];t=t.replace(m,"".concat(h("$1"),"<").concat(w,">$2</").concat(w,">").concat(h("$3")))}x.test(t)&&(t=t.replace(x,"".concat(h("$1"),'<a href="$4">$2</a>').concat(h("$3")))),k.test(t)&&(t=t.replace(k,"".concat(h("$1"),"<mark>$2</mark>").concat(h("$3"))))}else c=' style="min-height: 1em"'}return"<".concat(o).concat(c,">").concat(t,"</").concat(o,">")})).join("\n")).replace(/\/\*[\s\S]*?\*\//g,'<small class="comment">$&</small>')).replace(/(<p>{{<\/p>)([\s\S]*?)(<p>}}<\/p>)/g,'<div class="pre-hide" data-show="👀">$1</div><div class="hide muffled">$2</div><div>$3</div>'),this.$nextTick((function(){return document.querySelectorAll(".pre-hide").forEach((function(div){div.onclick=function(){var element=div.nextElementSibling;console.log(element),element.classList.toggle("hide"),div.setAttribute("data-show",element.classList.contains("hide")?"👀":"🙈")}}))})),content):""}},methods:{blur:function(t){document.activeElement!==t.target&&(this.content=this.value)}},watch:{refresh:function(){this.content=this.value},content:function(){this.$nextTick((function(){var t=document.getElementById("editor");t.scrollTop=t.scrollHeight}))}}},c=(n(289),n(65)),component=Object(c.a)(o,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"cool-shadow",style:{"background-color":t.disabled?"#eee":"#fff",overflowY:"scroll"},attrs:{id:"editor"}},[n("div",{staticStyle:{outline:"none"},attrs:{contenteditable:!t.disabled},domProps:{innerHTML:t._s(t.html)},on:{input:function(e){return t.$emit("input",e.target.innerText)},blur:t.blur}})])}),[],!1,null,"85d3e1f0",null);e.default=component.exports}}]);