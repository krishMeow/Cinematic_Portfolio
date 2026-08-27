// 1. Scroll Position Lockdown & History Override
if (history.scrollRestoration) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

// Register GSAP Plugins ONCE
gsap.registerPlugin(ScrollTrigger, Flip);

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const frameCount = 520;
const framePath = (i) =>
  `public/frames/frame_${(i + 1).toString().padStart(4, "0")}.webp`;

const images = [];
const sequence = { frame: 0 };
let loadedImagesCount = 0;

// 2. Canvas Resize Function
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}
window.addEventListener("resize", resizeCanvas);

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[sequence.frame];
  if (!img || !img.complete) return;

  const hRatio = canvas.width / img.width;
  const vRatio = canvas.height / img.height;
  const ratio = Math.min(hRatio, vRatio);

  const centerShiftX = (canvas.width - img.width * ratio) / 2;
  const centerShiftY = (canvas.height - img.height * ratio) / 2;

  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    centerShiftX,
    centerShiftY,
    img.width * ratio,
    img.height * ratio
  );
}

// 3. Preload Canvas Frames in Background
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = framePath(i);
  img.onload = () => {
    loadedImagesCount++;
    if (loadedImagesCount === 1) {
      sequence.frame = 0;
      resizeCanvas();
    }
  };
  images.push(img);
}

// 4. Ambient Audio Manager
const bgAudio = document.getElementById("bgMusic");
const audioToggle = document.getElementById("audioToggle");
const audioStatus = document.getElementById("audioStatus");
let isAudioPlaying = false;

function playAudioStream() {
  if (!bgAudio) return;
  bgAudio.volume = 0.45;
  bgAudio
    .play()
    .then(() => {
      isAudioPlaying = true;
      audioToggle?.classList.add("playing");
      if (audioStatus) audioStatus.innerText = "SOUND: ON";
    })
    .catch(() => {
      if (audioStatus) audioStatus.innerText = "SOUND: OFF";
    });
}

function toggleAudio() {
  if (!bgAudio) return;
  if (isAudioPlaying) {
    bgAudio.pause();
    isAudioPlaying = false;
    audioToggle?.classList.remove("playing");
    if (audioStatus) audioStatus.innerText = "SOUND: OFF";
  } else {
    bgAudio
      .play()
      .then(() => {
        isAudioPlaying = true;
        audioToggle?.classList.add("playing");
        if (audioStatus) audioStatus.innerText = "SOUND: ON";
      })
      .catch(() => {});
  }
}
audioToggle?.addEventListener("click", toggleAudio);

// 5. High-Precision 10-Second Preloader Loop
let isPreloaderStarted = false;
function startPreloader() {
  if (isPreloaderStarted) return;
  isPreloaderStarted = true;

  const counterEl = document.getElementById("counter");
  const barFill = document.querySelector(".bar-fill");
  const preloader = document.getElementById("preloader");
  const loaderVideo = document.getElementById("loaderVideo");

  if (loaderVideo) {
    loaderVideo.currentTime = 0;
    loaderVideo.play().catch(() => {});
  }

  let progress = 0;
  const totalDuration = 10000;
  const stepTime = totalDuration / 100;

  const interval = setInterval(() => {
    progress++;
    if (counterEl) {
      counterEl.innerText = progress < 10 ? `0${progress}` : `${progress}`;
    }
    if (barFill) {
      barFill.style.width = `${progress}%`;
    }

    if (progress >= 100) {
      clearInterval(interval);
      sequence.frame = 0;
      render();

      gsap.to(preloader, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          if (loaderVideo) loaderVideo.pause();
          if (preloader) preloader.style.display = "none";
          ScrollTrigger.refresh();
        },
      });
    }
  }, stepTime);
}

// 6. Scroll Frame Scrub
const heroTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero-section",
    start: "top top",
    end: "+=5000",
    pin: true,
    scrub: 0.6,
  },
});

