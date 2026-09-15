const DEFAULT_COLLECTIONS=[
{name:"General",color:"#8e9bff"},{name:"Tools",color:"#71d8cb"},{name:"Work",color:"#6db7ff"},
{name:"Study",color:"#b28cff"},{name:"Social",color:"#ff8fb4"},{name:"Entertainment",color:"#ffc36b"}
];
const DEFAULT_LINKS=[
{name:"ChatGPT",url:"https://chatgpt.com/",category:"Tools",target:"_blank",favorite:true,pinned:true,added:1},
{name:"Perplexity AI",url:"https://www.perplexity.ai/",category:"Tools",target:"_blank",added:2},
{name:"Google",url:"https://www.google.com/",category:"General",target:"_blank",added:3},
{name:"YouTube",url:"https://www.youtube.com/",category:"Entertainment",target:"_blank",added:4},
{name:"Telegram",url:"https://web.telegram.org/",category:"Social",target:"_blank",added:5},
{name:"Gmail",url:"https://mail.google.com/",category:"Work",target:"_blank",added:6},
{name:"Hostinger",url:"https://www.hostinger.com/",category:"Tools",target:"_blank",added:7},
{name:"IPL Win",url:"https://direct.lc.chat/",category:"Entertainment",target:"_blank",added:8}
];
const $=id=>document.getElementById(id);
const DEFAULT_PREFS={theme:"dark",accent:"aurora",view:"grid",filter:"all",sort:"manual",animations:true,glass:true,confirm:true,density:"comfortable"};
function makeId(){return "lv_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9)}
function normalizeLink(x,i){return {...x,id:x.id||makeId(),name:String(x.name||"Untitled"),url:String(x.url||"https://example.com"),category:x.category||"General",target:x.target||"_blank",favorite:!!x.favorite,pinned:!!x.pinned,added:Number(x.added)||Date.now()+i,note:String(x.note||""),customLogo:x.customLogo||null}}
let rawLinks=load("lv-lux-links",DEFAULT_LINKS), rawCollections=load("lv-lux-collections",DEFAULT_COLLECTIONS);
rawCollections = Array.isArray(rawCollections)
  ? rawCollections.filter(c => String(c.name).toLowerCase() !== "m")
  : DEFAULT_COLLECTIONS;
let links=(Array.isArray(rawLinks)?rawLinks:DEFAULT_LINKS).map(normalizeLink), collections=Array.isArray(rawCollections)?rawCollections:DEFAULT_COLLECTIONS.map(x=>({...x}));
let prefs={...DEFAULT_PREFS,...load("lv-lux-prefs",{})};
let editing=null,dragId=null,customLogo=null,selectedColor="#ff3344";
collections=collections.map((c,i)=>({name:String(c.name||("Collection "+(i+1))),color:c.color||["#ff3344","#ff6b72","#ff9b72","#b58cff"][i%4]}));

function load(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
function save(){localStorage.setItem("lv-lux-links",JSON.stringify(links));localStorage.setItem("lv-lux-collections",JSON.stringify(collections))}
function savePrefs(){localStorage.setItem("lv-lux-prefs",JSON.stringify(prefs))}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function hostname(u){try{return new URL(/^https?:\/\//i.test(u)?u:"https://"+u).hostname.replace(/^www\./,"")}catch{return u}}
function faviconSources(u){let h=hostname(u);return[
`https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=128`,
`https://icons.duckduckgo.com/ip3/${encodeURIComponent(h)}.ico`,
`https://icon.horse/icon/${encodeURIComponent(h)}`,
`https://${h}/favicon.ico`
]}
function fallbackLetter(name){return (name||"?").trim().charAt(0).toUpperCase()||"?"}
function toast(t){let x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>x.classList.remove("show"),1900)}
function applyPrefs(){
 document.body.classList.toggle("light",prefs.theme==="light");document.body.classList.toggle("no-motion",!prefs.animations);document.body.classList.toggle("no-glass",!prefs.glass);
 document.body.classList.remove("theme-violet","theme-ocean","theme-sunset");if(prefs.accent!=="aurora")document.body.classList.add("theme-"+prefs.accent);
}
function collection(name){return collections.find(x=>x.name===name)||collections[0]}
function collectionOptions(selected){return collections.map(x=>`<option ${x.name===selected?"selected":""}>${esc(x.name)}</option>`).join("")}

function render(){
 applyPrefs();
 $("category").innerHTML=collectionOptions(editing!==null?links[editing].category:"General");
 renderSidebar();renderTags();
 let q=$("search").value.toLowerCase().trim();
 let arr=links.map((x,i)=>({...x,_i:i}));
 if(prefs.filter==="favorite")arr=arr.filter(x=>x.favorite);
 if(prefs.filter==="recent")arr=arr.filter(x=>Date.now()-x.added<1000*60*60*24*30);
 if(prefs.filter.startsWith("cat:"))arr=arr.filter(x=>x.category===prefs.filter.slice(4));
 arr=arr.filter(x=>!q||(x.name+" "+x.url+" "+x.category+" "+(x.note||"")).toLowerCase().includes(q));
 if(prefs.sort==="name")arr.sort((a,b)=>a.name.localeCompare(b.name));
 if(prefs.sort==="recent")arr.sort((a,b)=>b.added-a.added);
 if(prefs.sort==="category")arr.sort((a,b)=>(a.category||"").localeCompare(b.category||"")||a.name.localeCompare(b.name));
 if(prefs.sort==="manual")arr.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||a._i-b._i);
 $("sectionTitle").textContent=prefs.filter==="all"?"All websites":prefs.filter==="favorite"?"Favourites":prefs.filter==="recent"?"Recently added":prefs.filter.startsWith("cat:")?prefs.filter.slice(4):"All websites";
 $("resultCount").textContent=arr.length+" result"+(arr.length===1?"":"s");
 let cls="links "+prefs.view;if(prefs.density==="dense"&&prefs.view==="grid")cls+=" dense";$("links").className=cls;$("links").innerHTML="";
 $("empty").classList.toggle("hidden",arr.length>0);arr.forEach((x,n)=>$("links").appendChild(card(x,n)));
 $("totalStat").textContent=links.length;$("favStat").textContent=links.filter(x=>x.favorite).length;$("catStat").textContent=collections.length;$("allCount").textContent=links.length;$("favCount").textContent=links.filter(x=>x.favorite).length;
 document.querySelectorAll(".tool-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===prefs.view));
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.filter===prefs.filter));
}
function renderSidebar(){
 let counts={};links.forEach(x=>counts[x.category]=(counts[x.category]||0)+1);
 $("collections").innerHTML=collections.map(c=>`<button class="collection-row ${prefs.filter==="cat:"+c.name?"active":""}" data-cat="${esc(c.name)}" style="--c:${c.color}"><span class="collection-dot"></span>${esc(c.name)}<b>${counts[c.name]||0}</b></button>`).join("");
 document.querySelectorAll(".collection-row").forEach(b=>b.onclick=()=>{prefs.filter="cat:"+b.dataset.cat;savePrefs();render()});
}
function renderTags(){
 let all=["All","Favourites",...collections.map(c=>c.name)];
 $("tagbar").innerHTML=all.map(t=>{let active=t==="All"?prefs.filter==="all":t==="Favourites"?prefs.filter==="favorite":prefs.filter===""+("cat:"+t);return `<button class="tag ${active?"active":""}" data-tag="${esc(t)}">${esc(t)}</button>`}).join("");
 document.querySelectorAll(".tag").forEach(b=>b.onclick=()=>{let t=b.dataset.tag;prefs.filter=t==="All"?"all":t==="Favourites"?"favorite":"cat:"+t;savePrefs();render()});
}
function logoFor(item){return item.customLogo||faviconSources(item.url)[0]}
function card(x,n){
 let c=document.createElement("article");c.className="card";c.draggable=true;c.style.setProperty("--card-accent",(collection(x.category)?.color)||"#8e9bff");c.style.animationDelay=Math.min(n*28,350)+"ms";
 let src=logoFor(x);
 c.innerHTML=`${x.pinned?'<span class="pin">◆</span>':""}<span class="fav ${x.favorite?"on":""}">${x.favorite?"✦":"◇"}</span>
 <button class="more">⋮</button>
 <a class="card-main" href="${esc(x.url)}" target="${x.target||"_blank"}" rel="noopener">
 <div class="logo-wrap"><img class="site-logo" src="${esc(src)}" alt=""><span class="fallback" style="display:none">${esc(fallbackLetter(x.name))}</span></div>
 <div class="name">${esc(x.name)}</div><div class="url">${esc(hostname(x.url))}</div><div class="badge">${esc(x.category||"General")}</div>${x.note?'<span class="note-dot"></span>':""}</a>
 <div class="menu"><button data-a="edit">✎ Edit shortcut</button><button data-a="favorite">✦ Toggle favourite</button><button data-a="pin">◆ Toggle pin</button><button data-a="logo">◉ Change logo</button><button data-a="copy">⌘ Copy URL</button><button data-a="duplicate">⧉ Duplicate</button><button data-a="delete">⌫ Delete</button></div>`;
 let img=c.querySelector(".site-logo"),fallback=c.querySelector(".fallback"),sources=faviconSources(x.url),si=0;
 if(x.customLogo)img.src=x.customLogo;
 img.onerror=()=>{si++;if(si<sources.length)img.src=sources[si];else{img.style.display="none";fallback.style.display="grid"}};
 if(!x.customLogo)img.src=sources[0];
 c.querySelector(".more").onclick=e=>{e.stopPropagation();document.querySelectorAll(".card.open").forEach(z=>z!==c&&z.classList.remove("open"));c.classList.toggle("open")};
 c.querySelector('[data-a="edit"]').onclick=()=>openLink(x._i);
 c.querySelector('[data-a="favorite"]').onclick=()=>{links[x._i].favorite=!links[x._i].favorite;save();render();toast("Favourite updated")};
 c.querySelector('[data-a="pin"]').onclick=()=>{links[x._i].pinned=!links[x._i].pinned;save();render();toast("Pin updated")};
 c.querySelector('[data-a="logo"]').onclick=()=>openLink(x._i,true);
 c.querySelector('[data-a="copy"]').onclick=async()=>{try{await navigator.clipboard.writeText(x.url);toast("URL copied")}catch{toast("Copy not available in this browser")}};
 c.querySelector('[data-a="duplicate"]').onclick=()=>{links.splice(x._i+1,0,{...x,name:x.name+" Copy",added:Date.now()});save();render();toast("Shortcut duplicated")};
 c.querySelector('[data-a="delete"]').onclick=()=>removeLink(x._i);
 c.addEventListener("dragstart",e=>{dragId=x.id;c.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",x.id)});
 c.addEventListener("dragend",()=>{dragId=null;c.classList.remove("dragging");document.querySelectorAll(".drop-over").forEach(z=>z.classList.remove("drop-over"))});
 c.addEventListener("dragover",e=>{if([...e.dataTransfer.items].some(i=>i.kind==="file")){e.preventDefault();c.classList.add("drop-over");return}e.preventDefault();if(dragId!==null&&dragId!==x.id)c.classList.add("drop-over")});
 c.addEventListener("dragleave",()=>c.classList.remove("drop-over"));
 c.addEventListener("drop",e=>{let file=[...e.dataTransfer.files].find(f=>f.type.startsWith("image/"));if(file){e.preventDefault();e.stopPropagation();c.classList.remove("drop-over");readImage(file,data=>{links[x._i].customLogo=data;save();render();toast("Custom logo applied")});return}e.preventDefault();c.classList.remove("drop-over");if(dragId===null||dragId===x.id)return;let from=links.findIndex(v=>v.id===dragId),to=links.findIndex(v=>v.id===x.id);if(from<0||to<0||from===to)return;let moved=links.splice(from,1)[0];if(from<to)to--;links.splice(to,0,moved);save();render();toast("Order saved")});
 c.addEventListener("contextmenu",e=>{e.preventDefault();showContext(e.clientX,e.clientY,x._i)});
 return c;
}
function removeLink(i){if(!prefs.confirm||confirm(`Delete "${links[i].name}"?`)){links.splice(i,1);save();render();toast("Shortcut deleted")}}
function openLink(i=null,focusLogo=false){
 editing=i;customLogo=i!==null?links[i].customLogo||null:null;
 let x=i===null?{name:"",url:"",category:"General",target:"_blank",favorite:false,pinned:false,note:""}:links[i];
 $("modalTitle").textContent=i===null?"Add shortcut":"Edit shortcut";$("name").value=x.name;$("url").value=x.url;$("category").innerHTML=collectionOptions(x.category||"General");$("target").value=x.target||"_blank";$("favorite").checked=!!x.favorite;$("pinned").checked=!!x.pinned;$("note").value=x.note||"";updateLogoPreview();
 $("linkModal").classList.remove("hidden");setTimeout(()=>$(focusLogo?"uploadLogo":"name").focus(),80)
}
function closeLink(){$("linkModal").classList.add("hidden");editing=null;customLogo=null}
function updateLogoPreview(){let u=$("url").value.trim(),img=$("previewLogo"),letter=$("fallbackLetter");$("previewName").textContent=$("name").value||"Website logo";$("previewHost").textContent=u?hostname(u):"Automatic favicon detection";$("logoStatus").textContent=customLogo?"Custom logo selected":"Auto-detecting logo…";if(customLogo){img.src=customLogo;img.style.display="block";letter.style.display="none";return}if(!u){img.removeAttribute("src");img.style.display="none";letter.textContent=fallbackLetter($("name").value);letter.style.display="grid";return}let sources=faviconSources(u),i=0;img.style.display="block";letter.style.display="none";img.onerror=()=>{i++;if(i<sources.length){img.src=sources[i]}else{img.style.display="none";letter.textContent=fallbackLetter($("name").value);letter.style.display="grid";$("logoStatus").textContent="Automatic fallback logo"}};img.src=sources[0]}
function readImage(file,cb){if(!file||!file.type.startsWith("image/"))return toast("Please choose an image");let r=new FileReader();r.onload=()=>{let img=new Image();img.onload=()=>{let max=512,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(img,0,0,w,h);cb(cv.toDataURL("image/webp",.88))};img.onerror=()=>cb(r.result);img.src=r.result};r.readAsDataURL(file)}
["name","url"].forEach(id=>$(id).addEventListener("input",updateLogoPreview));
$("uploadLogo").onclick=()=>$("logoInput").click();$("logoInput").onchange=e=>readImage(e.target.files[0],d=>{customLogo=d;updateLogoPreview();e.target.value=""});
$("resetLogo").onclick=()=>{customLogo=null;updateLogoPreview()};
$("closeLink").onclick=closeLink;$("cancelLink").onclick=closeLink;$("addBtn").onclick=()=>openLink();
$("saveLink").onclick=()=>{let name=$("name").value.trim(),url=$("url").value.trim();if(!name||!url)return toast("Name and URL are required");if(!/^https?:\/\//i.test(url))url="https://"+url;let isNew=editing===null;let old=isNew?{}:links[editing];let item={...old,id:old.id||makeId(),name,url,category:$("category").value,target:$("target").value,favorite:$("favorite").checked,pinned:$("pinned").checked,note:$("note").value.trim(),customLogo:customLogo||null,added:old.added||Date.now()};if(isNew)links.push(item);else links[editing]=item;save();closeLink();render();toast(isNew?"Shortcut added":"Shortcut updated")};

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{prefs.filter=b.dataset.filter;savePrefs();render()});
document.querySelectorAll(".tool-btn").forEach(b=>b.onclick=()=>{prefs.view=b.dataset.view;savePrefs();render()});
$("search").oninput=()=>{let v=$("search").value;$("clearSearch").classList.toggle("hidden",!v);render()};
$("clearSearch").onclick=()=>{$("search").value="";$("clearSearch").classList.add("hidden");render()};
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("search").focus()}if(e.key==="Escape"){closeLink();$("collectionModal").classList.add("hidden");$("commandModal").classList.add("hidden");$("settingsModal").classList.add("hidden");$("contextMenu").classList.add("hidden");document.querySelectorAll(".card.open").forEach(c=>c.classList.remove("open"))}});
["linkModal","collectionModal","commandModal","settingsModal"].forEach(id=>$(id).addEventListener("click",e=>{if(e.target.id===id)e.currentTarget.classList.add("hidden")}));
$("themeBtn").onclick=()=>{prefs.theme=prefs.theme==="dark"?"light":"dark";savePrefs();applyPrefs()};
$("settingsBtn").onclick=()=>{$("settingsModal").classList.remove("hidden");syncSettings()};
$("closeSettings").onclick=()=>$("settingsModal").classList.add("hidden");
function syncSettings(){$("setAnimations").checked=prefs.animations;$("setGlass").checked=prefs.glass;$("setConfirm").checked=prefs.confirm;$("setDensity").value=prefs.density;$("setAccent").value=prefs.accent}
$("setAnimations").onchange=e=>{prefs.animations=e.target.checked;savePrefs();applyPrefs();render()};
$("setGlass").onchange=e=>{prefs.glass=e.target.checked;savePrefs();applyPrefs()};
$("setConfirm").onchange=e=>{prefs.confirm=e.target.checked;savePrefs()};
$("setDensity").onchange=e=>{prefs.density=e.target.value;savePrefs();render()};
$("setAccent").onchange=e=>{prefs.accent=e.target.value;savePrefs();applyPrefs()};
$("resetAll").onclick=()=>{if(confirm("Reset all shortcuts and collections?")){links=DEFAULT_LINKS.map(x=>({...x}));collections=DEFAULT_COLLECTIONS.map(x=>({...x}));save();prefs.filter="all";savePrefs();render();$("settingsModal").classList.add("hidden");toast("Dashboard reset")}};
$("newCollection").onclick=()=>{$("collectionModal").classList.remove("hidden");$("collectionName").value="";selectedColor="#8e9bff";renderSwatches()};
$("closeCollection").onclick=()=>$("collectionModal").classList.add("hidden");$("cancelCollection").onclick=()=>$("collectionModal").classList.add("hidden");
function renderSwatches(){let colors=["#8e9bff","#71d8cb","#6db7ff","#b28cff","#ff8fb4","#ffc36b","#ff8d72","#76a7ff"];$("swatches").innerHTML=colors.map(c=>`<button class="swatch ${c===selectedColor?"active":""}" style="background:${c}" data-c="${c}"></button>`).join("");document.querySelectorAll(".swatch").forEach(b=>b.onclick=()=>{selectedColor=b.dataset.c;renderSwatches()})}
$("saveCollection").onclick=()=>{let n=$("collectionName").value.trim();if(!n)return toast("Enter a collection name");if(collections.some(c=>c.name.toLowerCase()===n.toLowerCase()))return toast("Collection already exists");collections.push({name:n,color:selectedColor});save();$("collectionModal").classList.add("hidden");render();toast("Collection created")};

$("exportBtn").onclick=()=>{let data={version:1,links,collections,prefs};let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="linkvault-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported")};
$("importBtn").onclick=()=>$("fileInput").click();$("fileInput").onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d.links))throw 0;links=d.links;collections=Array.isArray(d.collections)?d.collections:collections;save();render();toast("Backup imported")}catch{toast("Invalid backup file")}e.target.value=""};r.readAsText(f)};

