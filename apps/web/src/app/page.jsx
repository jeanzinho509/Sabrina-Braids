import SalonBanner from "@/components/SalonBanner";
import BrandLogo from "@/components/BrandLogo";
import ProductsSection from "@/components/ProductsSection";
import ServicePhoto from "@/components/ServicePhoto";

import { useEffect, useState } from "react";
import { apiRequest } from "@/utils/useApi";
import { money, SALON_ADDRESS, SALON_HOURS_LABELS } from "@/utils/salon";

export default function HomePage() {
  const [loadErrors, setLoadErrors] = useState([]);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      setLoading(true);
      const sections = [
        ["services", setServices],
        ["gallery", setGallery],
        ["videos", setVideos],
      ];
      const results = await Promise.allSettled(
        sections.map(([key]) =>
          apiRequest(`/api/${key}`, { signal: controller.signal }),
        ),
      );
      if (controller.signal.aborted) return;
      const errors = [];
      results.forEach((result, index) => {
        const [key, setItems] = sections[index];
        if (result.status === "fulfilled") setItems(result.value[key] || []);
        else errors.push(key);
      });
      setLoadErrors(errors);
      setLoading(false);
    }
    fetchData();
    return () => controller.abort();
  }, [loadAttempt]);

  // Auto-avançar carrossel a cada 5 segundos
  useEffect(() => {
    if (gallery.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [gallery.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + gallery.length) % gallery.length,
    );
  };

  const PLATFORM_LABELS = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    other: "Vídeo",
  };
  const PLATFORM_COLORS = {
    youtube: "#EF4444",
    instagram: "#E1306C",
    tiktok: "#111827",
    other: "#6B7280",
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a
              href="/"
              aria-label="Sabrina Braids — início"
              className="text-gray-900"
            >
              <BrandLogo />
            </a>
            <nav className="flex flex-wrap items-center gap-4">
              <a
                href="#services"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Serviços
              </a>
              <a
                href="#products"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Produtos
              </a>
              <a
                href="#about"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sobre
              </a>
              <a
                href="/agendar"
                className="bg-[#444c35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5b6247] transition-colors"
              >
                Agendar Agora
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#f5f3e9] to-[#e0e4cc] py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs font-medium text-gray-700">
                Aceito novos agendamentos
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-6">
              Transforme seu visual com tranças exclusivas
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Especialista em box braids, knotless, passion twists e muito mais.
              Mais de 5 anos de experiência criando penteados únicos que
              valorizam sua beleza natural.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/agendar"
                className="bg-[#444c35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#303827] transition-colors inline-flex items-center gap-2"
              >
                Agendar Horário
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
              <a
                href="https://wa.me/5521993662669?text=Olá! Gostaria de saber mais sobre os serviços"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {loadErrors.length > 0 && (
        <div
          role="alert"
          className="mx-auto max-w-7xl px-4 py-6 text-sm text-[#725744]"
        >
          {loadErrors.includes("services")
            ? "Não foi possível carregar os serviços agora."
            : "Algumas fotos ou vídeos não puderam ser carregados."}{" "}
          <button
            disabled={loading}
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="underline"
          >
            Tentar novamente
          </button>{" "}
          ou{" "}
          <a href="https://wa.me/5521993662669" className="underline">
            falar pelo WhatsApp
          </a>
          .
        </div>
      )}
      {/* Gallery Carousel Section - NEW */}
      {gallery.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
                Nossos Trabalhos
              </h3>
              <p className="text-gray-600">
                Veja alguns dos nossos melhores trabalhos
              </p>
            </div>

            <div className="relative">
              <div className="relative h-[500px] overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={gallery[currentImageIndex]?.image_url}
                  alt={
                    gallery[currentImageIndex]?.caption ||
                    "Galeria Sabrina Braids"
                  }
                  className="w-full h-full object-cover"
                />

                {gallery[currentImageIndex]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                    <p className="text-center text-lg">
                      {gallery[currentImageIndex].caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de navegação */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-3 rounded-full transition-all shadow-lg"
                aria-label="Imagem anterior"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-3 rounded-full transition-all shadow-lg"
                aria-label="Próxima imagem"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Indicadores */}
              <div className="flex justify-center gap-2 mt-4">
                {gallery.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 transition-all rounded-full ${
                      index === currentImageIndex
                        ? "bg-[#444c35] w-8"
                        : "bg-gray-300 hover:bg-gray-400 w-2"
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
                Vídeos
              </h3>
              <p className="text-gray-600">
                Assista aos nossos trabalhos em vídeo
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => {
                const color = PLATFORM_COLORS[video.platform] || "#6B7280";
                const label = PLATFORM_LABELS[video.platform] || "Vídeo";
                return (
                  <a
                    key={video.id}
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group block"
                  >
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <svg
                          className="w-8 h-8 text-white ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                    </div>
                    <div className="p-4">
                      <span
                        className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-2"
                        style={{ backgroundColor: color + "18", color }}
                      >
                        {label}
                      </span>
                      {video.title && (
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {video.title}
                        </h4>
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {video.video_url}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <SalonBanner />

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">
              Serviços
            </h3>
            <p className="text-gray-600">Escolha o estilo perfeito para você</p>
          </div>

          {loading && (
            <p role="status" className="mb-6 text-gray-600">
              Carregando serviços...
            </p>
          )}
          {!loading && !loadErrors.includes("services") && !services.length && (
            <p className="mb-6 text-gray-600">
              Estamos preparando nosso catálogo. Fale conosco pelo WhatsApp para
              conhecer os modelos.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
              >
                <ServicePhoto service={service} className="aspect-[4/3]" />
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-semibold text-gray-900">
                        {money(service.price)}
                      </span>
                    </div>
                    <div className="bg-[#e8ecdc] text-[#444c35] rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {Math.floor(service.duration_minutes / 60)}h{" "}
                      {service.duration_minutes % 60 > 0
                        ? `${service.duration_minutes % 60}min`
                        : ""}
                    </div>
                  </div>

                  <a
                    href={`/agendar?service=${service.id}`}
                    className="block w-full bg-[#444c35] text-white text-center px-4 py-2.5 rounded-lg font-medium hover:bg-[#303827] transition-colors"
                  >
                    Agendar este serviço
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductsSection />

      {/* About Section */}

      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-6">
              Sobre Sabrina Braids
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Com mais de 5 anos de experiência, sou especialista em diversos
              estilos de tranças afro. Meu objetivo é valorizar a beleza natural
              de cada cliente, criando penteados únicos que combinam tradição e
              modernidade.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Cada trança é feita com cuidado e atenção aos detalhes, garantindo
              não apenas um visual incrível, mas também a saúde dos seus
              cabelos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-semibold text-white tracking-tight mb-4">
            Pronta para transformar seu visual?
          </h3>
          <p className="text-lg text-gray-300 mb-8">
            Agende seu horário agora e garanta o melhor dia para você
          </p>
          <a
            href="/agendar"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Agendar Agora
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer - UPDATED CONTACT INFO */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <a
                href="/"
                aria-label="Sabrina Braids — início"
                className="mb-4 inline-block text-gray-900"
              >
                <BrandLogo />
              </a>
              <p className="text-sm text-gray-600">
                Transformando cabelos em obras de arte
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Contato
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <address className="not-italic">
                  <p>{SALON_ADDRESS.street}</p>
                  <p>{SALON_ADDRESS.complement}</p>
                  <p>CEP {SALON_ADDRESS.postalCode}</p>
                </address>
                <p className="mt-3">WhatsApp: (21) 99366-2669</p>
                <p>WhatsApp: (21) 97373-5791</p>
                <p className="mt-3">
                  <a
                    href="mailto:estimesabrina15@gmail.com"
                    className="hover:text-gray-900"
                  >
                    estimesabrina15@gmail.com
                  </a>
                </p>
                <p>
                  <a
                    href="https://instagram.com/sabrin_braids"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    @sabrin_braids
                  </a>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Horário
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                {SALON_HOURS_LABELS.map((label, index) => (
                  <p
                    key={label}
                    className={index === 2 ? "text-red-600 font-medium" : ""}
                  >
                    {label}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Sabrina Braids. Todos os direitos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