heroTimeline.to(sequence, {
  frame: frameCount - 1,
  snap: "frame",
  ease: "none",
  onUpdate: render,
});

heroTimeline.from(".hud-top", { opacity: 0, y: -20, duration: 0.3 }, "-=0.3");
heroTimeline.from(".gemini-glow-card", { opacity: 0, x: -40, duration: 0.3 }, "<");
heroTimeline.from(".hud-right-stats", { opacity: 0, x: 40, duration: 0.3 }, "<");

// 7. About Section Animations
gsap.fromTo(
  ".about-left",
  { opacity: 0, y: 30 },
  {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".about-section",
      start: "top 85%",
      once: true,
    },
  }
);

gsap.fromTo(
  ".about-right",
  { opacity: 0, scale: 0.95 },
  {
    opacity: 1,
    scale: 1,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".about-section",
      start: "top 85%",
      once: true,
    },
  }
);

// 8. 3D Pinned Carousel ScrollTrigger
const cards = document.querySelectorAll(".card-3d");
const dotsContainer = document.getElementById("cDots");
const activeIdxText = document.getElementById("active-idx");
let carouselProgress = { val: 0 };

if (dotsContainer) {
  dotsContainer.innerHTML = "";
  cards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("c-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      gsap.to(carouselProgress, {
        val: i,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: apply3DCardTransforms,
      });
    });
    dotsContainer.appendChild(dot);
  });
}