$("sortBtn").onclick=e=>{let m=document.createElement("div");m.className="menu";m.style.display="block";m.style.position="fixed";m.style.right=(innerWidth-e.currentTarget.getBoundingClientRect().right)+"px";m.style.top=(e.currentTarget.getBoundingClientRect().bottom+7)+"px";m.innerHTML=`<button data-s="manual">✦ Custom order</button><button data-s="name">A → Z</button><button data-s="recent">◷ Recently added</button><button data-s="category">◈ Category</button>`;document.body.appendChild(m);m.querySelectorAll("button").forEach(b=>b.onclick=()=>{prefs.sort=b.dataset.s;savePrefs();m.remove();render();toast("Sort updated")});setTimeout(()=>document.addEventListener("click",()=>m.remove(),{once:true}),0)};
$("commandBtn").onclick=openCommand;
function openCommand(){let cmds=[["⌕","Focus search","Ctrl + K",()=>{$("search").focus()}],["＋","Add shortcut","",()=>openLink()],["✦","Show favourites","",()=>{prefs.filter="favorite";savePrefs();render()}],["◷","Recently added","",()=>{prefs.filter="recent";savePrefs();render()}],["▦","Grid view","",()=>{prefs.view="grid";savePrefs();render()}],["☷","List view","",()=>{prefs.view="list";savePrefs();render()}],["◐","Toggle theme","",()=>$("themeBtn").click()],["⚙","Open settings","",()=>{$("settingsModal").classList.remove("hidden")}],["⇩","Export backup","",()=>$("exportBtn").click()]];$("commands").innerHTML=cmds.map((c,i)=>`<button class="command-item" data-i="${i}"><span>${c[0]}</span>${c[1]}<b>${c[2]}</b></button>`).join("");document.querySelectorAll(".command-item").forEach((b,i)=>b.onclick=()=>{cmds[i][3]();$("commandModal").classList.add("hidden")});$("commandModal").classList.remove("hidden");setTimeout(()=>$("commandSearch").focus(),50)}
$("commandSearch").oninput=e=>{let q=e.target.value.toLowerCase();document.querySelectorAll(".command-item").forEach(b=>b.style.display=b.textContent.toLowerCase().includes(q)?"flex":"none")};

