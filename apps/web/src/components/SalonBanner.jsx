import { Instagram, MessageCircle, ArrowUpRight } from "lucide-react";
import { INSTAGRAM_URL, whatsappLink } from "@/utils/salon";

export default function SalonBanner() {
  const whatsapp = whatsappLink(
    "Olá! Gostaria de saber mais sobre os serviços e produtos da Sabrina Braids.",
  );
  return (
    <section
      aria-labelledby="banner-heading"
      className="bg-[#949870] px-3 py-6 sm:px-6 sm:py-10"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="banner-heading" className="sr-only">
          Conheça a Sabrina Braids e entre em contato
        </h2>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl border border-[#444c35]/15 shadow-sm">
          <img
            src="/brand/sabrina-banner.webp"
            width="1800"
            height="942"
            alt="Sabrina Braids — estúdio de beleza e lingerie. Tranças e nagôs, entrelace, dreads, mega hair e produtos para fibras. Atendimento com horário marcado; pacotes com material incluso. WhatsApp (21) 99366-2669 e Instagram @sabrin_braids."
            loading="eager"
            fetchPriority="high"
            className="block h-auto w-full"
          />
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp no banner"
            title="Falar com a Sabrina no WhatsApp"
            className="banner-hotspot left-[22.5%] top-[88%] h-[10%] w-[5.5%]"
          />
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram no banner"
            title="Abrir Instagram @sabrin_braids"
            className="banner-hotspot left-[31%] top-[83%] h-[7%] w-[18%]"
          />
        </div>
        <div className="mx-auto mt-5 flex max-w-[1200px] flex-wrap items-center justify-center gap-3">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#303827] px-5 py-3 text-sm font-medium text-white hover:bg-[#444c35]"
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#303827]/40 bg-[#f5f3e9] px-5 py-3 text-sm font-medium text-[#303827] hover:bg-white"
          >
            <Instagram size={18} aria-hidden="true" />
            Instagram
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
