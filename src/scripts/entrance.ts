// Content stays visible without JavaScript; animate each element only once.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const delays = new Map<Element, number>();
  const animations = new Set<Animation>();

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    delays.set(element, Number(element.dataset.revealDelay) || 0);
  });

  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    Array.from(group.children).forEach((element, index) => {
      delays.set(element, (index % 3) * 60);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    if (reducedMotion.matches) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);

      const animation = entry.target.animate(
        [
          { opacity: 0, translate: "0 12px" },
          { opacity: getComputedStyle(entry.target).opacity, translate: "0 0" },
        ],
        {
          duration: 650,
          delay: delays.get(entry.target) ?? 0,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );
      animations.add(animation);
      animation.addEventListener("finish", () => animations.delete(animation), {
        once: true,
      });
    }
  }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

  delays.forEach((_, element) => observer.observe(element));

  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  });
}
