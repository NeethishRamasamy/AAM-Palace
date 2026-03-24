(function () {
  "use strict";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  var triggers = qsa("[data-aam-open]");
  if (triggers.length === 0) return;

  var lb = document.createElement("div");
  lb.id = "aam_lightbox";
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML = `
    <div class="aam_lb_topbar">
      <div class="aam_lb_title" id="aam_lb_title">Preview</div>
      <button class="aam_lb_close" id="aam_lb_close" aria-label="Close">✕</button>
    </div>

    <button class="aam_lb_nav prev" id="aam_lb_prev" aria-label="Previous"><span>‹</span></button>
    <button class="aam_lb_nav next" id="aam_lb_next" aria-label="Next"><span>›</span></button>

    <div class="aam_lb_stage">
      <img class="aam_lb_img" id="aam_lb_img" alt="Gallery image">
    </div>

    <div class="aam_lb_thumbs" id="aam_lb_thumbs" aria-label="Thumbnails"></div>
  `;
  document.body.appendChild(lb);

  var lbImg = qs("#aam_lb_img");
  var lbTitle = qs("#aam_lb_title");
  var lbThumbs = qs("#aam_lb_thumbs");
  var btnClose = qs("#aam_lb_close");
  var btnPrev = qs("#aam_lb_prev");
  var btnNext = qs("#aam_lb_next");

  var currentGroup = "";
  var currentIndex = 0;
  var groups = {};

  triggers.forEach(function (t) {
    var g = t.getAttribute("data-aam-group") || "default";
    if (!groups[g]) groups[g] = [];
    groups[g].push({
      full: t.getAttribute("data-full") || t.getAttribute("href") || "",
      cap: t.getAttribute("data-cap") || "",
      thumb: t.getAttribute("data-thumb") || (t.querySelector("img") ? t.querySelector("img").getAttribute("src") : "")
    });
  });

  function renderThumbs(items) {
    lbThumbs.innerHTML = "";
    items.forEach(function (it, i) {
      var b = document.createElement("button");
      b.className = "aam_lb_thumb";
      b.type = "button";
      b.setAttribute("aria-label", "Thumbnail " + (i + 1));
      b.innerHTML = `<img src="${it.thumb || it.full}" alt="">`;
      b.addEventListener("click", function () { setIndex(i); });
      lbThumbs.appendChild(b);
    });
  }

  function setIndex(i) {
    var items = groups[currentGroup] || [];
    if (!items.length) return;

    currentIndex = (i + items.length) % items.length;
    var it = items[currentIndex];

    lbImg.src = it.full;
    lbImg.alt = it.cap || "AAM Palace image";
    lbTitle.textContent = it.cap || ("Image " + (currentIndex + 1));

    var thumbs = qsa(".aam_lb_thumb", lbThumbs);
    thumbs.forEach(function (t) { t.classList.remove("active"); });
    if (thumbs[currentIndex]) {
      thumbs[currentIndex].classList.add("active");
      thumbs[currentIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function openLightbox(groupName, index) {
    currentGroup = groupName;
    var items = groups[currentGroup] || [];
    if (!items.length) return;

    renderThumbs(items);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setIndex(index);
  }

  function closeLightbox() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function prev() { setIndex(currentIndex - 1); }
  function next() { setIndex(currentIndex + 1); }

  triggers.forEach(function (t) {
    t.addEventListener("click", function (e) {
      e.preventDefault();
      var g = t.getAttribute("data-aam-group") || "default";
      var items = groups[g] || [];
      var full = t.getAttribute("data-full") || t.getAttribute("href") || "";
      var idx = items.findIndex(function (x) { return x.full === full; });
      openLightbox(g, idx >= 0 ? idx : 0);
    });
  });

  btnClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  btnPrev.addEventListener("click", function (e) { e.preventDefault(); prev(); });
  btnNext.addEventListener("click", function (e) { e.preventDefault(); next(); });

  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // Swipe
  var startX = null;
  lb.addEventListener("touchstart", function (e) {
    if (!lb.classList.contains("open")) return;
    startX = e.touches[0].clientX;
  }, {passive:true});

  lb.addEventListener("touchend", function (e) {
    if (!lb.classList.contains("open") || startX === null) return;
    var endX = e.changedTouches[0].clientX;
    var dx = endX - startX;
    startX = null;
    if (Math.abs(dx) > 50) (dx > 0) ? prev() : next();
  }, {passive:true});
})();