function apply3DCardTransforms() {
  const currentIdx = Math.round(carouselProgress.val);
  const clampedIdx = Math.max(0, Math.min(cards.length - 1, currentIdx));

  if (activeIdxText) {
    activeIdxText.innerText = (clampedIdx + 1).toString().padStart(2, "0");
  }

  const dots = document.querySelectorAll(".c-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === clampedIdx);
  });

  cards.forEach((card, i) => {
    let offset = i - carouselProgress.val;
    const absOffset = Math.abs(offset);

    if (absOffset > 2.5) {
      card.style.opacity = "0";
      card.style.pointerEvents = "none";
      card.style.transform = `translateX(${offset * 380}px) translateZ(-600px) rotateY(${offset * -25}deg)`;
    } else {
      const isCurrentCenter = absOffset < 0.5;
      card.style.opacity = Math.max(0.3, 1 - absOffset * 0.35);
      card.style.pointerEvents = "auto";
      card.style.filter = isCurrentCenter ? "none" : `blur(${absOffset * 2.5}px) brightness(0.65)`;
      card.style.zIndex = `${100 - Math.round(absOffset * 20)}`;

      const translateX = offset * 330;
      const translateZ = -absOffset * 160;
      const rotateY = offset * -26;

      card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`;
    }
  });
}

ScrollTrigger.create({
  trigger: ".projects-carousel-section",
  start: "top top",
  end: "+=3500",
  pin: true,
  scrub: 0.8,
  onUpdate: (self) => {
    carouselProgress.val = self.progress * (cards.length - 1);
    apply3DCardTransforms();
  },
});

document.getElementById("nextCard")?.addEventListener("click", () => {
  const nextVal = Math.min(cards.length - 1, Math.round(carouselProgress.val) + 1);
  gsap.to(carouselProgress, {
    val: nextVal,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: apply3DCardTransforms,
  });
});

document.getElementById("prevCard")?.addEventListener("click", () => {
  const prevVal = Math.max(0, Math.round(carouselProgress.val) - 1);
  gsap.to(carouselProgress, {
    val: prevVal,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: apply3DCardTransforms,
  });
});

apply3DCardTransforms();

// 9. 3D Project Card Hover Effects
cards.forEach((card) => {
  const diagram = card.querySelector(".banner-diagram");
  const tags = card.querySelectorAll(".tag-chips span");
  const btn = card.querySelector(".card-btn");
  const title = card.querySelector(".card-body h3");

  card.addEventListener("mouseenter", () => {
    if (parseInt(card.style.zIndex || "0") < 90) return;

    gsap.to(card, {
      y: -14,
      boxShadow: "0 35px 70px rgba(0, 229, 255, 0.25), 0 0 30px rgba(0, 229, 255, 0.2)",
      borderColor: "#00e5ff",
      duration: 0.4,
      ease: "power2.out",
    });

    if (diagram) gsap.to(diagram, { scale: 1.1, boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)", duration: 0.3 });
    if (title) gsap.to(title, { color: "#00e5ff", x: 4, duration: 0.3 });
    if (tags.length) gsap.to(tags, { y: -3, borderColor: "rgba(0, 229, 255, 0.6)", backgroundColor: "rgba(0, 229, 255, 0.12)", stagger: 0.04, duration: 0.25 });
    if (btn) gsap.to(btn, { scale: 1.05, backgroundColor: "#00e5ff", color: "#000", boxShadow: "0 0 15px rgba(0, 229, 255, 0.5)", duration: 0.3 });
  });

  card.addEventListener("mouseleave", () => {
    gsap.to(card, { y: 0, boxShadow: "0 30px 60px rgba(0, 0, 0, 0.85)", borderColor: "rgba(0, 229, 255, 0.2)", duration: 0.4 });
    if (diagram) gsap.to(diagram, { scale: 1, boxShadow: "none", duration: 0.3 });
    if (title) gsap.to(title, { color: "#ffffff", x: 0, duration: 0.3 });
    if (tags.length) gsap.to(tags, { y: 0, borderColor: "rgba(255, 255, 255, 0.1)", backgroundColor: "rgba(255, 255, 255, 0.06)", stagger: 0.02, duration: 0.25 });
    if (btn) gsap.to(btn, { scale: 1, backgroundColor: "transparent", color: "#00e5ff", boxShadow: "none", duration: 0.3 });
  });
});

// 10. Tilt Init
VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
  max: 15,
  speed: 400,
  glare: true,
  "max-glare": 0.4,
});

// 11. Form Submission Animation
function handleFormSubmit() {
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn?.querySelector(".btn-text");
  if (btnText) btnText.innerText = "ENCRYPTING & TRANSMITTING...";
  if (submitBtn) submitBtn.style.pointerEvents = "none";

  setTimeout(() => {
    submitBtn?.classList.add("success");
    if (btnText) btnText.innerText = "TRANSMISSION RECEIVED ✓";

    setTimeout(() => {
      document.getElementById("contactForm")?.reset();
      submitBtn?.classList.remove("success");
      if (btnText) btnText.innerText = "TRANSMIT MESSAGE";
      if (submitBtn) submitBtn.style.pointerEvents = "auto";
    }, 3000);
  }, 1200);
}

// ================= PARTICLE TEXT MORPHING ENGINE =================
const toolkitData = [
  { word: "AI", sub: "INTELLIGENCE // AGENTS" },
  { word: "WEB", sub: "REACT // ARCHITECTURE" },
  { word: "APP", sub: "MOBILE // REACT NATIVE" },
  { word: "API", sub: "BACKEND // REALTIME" },
];

const tNavBtns = document.querySelectorAll(".t-nav-btn");
const tPanels = document.querySelectorAll(".toolkit-panel");
const giantSub = document.getElementById("toolkitGiantSub");
const tCanvas = document.getElementById("toolkitCanvas");
let tCtx = tCanvas ? tCanvas.getContext("2d") : null;

let tWidth = 0;
let tHeight = 0;
const PARTICLE_COUNT = 2400;
const morphParticles = [];
let activeMorphWord = "AI";

class MorphParticle {
  constructor(w, h) {
    this.x = Math.random() * (w || 400);
    this.y = Math.random() * (h || 400);
    this.targetX = this.x;
    this.targetY = this.y;
    this.size = 1.8;
    this.alpha = 0;
    this.targetAlpha = 0;
    this.ease = 0.08 + Math.random() * 0.04;
    this.baseColor = Math.random() > 0.3 ? "0, 229, 255" : "255, 255, 255";
  }

  update() {
    this.x += (this.targetX - this.x) * this.ease;
    this.y += (this.targetY - this.y) * this.ease;
    this.alpha += (this.targetAlpha - this.alpha) * this.ease;
  }

  draw(ctx) {
    if (this.alpha <= 0.02) return;
    ctx.fillStyle = `rgba(${this.baseColor}, ${this.alpha})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

function sampleTextCoordinates(text, w, h) {
  const offCanvas = document.createElement("canvas");
  const offCtx = offCanvas.getContext("2d");
  offCanvas.width = w;
  offCanvas.height = h;

  offCtx.fillStyle = "#ffffff";
  const fontSize = text.length > 2 ? Math.min(w / 3.4, 130) : Math.min(w / 2.6, 160);
  offCtx.font = `900 ${fontSize}px 'Space Grotesk', sans-serif`;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  if (offCtx.letterSpacing !== undefined) offCtx.letterSpacing = "10px";
  offCtx.fillText(text, w / 2, h / 2 - 25);

  const imgData = offCtx.getImageData(0, 0, w, h).data;
  const coords = [];
  const step = 3;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const index = (y * w + x) * 4;
      if (imgData[index + 3] > 140) {
        coords.push({ x, y });
      }
    }
  }
  return coords;
}

function morphToWord(word) {
  activeMorphWord = word;
  if (!tCanvas) return;

  const coords = sampleTextCoordinates(word, tWidth, tHeight);

  morphParticles.forEach((p, i) => {
    if (i < coords.length) {
      p.targetX = coords[i].x;
      p.targetY = coords[i].y;
      p.targetAlpha = 0.95;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(tWidth, tHeight) * 0.7;
      p.targetX = tWidth / 2 + Math.cos(angle) * radius;
      p.targetY = tHeight / 2 + Math.sin(angle) * radius;
      p.targetAlpha = 0;
    }
  });
}

function resizeToolkitCanvas() {
  if (!tCanvas) return;
  const rect = tCanvas.parentElement.getBoundingClientRect();
  tWidth = tCanvas.width = rect.width;
  tHeight = tCanvas.height = rect.height;

  if (morphParticles.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      morphParticles.push(new MorphParticle(tWidth, tHeight));
    }
  }
  morphToWord(activeMorphWord);
}