function showContext(x,y,i){let m=$("contextMenu");m.innerHTML=`<button data-c="edit">✎ Edit</button><button data-c="fav">✦ Favourite</button><button data-c="copy">⌘ Copy URL</button><button data-c="delete">⌫ Delete</button>`;m.style.left=Math.min(x,innerWidth-180)+"px";m.style.top=Math.min(y,innerHeight-180)+"px";m.classList.remove("hidden");m.querySelector('[data-c="edit"]').onclick=()=>{m.classList.add("hidden");openLink(i)};m.querySelector('[data-c="fav"]').onclick=()=>{links[i].favorite=!links[i].favorite;save();render();m.classList.add("hidden")};m.querySelector('[data-c="copy"]').onclick=()=>navigator.clipboard?.writeText(links[i].url).then(()=>toast("URL copied"));m.querySelector('[data-c="delete"]').onclick=()=>{m.classList.add("hidden");removeLink(i)}}
document.addEventListener("click",e=>{if(!e.target.closest(".card"))document.querySelectorAll(".card.open").forEach(c=>c.classList.remove("open"));if(!e.target.closest("#contextMenu"))$("contextMenu").classList.add("hidden")});

$("voiceBtn").onclick=()=>{let R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return toast("Voice search is not supported here");let r=new R();r.lang="en-IN";r.onresult=e=>{$("search").value=e.results[0][0].transcript;render()};r.start()};
function initFX(){let box=$("particles");if(box){box.innerHTML="";for(let i=0;i<42;i++){let p=document.createElement("i");p.className="particle";p.style.left=(Math.random()*100)+"%";p.style.top=(70+Math.random()*35)+"%";p.style.setProperty("--dx",((Math.random()-.5)*160)+"px");p.style.setProperty("--pd",(5+Math.random()*8)+"s");p.style.setProperty("--delay",(-Math.random()*12)+"s");box.appendChild(p)}}let glow=$("cursorGlow");if(glow){window.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"},{passive:true})}}
initFX();
function updateTime(){let d=new Date();$("clock").textContent=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});$("dateText").textContent=d.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"});let h=d.getHours();$("greeting").textContent=h<12?"GOOD MORNING,":h<18?"GOOD AFTERNOON,":"GOOD EVENING,"}
setInterval(updateTime,1000);updateTime();
render();
