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
const framePath = (i) => `public/frames/frame_${(i + 1).toString().padStart(4, "0")}.webp`;
const images = [];
const sequence = { frame: 0 };
let loadedImagesCount = 0;

// Canvas Resize Function
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

// 2. Preload Canvas Frames in Background
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

// 3. Ambient Audio Manager
const bgAudio = document.getElementById("bgMusic");
const audioToggle = document.getElementById("audioToggle");
const audioStatus = document.getElementById("audioStatus");
let isAudioPlaying = false;

if (bgAudio) {
  bgAudio.volume = 0.45;
  bgAudio.play().then(() => {
    isAudioPlaying = true;
    audioToggle?.classList.add("playing");
    if (audioStatus) audioStatus.innerText = "SOUND: ON";
  }).catch(() => {});
}

function toggleAudio() {
  if (!bgAudio) return;
  if (isAudioPlaying) {
    bgAudio.pause();
    isAudioPlaying = false;
    audioToggle.classList.remove("playing");
    audioStatus.innerText = "SOUND: OFF";
  } else {
    bgAudio.play().then(() => {
      isAudioPlaying = true;
      audioToggle.classList.add("playing");
      audioStatus.innerText = "SOUND: ON";
    }).catch(() => {});
  }
}
audioToggle?.addEventListener("click", toggleAudio);

// 4. Guaranteed 10-Second Preloader Counter
(function runPreloaderCounter() {
  const counterEl = document.getElementById("counter");
  const barFill = document.querySelector(".bar-fill");
  const preloader = document.getElementById("preloader");
  const loaderVideo = document.getElementById("loaderVideo");

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
})();

// 5. Scroll Frame Scrub
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

// 6. About Section Animations
gsap.fromTo(".about-left", 
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
    }
  }
);

gsap.fromTo(".about-right", 
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
    }
  }
);

// 7. 3D Pinned Carousel ScrollTrigger
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
        onUpdate: apply3DCardTransforms
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
  dots.forEach((dot, i) => dot.classList.toggle("active", i === clampedIdx));

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
      // Active center card gets full pointer priority; side cards remain clickable to navigate
      card.style.pointerEvents = "auto";
      card.style.filter = isCurrentCenter ? "none" : `blur(${absOffset * 2.5}px) brightness(0.65)`;
      // Guaranteed stacking order: active card is 100, neighboring cards drop to 90, 80...
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
  }
});

document.getElementById("nextCard")?.addEventListener("click", () => {
  const nextVal = Math.min(cards.length - 1, Math.round(carouselProgress.val) + 1);
  gsap.to(carouselProgress, {
    val: nextVal,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: apply3DCardTransforms
  });
});

document.getElementById("prevCard")?.addEventListener("click", () => {
  const prevVal = Math.max(0, Math.round(carouselProgress.val) - 1);
  gsap.to(carouselProgress, {
    val: prevVal,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: apply3DCardTransforms
  });
});

apply3DCardTransforms();

