/* ---------- Search in diff ---------- */
let searchQuery="", searchHits=[], currentHitIdx=-1;

document.getElementById("searchInput").addEventListener("input",(e)=>{
    searchQuery=e.target.value;
    applySearchHighlight();
});

function clearSearchMarks(){
    document.querySelectorAll(".search-hit").forEach(span=>{
        span.replaceWith(document.createTextNode(span.textContent));
    });
}

function applySearchHighlight(){
    clearSearchMarks();
    searchHits=[]; currentHitIdx=-1;
    if(!searchQuery) return;

    let regex;
    try{
    regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),"gi");
    }catch(e){ return; }

    document.querySelectorAll(".line-content").forEach(el=>{
        const html=el.innerHTML;
        if(regex.test(html)){
            el.innerHTML=html.replace(regex,m=>`<span class="search-hit">${m}</span>`);
        }
    });
    searchHits=[...document.querySelectorAll(".search-hit")];
    if(searchHits.length){ currentHitIdx=0; updateCurrentHit(); }
}

function updateCurrentHit(){
    searchHits.forEach(h=>h.classList.remove("search-current"));
    if(currentHitIdx>=0 && currentHitIdx<searchHits.length){
        const cur=searchHits[currentHitIdx];
        cur.classList.add("search-current");
        cur.scrollIntoView({behavior:"smooth",block:"center"});
    }
}

function nextSearch(){
    if(!searchHits.length) return;
    currentHitIdx=(currentHitIdx+1)%searchHits.length;
    updateCurrentHit();
}
function prevSearch(){
    if(!searchHits.length) return;
    currentHitIdx=(currentHitIdx-1+searchHits.length)%searchHits.length;
    updateCurrentHit();
}

/* ---------- Scroll-sync between diff columns ---------- */
function setupScrollSync() {
  const columns = document.querySelectorAll('.diff-column');
  if (columns.length !== 2) return; // unified view or elements not found

  const [leftColumn, rightColumn] = columns;
  
  // Remove existing listeners to prevent duplicates
  if (leftColumn._scrollHandler) {
    leftColumn.removeEventListener('scroll', leftColumn._scrollHandler);
  }
  if (rightColumn._scrollHandler) {
    rightColumn.removeEventListener('scroll', rightColumn._scrollHandler);
  }
  
  function createScrollHandler(source, target) {
    return function() {
      if (source._syncing) return;
      target._syncing = true;
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
      requestAnimationFrame(() => {
        target._syncing = false;
      });
    };
  }

  // Create and store handlers
  leftColumn._scrollHandler = createScrollHandler(leftColumn, rightColumn);
  rightColumn._scrollHandler = createScrollHandler(rightColumn, leftColumn);

  // Add event listeners
  leftColumn.addEventListener('scroll', leftColumn._scrollHandler, { passive: true });
  rightColumn.addEventListener('scroll', rightColumn._scrollHandler, { passive: true });
}

/* ---------- Row recycling / virtualisation for large diffs ---------- */
function setupRowRecycling(bufferPx = 600) {
const columns = document.querySelectorAll(".diff-column");

columns.forEach(col => {
    if (col.__recycleObserver) return;           // evitar duplicados

    const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const line = entry.target;
        if (entry.isIntersecting) {
        if (line.dataset.rendered === "0") {
            line.innerHTML = line.dataset.html;
            line.dataset.rendered = "1";
        }
        } else {
        if (line.dataset.rendered === "1") {
            line.dataset.html = line.innerHTML;
            line.innerHTML = "&nbsp;";
            line.dataset.rendered = "0";
        }
        }
    });
    }, { root: col, rootMargin: `${bufferPx}px 0px` });

    col.querySelectorAll(".diff-line").forEach(line => {
    line.dataset.html = line.innerHTML;
    line.dataset.rendered = "1";
    observer.observe(line);
    });
    col.__recycleObserver = observer;
});
}
