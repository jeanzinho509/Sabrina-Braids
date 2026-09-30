import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 350);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-[#444c35] text-white shadow-lg hover:bg-[#303827] sm:right-6"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        })
      }
    >
      <ArrowUp aria-hidden="true" size={22} />
    </button>
  );
}
