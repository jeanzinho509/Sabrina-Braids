import BrandLogo from "@/components/BrandLogo";
import ServicePhoto from "@/components/ServicePhoto";

import { useEffect, useRef, useState } from "react";
import {
  salonDate,
  whatsappLink,
  money,
  SALON_HOURS_LABELS,
  SALON_ADDRESS,
} from "@/utils/salon";
import { apiRequest } from "@/utils/useApi";
import useUpload from "@/utils/useUpload";
import { useQuery } from "@tanstack/react-query";

export default function AgendarPage() {
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const appliedServiceFromUrl = useRef(false);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelImage, setCustomModelImage] = useState("");
  const [customModelDescription, setCustomModelDescription] = useState("");
  const [uploadedImagePreview, setUploadedImagePreview] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [upload, { loading: uploading }] = useUpload();

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    notes: "",
  });

  const catalog = useQuery({
    queryKey: ["salon", "/api/services"],
    queryFn: ({ signal }) => apiRequest("/api/services", { signal }),
    retry: false,
  });
  const services = catalog.data?.services || [];
  const servicesLoading = catalog.isPending;
  const duration = isCustomModel ? 300 : selectedService?.duration_minutes;
  const availability = useQuery({
    queryKey: ["availability", selectedDate, duration],
    queryFn: ({ signal }) =>
      apiRequest(
        `/api/appointments/available-times?date=${selectedDate}&duration=${duration}`,
        { signal },
      ),
    enabled: Boolean(selectedDate && duration),
    retry: false,
  });
  const availableTimes = availability.data?.availableSlots || [];
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate, duration]);
  useEffect(() => {
    if (!catalog.data || appliedServiceFromUrl.current) return;
    appliedServiceFromUrl.current = true;
    const id = new URLSearchParams(window.location.search).get("service");
    const service = catalog.data.services?.find(
      (item) => String(item.id) === id,
    );
    if (service) {
      setSelectedService(service);
      setIsCustomModel(false);
      setStep(2);
    }
  }, [catalog.data]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setIsCustomModel(false);
    setCustomModelImage("");
    setCustomModelDescription("");
    setUploadedImagePreview("");
    setStep(2);
  };

  const handleCustomModelSelect = () => {
    setIsCustomModel(true);
    setSelectedService(null);
    setStep(2);
  };

  const handleCustomImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCustomModelImage("");
    setUploadedImagePreview("");
    setError(null);
    const result = await upload({ file });
    if (result.error) {
      setError(result.error);
      return;
    }
    setCustomModelImage(result.url);
    setUploadedImagePreview(result.url);
  };

  const handleDateSelect = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || uploading) return;
    if (
      !selectedDate ||
      !selectedTime ||
      (!selectedService && !isCustomModel)
    ) {
      setError("Selecione serviço, data e horário.");
      return;
    }
    setLoading(true);
    setError(null);

    // Validações adicionais para modelo customizado
    if (isCustomModel && (!customModelImage || !customModelDescription)) {
      setError("Para modelo customizado, adicione uma imagem e descrição");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail,
          serviceId: isCustomModel ? null : selectedService.id,
          appointmentDate: selectedDate,
          startTime: selectedTime,
          notes: formData.notes,
          custom_model_image: isCustomModel ? customModelImage : null,
          custom_model_description: isCustomModel
            ? customModelDescription
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          setSelectedTime("");
          setSelectedDate("");
          setStep(2);
        }
        throw new Error(errorData.error || "Erro ao criar agendamento");
      }

      const data = await response.json();
      setSuccess(true);
      setStep(4);

      // Abrir WhatsApp com mensagem pré-formatada
      const serviceName = isCustomModel
        ? "Modelo Customizado"
        : selectedService.name;
      const whatsappMessage =
        `Olá! Acabei de fazer um agendamento:\n\n` +
        `📅 Serviço: ${serviceName}\n` +
        `📆 Data: ${new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR")}\n` +
        `⏰ Horário: ${selectedTime}\n` +
        `👤 Nome: ${formData.clientName}\n\n` +
        `Aguardo a confirmação!`;

      setWhatsappUrl(whatsappLink(whatsappMessage));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const minDate = salonDate();
  const maxDate = new Date(Date.parse(`${minDate}T12:00:00Z`) + 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href="/"
              className="text-2xl font-semibold text-gray-900 tracking-tight"
            >
              <BrandLogo />
            </a>
            <div className="text-sm text-gray-600">Agendamento Online</div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {[
              { num: 1, label: "Serviço" },
              { num: 2, label: "Data & Hora" },
              { num: 3, label: "Seus Dados" },
              { num: 4, label: "Confirmação" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.num
                        ? "border-blue-600 bg-[#5c4737] text-white"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {s.num}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${step >= s.num ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`h-0.5 flex-1 -mt-6 transition-colors ${
                      step > s.num ? "bg-[#5c4737]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              Escolha o serviço
            </h2>
            <p className="text-gray-600 mb-8">
              Selecione o estilo de trança que você deseja
            </p>

            {servicesLoading && (
              <p role="status" className="mb-4">
                Carregando serviços...
              </p>
            )}
            {catalog.isError && (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p>
                  Não foi possível carregar os serviços. Tente novamente ou fale
                  conosco pelo WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => catalog.refetch()}
                  className="mt-2 underline"
                >
                  Tentar carregar serviços novamente
                </button>
              </div>
            )}
            {catalog.isSuccess && !services.length && (
              <p className="mb-4 text-sm text-gray-600">
                O catálogo ainda não está disponível. Você pode solicitar um
                modelo personalizado ou falar conosco pelo{" "}
                <a
                  className="underline"
                  href={whatsappLink("Olá! Gostaria de agendar um horário.")}
                >
                  WhatsApp
                </a>
                .
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 transition-colors"
                >
                  <ServicePhoto
                    service={service}
                    className="mb-4 aspect-[4/3] rounded-lg"
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-2xl font-semibold text-gray-900">
                      {money(service.price)}
                    </span>
                    <div className="bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-medium">
                      {Math.floor(service.duration_minutes / 60)}h{" "}
                      {service.duration_minutes % 60 > 0
                        ? `${service.duration_minutes % 60}min`
                        : ""}
                    </div>
                  </div>
                </button>
              ))}

              {/* Opção "Outro Modelo" - NEW */}
              <button
                onClick={handleCustomModelSelect}
                className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 text-left hover:border-gray-900 transition-colors group"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[180px]">
                  <svg
                    className="w-12 h-12 text-gray-400 group-hover:text-gray-600 transition-colors mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Outro Modelo
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    Envie uma foto do modelo que você deseja
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date, Time and Custom Model */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
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
              Voltar
            </button>

            {/* Custom Model Form - NEW */}
            {isCustomModel && (
              <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Envie o Modelo Desejado
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Foto do Modelo *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCustomImageUpload}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                  />
                  {uploading && (
                    <p className="mt-2 text-sm text-gray-600">
                      Fazendo upload...
                    </p>
                  )}
                  {uploadedImagePreview && (
                    <div className="mt-4">
                      <img
                        src={uploadedImagePreview}
                        alt="Preview"
                        className="max-w-xs rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Descrição do Modelo *
                  </label>
                  <textarea
                    value={customModelDescription}
                    onChange={(e) => setCustomModelDescription(e.target.value)}
                    placeholder="Descreva o modelo que você deseja fazer..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {selectedService && !isCustomModel && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isCustomModel
                        ? "Modelo personalizado"
                        : selectedService?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {isCustomModel
                        ? "Valor a combinar"
                        : money(selectedService?.price)}{" "}
                      •{" "}
                      {Math.floor(
                        (selectedService?.duration_minutes || 0) / 60,
                      )}
                      h
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              Escolha a data e horário
            </h2>
            <p className="text-gray-600 mb-8">
              Selecione quando você quer fazer suas tranças
            </p>
            <div className="mb-6 rounded-xl border border-[#e8dcc8] bg-[#fcfaf7] p-4 text-sm text-[#725744]">
              {SALON_HOURS_LABELS.map((label) => (
                <p key={label}>{label}</p>
              ))}
              <p className="mt-2">
                Os horários disponíveis consideram a duração completa do
                serviço.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <span id="booking-date-label">Data</span>
                </label>
                <input
                  type="date"
                  aria-labelledby="booking-date-label"
                  value={selectedDate}
                  onChange={handleDateSelect}
                  min={minDate}
                  max={maxDate}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  * Fechado aos sábados
                </p>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Horário disponível
                  </label>
                  {availability.isFetching ? (
                    <div role="status" className="text-sm text-gray-600">
                      Carregando horários...
                    </div>
                  ) : availability.isError ? (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                      <p>
                        Não foi possível consultar os horários. Isso não
                        significa que a agenda está cheia.
                      </p>
                      <button
                        type="button"
                        onClick={() => availability.refetch()}
                        className="mt-2 underline"
                      >
                        Consultar horários novamente
                      </button>
                    </div>
                  ) : availability.isSuccess && availableTimes.length === 0 ? (
                    <div role="status" className="text-sm text-gray-600">
                      {new Date(`${selectedDate}T12:00:00Z`).getUTCDay() === 6
                        ? "O salão fecha aos sábados. Escolha outra data."
                        : "Não há horários livres para a duração deste serviço nesta data. Escolha outra data."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map((slot) => (
                        <button
                          key={slot.start}
                          disabled={uploading}
                          onClick={() => {
                            if (
                              isCustomModel &&
                              (!customModelImage ||
                                !customModelDescription.trim())
                            ) {
                              setError(
                                "Adicione a imagem e a descrição do modelo antes de escolher o horário.",
                              );
                              return;
                            }
                            setSelectedTime(slot.start);
                            setStep(3);
                          }}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {slot.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
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
              Voltar
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isCustomModel
                      ? "Modelo personalizado"
                      : selectedService?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}{" "}
                    às {selectedTime}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              Seus dados
            </h2>
            <p className="text-gray-600 mb-8">
              Preencha suas informações para confirmar o agendamento
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="(21) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEmail: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                  placeholder="Alguma preferência ou informação importante?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5c4737] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8c6b52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Confirmando..." : "Confirmar Agendamento"}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && success && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              Solicitação recebida!
            </h2>
            <p className="text-gray-600 mb-8">
              Seu pedido foi salvo e aguarda confirmação da equipe. Fale conosco
              pelo WhatsApp para combinar os detalhes.
            </p>

            <p className="mb-6 text-sm text-gray-600">
              {SALON_ADDRESS.street} · {SALON_ADDRESS.complement} · CEP{" "}
              {SALON_ADDRESS.postalCode}
            </p>
            <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto mb-8">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-medium text-gray-900">
                    {isCustomModel
                      ? "Modelo personalizado"
                      : selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium text-gray-900">
                    {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-gray-900">
                    {isCustomModel
                      ? "Valor a combinar"
                      : money(selectedService?.price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-green-700 px-6 py-3 font-medium text-white"
                >
                  Continuar no WhatsApp
                </a>
              )}
              <a
                href="/"
                className="bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Voltar para o início
              </a>
              <a
                href="/agendar"
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedDate("");
                  setSelectedTime("");
                  setFormData({
                    clientName: "",
                    clientPhone: "",
                    clientEmail: "",
                    notes: "",
                  });
                  setSuccess(false);
                }}
                className="bg-[#5c4737] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8c6b52] transition-colors"
              >
                Fazer outro agendamento
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