// 8. 3D Project Card Hover Effects
cards.forEach((card) => {
  const diagram = card.querySelector(".banner-diagram");
  const tags = card.querySelectorAll(".tag-chips span");
  const btn = card.querySelector(".card-btn");
  const title = card.querySelector(".card-body h3");

  card.addEventListener("mouseenter", () => {
    if (parseInt(card.style.zIndex || "0") < 9) return;

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

// 9. Tilt Init
VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
  max: 15,
  speed: 400,
  glare: true,
  "max-glare": 0.4,
});

// 10. Form Submission Animation
function handleFormSubmit() {
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  
  btnText.innerText = "ENCRYPTING & TRANSMITTING...";
  submitBtn.style.pointerEvents = "none";

  setTimeout(() => {
    submitBtn.classList.add("success");
    btnText.innerText = "TRANSMISSION RECEIVED ✓";

    setTimeout(() => {
      document.getElementById("contactForm").reset();
      submitBtn.classList.remove("success");
      btnText.innerText = "TRANSMIT MESSAGE";
      submitBtn.style.pointerEvents = "auto";
    }, 3000);
  }, 1200);
}

// ================= MY TOOLKIT INTERACTIVE ENGINE =================
const toolkitData = [
  { text: "AI", sub: "INTELLIGENCE // AGENTS" },
  { text: "WEB", sub: "REACT // ARCHITECTURE" },
  { text: "APP", sub: "MOBILE // REACT NATIVE" },
  { text: "API", sub: "BACKEND // REALTIME" }
];

const tNavBtns = document.querySelectorAll(".t-nav-btn");
const tPanels = document.querySelectorAll(".toolkit-panel");
const giantText = document.getElementById("toolkitGiantText");
const giantSub = document.getElementById("toolkitGiantSub");

function switchToolkitTab(index) {
  tNavBtns.forEach((btn, i) => btn.classList.toggle("active", i === index));

  if (giantText && giantSub) {
    gsap.to([giantText, giantSub], {
      opacity: 0,
      scale: 0.8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        giantText.innerText = toolkitData[index].text;
        giantSub.innerText = toolkitData[index].sub;
        
        gsap.to([giantText, giantSub], {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.7)",
        });
      },
    });
  }

  tPanels.forEach((panel, i) => {
    if (i === index) {
      panel.classList.add("active");
      const chips = panel.querySelectorAll(".t-chip");
      gsap.fromTo(chips, 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "power2.out" }
      );
    } else {
      panel.classList.remove("active");
    }
  });
}

tNavBtns.forEach((btn, i) => {
  btn.addEventListener("click", () => switchToolkitTab(i));
});

(function initToolkitParticles() {
  const tCanvas = document.getElementById("toolkitCanvas");
  if (!tCanvas) return;
  const tCtx = tCanvas.getContext("2d");

  let w = (tCanvas.width = tCanvas.offsetWidth || 400);
  let h = (tCanvas.height = tCanvas.offsetHeight || 400);

  const particles = [];
  const particleCount = 45;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
    });
  }

  function draw() {
    tCtx.clearRect(0, 0, w, h);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      tCtx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`;
      tCtx.beginPath();
      tCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      tCtx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    w = tCanvas.width = tCanvas.offsetWidth;
    h = tCanvas.height = tCanvas.offsetHeight;
  });

  draw();
})();

gsap.from(".toolkit-left", {
  scrollTrigger: {
    trigger: ".toolkit-section",
    start: "top 80%",
    once: true,
  },
  opacity: 0,
  x: -40,
  duration: 0.8,
  ease: "power3.out",
});

gsap.from(".toolkit-right", {
  scrollTrigger: {
    trigger: ".toolkit-section",
    start: "top 80%",
    once: true,
  },
  opacity: 0,
  scale: 0.95,
  duration: 0.8,
  ease: "power3.out",
}); 

// ================= ROBUST GSAP FLIP MODAL CONTROLLER =================
const modal = document.getElementById("projectModal");
const modalSlot = document.getElementById("modalSlot");
const closeModalBtn = document.getElementById("closeProjectModal");
let activeSourceCard = null;

function openCardModal(card) {
  if (modal.classList.contains("active")) return;
  activeSourceCard = card;

  // 1. Clear previous modal contents
  modalSlot.innerHTML = "";

  // 2. Clone the card into the modal slot
  const clonedCard = card.cloneNode(true);
  clonedCard.classList.add("flipped-active");
  
  // Remove explore button from inside modal
  const clonedBtn = clonedCard.querySelector(".card-footer");
  if (clonedBtn) clonedBtn.remove();

  modalSlot.appendChild(clonedCard);

  // 3. Capture start bounds from original 3D card
  const state = Flip.getState(clonedCard, {
    props: "borderRadius,boxShadow",
  });

  // Position clone over original card before opening
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
    }
  });
}

// Bind direct clicks to ALL Explore buttons and Cards
document.querySelectorAll(".card-btn").forEach((btn, index) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetCard = cards[index];
    if (targetCard) openCardModal(targetCard);
  });
});

cards.forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest(".card-btn")) return;
    openCardModal(card);
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