function renderParticleMorph() {
  if (tCtx && tCanvas) {
    tCtx.fillStyle = "rgba(3, 6, 17, 0.35)";
    tCtx.fillRect(0, 0, tWidth, tHeight);

    for (let i = 0; i < morphParticles.length; i++) {
      morphParticles[i].update();
      morphParticles[i].draw(tCtx);
    }
  }
  requestAnimationFrame(renderParticleMorph);
}

function switchToolkitTab(index) {
  const targetIndex = parseInt(index, 10);
  tNavBtns.forEach((btn, i) => btn.classList.toggle("active", i === targetIndex));

  const item = toolkitData[targetIndex];
  if (item) {
    morphToWord(item.word);
    if (giantSub) {
      gsap.to(giantSub, {
        opacity: 0,
        y: 6,
        duration: 0.2,
        onComplete: () => {
          giantSub.innerText = item.sub;
          gsap.to(giantSub, { opacity: 1, y: 0, duration: 0.3 });
        },
      });
    }
  }

  tPanels.forEach((panel, i) => {
    if (i === targetIndex) {
      panel.classList.add("active");
      const chips = panel.querySelectorAll(".t-chip");
      gsap.fromTo(chips, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "power2.out" });
    } else {
      panel.classList.remove("active");
    }
  });
}

tNavBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tabIdx = btn.getAttribute("data-tab");
    switchToolkitTab(tabIdx);
  });
});

window.addEventListener("resize", resizeToolkitCanvas);

if (tCanvas) {
  resizeToolkitCanvas();
  renderParticleMorph();
}

gsap.from(".toolkit-left", {
  scrollTrigger: { trigger: ".toolkit-section", start: "top 80%", once: true },
  opacity: 0,
  x: -40,
  duration: 0.8,
  ease: "power3.out",
});

gsap.from(".toolkit-right", {
  scrollTrigger: { trigger: ".toolkit-section", start: "top 80%", once: true },
  opacity: 0,
  scale: 0.95,
  duration: 0.8,
  ease: "power3.out",
});

// ================= GSAP FLIP MODAL CONTROLLER =================
const modal = document.getElementById("projectModal");
const modalSlot = document.getElementById("modalSlot");
const closeModalBtn = document.getElementById("closeProjectModal");
let activeSourceCard = null;

function openCardModal(card) {
  if (modal.classList.contains("active")) return;
  activeSourceCard = card;

  modalSlot.innerHTML = "";
  const clonedCard = card.cloneNode(true);
  clonedCard.classList.add("flipped-active");

  const clonedBtn = clonedCard.querySelector(".card-footer");
  if (clonedBtn) clonedBtn.remove();

  modalSlot.appendChild(clonedCard);
  const state = Flip.getState(clonedCard, { props: "borderRadius,boxShadow" });

  modal.classList.add("active");
  Flip.from(state, {
    targets: clonedCard,
    duration: 0.55,
    ease: "power3.out",
    scale: true,
  });
}

function closeCardModal() {
  if (!modal.classList.contains("active")) return;
  const clonedCard = modalSlot.querySelector(".card-3d");
  if (!clonedCard || !activeSourceCard) {
    modal.classList.remove("active");
    return;
  }

  gsap.to(clonedCard, {
    opacity: 0,
    scale: 0.9,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
      modal.classList.remove("active");
      modalSlot.innerHTML = "";
      activeSourceCard = null;
    },
  });
}

document.querySelectorAll(".card-btn").forEach((btn, index) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetCard = cards[index];
    if (targetCard) openCardModal(targetCard);
  });
});

cards.forEach((card, index) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest(".card-btn")) return;
    const currentCenter = Math.round(carouselProgress.val);
    if (currentCenter === index) {
      openCardModal(card);
    } else {
      gsap.to(carouselProgress, {
        val: index,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: apply3DCardTransforms,
        onComplete: () => {
          openCardModal(card);
        },
      });
    }
  });
});

closeModalBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  closeCardModal();
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeCardModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCardModal();
});

// ================= NATIVE MICROPHONE GATE & CONTROLLER =================
const mediaGate = document.getElementById("mediaGate");
const btnGrantMedia = document.getElementById("btnGrantMedia");
const btnSkipMedia = document.getElementById("btnSkipMedia");

function dismissMediaGateAndStart(audioEnabled) {
  if (mediaGate) {
    gsap.to(mediaGate, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        mediaGate.style.display = "none";
        mediaGate.classList.remove("active");
      },
    });
  }

  if (audioEnabled) {
    playAudioStream();
  } else {
    if (audioStatus) audioStatus.innerText = "SOUND: OFF";
  }

  startPreloader();
}

async function checkMicrophonePermission() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const permission = await navigator.permissions.query({ name: "microphone" });

      if (permission.state === "granted") {
        if (mediaGate) mediaGate.style.display = "none";
        dismissMediaGateAndStart(true);
        return;
      }

      permission.onchange = () => {
        if (permission.state === "granted") {
          dismissMediaGateAndStart(true);
        }
      };
    }
  } catch (error) {
    console.log("Could not query microphone permission directly:", error);
  }

  if (mediaGate) {
    mediaGate.style.display = "flex";
  }
}

// Trigger initial check
checkMicrophonePermission();

// Enable Microphone button handler
if (btnGrantMedia) {
  btnGrantMedia.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      dismissMediaGateAndStart(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      dismissMediaGateAndStart(true);
    } catch (error) {
      console.warn("Microphone access denied by user:", error);
      dismissMediaGateAndStart(false);
    }
  });
}

// Skip button handler
if (btnSkipMedia) {
  btnSkipMedia.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    dismissMediaGateAndStart(false);
  });
}