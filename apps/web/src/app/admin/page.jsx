"use client";

import { useEffect, useState, useCallback } from "react";
import useUpload from "@/utils/useUpload";
import useUser from "@/utils/useUser";

function detectPlatform(url) {
  if (!url) return "other";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "other";
}
const PLATFORM_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "Outro",
};
const PLATFORM_COLORS = {
  youtube: "#EF4444",
  instagram: "#E1306C",
  tiktok: "#111827",
  other: "#6B7280",
};

export default function AdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploading }] = useUpload();
  const [appointments, setAppointments] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");

  // Time blocks
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({
    blockDate: "",
    startTime: "",
    endTime: "",
    reason: "",
  });
  const [timeBlocks, setTimeBlocks] = useState([]);

  // Gallery
  const [gallery, setGallery] = useState([]);
  const [editingGallery, setEditingGallery] = useState(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [newGalleryCaption, setNewGalleryCaption] = useState("");
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState("");
  const [newGalleryImageFile, setNewGalleryImageFile] = useState(null);

  // Services
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    image_url: "",
  });
  const [serviceImageFile, setServiceImageFile] = useState(null);

  // Videos
  const [videos, setVideos] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: "", video_url: "" });

  const ALLOWED_EMAILS = [
    "jean.dev.com@gmail.com",
    "estimesabrina15@gmail.com",
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    } else if (
      !userLoading &&
      user &&
      !ALLOWED_EMAILS.includes(user.email?.toLowerCase().trim())
    ) {
      alert("Usuário sem acesso, procure admin");
      window.location.href = "/";
    }
  }, [user, userLoading]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    let url = "/api/appointments?";
    if (filterDate) url += `date=${filterDate}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus]);

  const loadTimeBlocks = useCallback(async () => {
    try {
      const r = await fetch("/api/time-blocks");
      const d = await r.json();
      setTimeBlocks(d.timeBlocks || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadGallery = useCallback(async () => {
    try {
      const r = await fetch("/api/gallery?active=false");
      const d = await r.json();
      if (d.success) setGallery(d.gallery);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const r = await fetch("/api/services");
      const d = await r.json();
      if (d.services) setServices(d.services);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadVideos = useCallback(async () => {
    try {
      const r = await fetch("/api/videos");
      const d = await r.json();
      if (d.success) setVideos(d.videos);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    loadTimeBlocks();
    loadGallery();
    loadServices();
    loadVideos();
  }, [filterDate, filterStatus]);

  if (userLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  if (!user || !ALLOWED_EMAILS.includes(user.email?.toLowerCase().trim()))
    return null;

  // ── Appointment helpers ──
  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadAppointments();
    } catch (e) {
      console.error(e);
    }
  };
  const createTimeBlock = async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/time-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockForm),
      });
      setShowBlockForm(false);
      setBlockForm({ blockDate: "", startTime: "", endTime: "", reason: "" });
      loadTimeBlocks();
    } catch (e) {
      console.error(e);
    }
  };
  const deleteTimeBlock = async (id) => {
    if (!confirm("Remover bloqueio?")) return;
    try {
      await fetch(`/api/time-blocks/${id}`, { method: "DELETE" });
      loadTimeBlocks();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Gallery helpers ──
  const handleGalleryImageUpload = async (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const { url, error } = await upload({ base64: reader.result });
      if (error) {
        alert("Erro ao enviar imagem");
        return;
      }
      if (isEdit) setEditingGallery((p) => ({ ...p, image_url: url }));
      else setNewGalleryImageUrl(url);
    };
    reader.readAsDataURL(file);
  };
  const addGalleryPhoto = async () => {
    if (!newGalleryImageUrl) {
      alert("Selecione uma imagem");
      return;
    }
    await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: newGalleryImageUrl,
        caption: newGalleryCaption,
        display_order: gallery.length,
      }),
    });
    setShowGalleryForm(false);
    setNewGalleryCaption("");
    setNewGalleryImageUrl("");
    loadGallery();
  };
  const saveGalleryEdit = async () => {
    await fetch(`/api/gallery/${editingGallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: editingGallery.image_url,
        caption: editingGallery.caption,
      }),
    });
    setEditingGallery(null);
    loadGallery();
  };
  const deleteGalleryPhoto = async (id) => {
    if (!confirm("Remover foto?")) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    loadGallery();
  };

  // ── Service helpers ──
  const handleServiceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const { url, error } = await upload({ base64: reader.result });
      if (error) {
        alert("Erro ao enviar imagem");
        return;
      }
      setServiceForm((p) => ({ ...p, image_url: url }));
    };
    reader.readAsDataURL(file);
  };
  const saveService = async () => {
    const method = editingService ? "PATCH" : "POST";
    const url = editingService
      ? `/api/services/${editingService.id}`
      : "/api/services";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        duration_minutes: parseInt(serviceForm.duration_minutes),
      }),
    });
    setShowServiceForm(false);
    setEditingService(null);
    setServiceForm({
      name: "",
      description: "",
      price: "",
      duration_minutes: "",
      image_url: "",
    });
    loadServices();
  };
  const deleteService = async (id) => {
    if (!confirm("Remover serviço?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    loadServices();
  };
  const openEditService = (s) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      description: s.description || "",
      price: String(s.price),
      duration_minutes: String(s.duration_minutes),
      image_url: s.image_url || "",
    });
    setShowServiceForm(true);
  };

  // ── Video helpers ──
  const addVideo = async () => {
    if (!videoForm.video_url) {
      alert("URL é obrigatória");
      return;
    }
    await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...videoForm,
        platform: detectPlatform(videoForm.video_url),
      }),
    });
    setShowVideoForm(false);
    setVideoForm({ title: "", video_url: "" });
    loadVideos();
  };
  const deleteVideo = async (id) => {
    if (!confirm("Remover vídeo?")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
    loadVideos();
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
    };
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const todayAppointments = appointments.filter(
    (a) =>
      a.appointment_date === new Date().toISOString().split("T")[0] &&
      a.status !== "cancelled",
  );
  const upcomingAppointments = appointments.filter(
    (a) =>
      a.appointment_date > new Date().toISOString().split("T")[0] &&
      a.status !== "cancelled",
  );

  const TABS = [
    { key: "appointments", label: "Agendamentos" },
    { key: "blocks", label: "Bloqueios" },
    { key: "gallery", label: "Galeria" },
    { key: "services", label: "Serviços" },
    { key: "videos", label: "Vídeos" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600 mt-1">Gerencie seu salão</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <a
                href="/account/logout"
                className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Sair
              </a>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Ver site
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            ["Hoje", todayAppointments.length, "blue"],
            ["Próximos", upcomingAppointments.length, "green"],
            ["Total", appointments.length, "gray"],
          ].map(([label, val, c]) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className="text-3xl font-semibold text-gray-900">{val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-600 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── APPOINTMENTS ── */}
        {activeTab === "appointments" && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Filtrar por data
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Filtrar por status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-600">
                Carregando...
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-600">
                Nenhum agendamento
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {apt.client_name}
                          </h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {apt.service_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          R$ {parseFloat(apt.service_price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Data: </span>
                        <span className="font-medium">
                          {new Date(
                            apt.appointment_date + "T00:00:00",
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Horário: </span>
                        <span className="font-medium">
                          {apt.start_time} - {apt.end_time}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefone: </span>
                        <span className="font-medium">{apt.client_phone}</span>
                      </div>
                      {apt.client_email && (
                        <div>
                          <span className="text-gray-600">E-mail: </span>
                          <span className="font-medium">
                            {apt.client_email}
                          </span>
                        </div>
                      )}
                    </div>
                    {apt.custom_model_image && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Modelo Customizado:
                        </p>
                        <img
                          src={apt.custom_model_image}
                          alt="Modelo"
                          className="max-w-xs rounded-lg border border-gray-200"
                        />
                        {apt.custom_model_description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {apt.custom_model_description}
                          </p>
                        )}
                      </div>
                    )}
                    {apt.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Obs:</p>
                        <p className="text-sm text-gray-900">{apt.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {apt.status === "pending" && (
                        <button
                          onClick={() => updateStatus(apt.id, "confirmed")}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Confirmar
                        </button>
                      )}
                      {apt.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(apt.id, "completed")}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          Concluído
                        </button>
                      )}
                      {apt.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(apt.id, "cancelled")}
                          className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      )}
                      <a
                        href={`https://wa.me/55${apt.client_phone?.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BLOCKS ── */}
        {activeTab === "blocks" && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowBlockForm(!showBlockForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {showBlockForm ? "Cancelar" : "Novo Bloqueio"}
              </button>
            </div>
            {showBlockForm && (
              <form
                onSubmit={createTimeBlock}
                className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Criar bloqueio
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={blockForm.blockDate}
                      onChange={(e) =>
                        setBlockForm({
                          ...blockForm,
                          blockDate: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Motivo
                    </label>
                    <input
                      type="text"
                      value={blockForm.reason}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, reason: e.target.value })
                      }
                      placeholder="Opcional"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Hora inicial
                    </label>
                    <input
                      type="time"
                      required
                      value={blockForm.startTime}
                      onChange={(e) =>
                        setBlockForm({
                          ...blockForm,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Hora final
                    </label>
                    <input
                      type="time"
                      required
                      value={blockForm.endTime}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, endTime: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Criar
                </button>
              </form>
            )}
            {timeBlocks.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-600">
                Nenhum bloqueio
              </div>
            ) : (
              <div className="space-y-4">
                {timeBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        {new Date(
                          b.block_date + "T00:00:00",
                        ).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {b.start_time} - {b.end_time}
                      </p>
                      {b.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Motivo: {b.reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTimeBlock(b.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GALLERY ── */}
        {activeTab === "gallery" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Galeria de Fotos
              </h2>
              <button
                onClick={() => {
                  setShowGalleryForm(true);
                  setNewGalleryCaption("");
                  setNewGalleryImageUrl("");
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Adicionar Foto
              </button>
            </div>

            {showGalleryForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Nova Foto
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Imagem *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGalleryImageUpload(e, false)}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200 file:text-sm file:bg-white hover:file:bg-gray-50"
                  />
                  {uploading && (
                    <p className="text-sm text-gray-500 mt-2">Enviando...</p>
                  )}
                  {newGalleryImageUrl && (
                    <img
                      src={newGalleryImageUrl}
                      alt="Preview"
                      className="mt-3 max-w-xs rounded-lg border border-gray-200"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Legenda
                  </label>
                  <input
                    type="text"
                    value={newGalleryCaption}
                    onChange={(e) => setNewGalleryCaption(e.target.value)}
                    placeholder="Descreva a foto..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGalleryForm(false)}
                    className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addGalleryPhoto}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {editingGallery?.id === item.id ? (
                    <div className="p-4">
                      <div className="mb-3">
                        <img
                          src={editingGallery.image_url}
                          alt=""
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 mb-2"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleGalleryImageUpload(e, true)}
                          className="block w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-gray-200 file:text-xs file:bg-white hover:file:bg-gray-50"
                        />
                        {uploading && (
                          <p className="text-xs text-gray-500 mt-1">
                            Enviando...
                          </p>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editingGallery.caption || ""}
                        onChange={(e) =>
                          setEditingGallery((p) => ({
                            ...p,
                            caption: e.target.value,
                          }))
                        }
                        placeholder="Legenda"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingGallery(null)}
                          className="flex-1 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveGalleryEdit}
                          className="flex-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={item.image_url}
                        alt={item.caption}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4 flex items-center justify-between">
                        <p
                          className="text-sm text-gray-700 flex-1 mr-2"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.caption || "Sem legenda"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingGallery({ ...item })}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium border border-blue-200 px-2 py-1 rounded"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteGalleryPhoto(item.id)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium border border-red-200 px-2 py-1 rounded"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {gallery.length === 0 && !showGalleryForm && (
                <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-600">
                  Nenhuma foto na galeria
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SERVICES ── */}
        {activeTab === "services" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Serviços</h2>
              <button
                onClick={() => {
                  setShowServiceForm(true);
                  setEditingService(null);
                  setServiceForm({
                    name: "",
                    description: "",
                    price: "",
                    duration_minutes: "",
                    image_url: "",
                  });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Novo Serviço
              </button>
            </div>

            {showServiceForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Foto do Serviço
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleServiceImageUpload}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200 file:text-sm file:bg-white hover:file:bg-gray-50"
                    />
                    {uploading && (
                      <p className="text-sm text-gray-500 mt-2">Enviando...</p>
                    )}
                    {serviceForm.image_url && (
                      <img
                        src={serviceForm.image_url}
                        alt="Preview"
                        className="mt-3 max-w-xs rounded-lg border border-gray-200 h-32 object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Ex: Box Braids"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="150.00"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Duração (min) *
                    </label>
                    <input
                      type="number"
                      value={serviceForm.duration_minutes}
                      onChange={(e) =>
                        setServiceForm((p) => ({
                          ...p,
                          duration_minutes: e.target.value,
                        }))
                      }
                      placeholder="240"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) =>
                        setServiceForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descreva o serviço..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowServiceForm(false);
                      setEditingService(null);
                    }}
                    className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveService}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {editingService ? "Salvar" : "Criar Serviço"}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {s.name}
                        </h3>
                        <p className="text-sm text-gray-600">{s.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl font-bold text-gray-900">
                        R$ {parseFloat(s.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                        {Math.floor(s.duration_minutes / 60)}h
                        {s.duration_minutes % 60 > 0
                          ? ` ${s.duration_minutes % 60}min`
                          : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditService(s)}
                        className="flex-1 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="flex-1 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {services.length === 0 && !showServiceForm && (
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-600">
                  Nenhum serviço cadastrado
                </div>
              )}
            </div>
          </>
        )}

        {/* ── VIDEOS ── */}
        {activeTab === "videos" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Vídeos</h2>
              <button
                onClick={() => {
                  setShowVideoForm(true);
                  setVideoForm({ title: "", video_url: "" });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Adicionar Vídeo
              </button>
            </div>

            {showVideoForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Adicionar Vídeo
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Cole o link do vídeo (YouTube, Instagram, TikTok ou outro)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Título (opcional)
                    </label>
                    <input
                      type="text"
                      value={videoForm.title}
                      onChange={(e) =>
                        setVideoForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="Ex: Box Braids Incrível"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      URL do Vídeo *
                    </label>
                    <input
                      type="url"
                      value={videoForm.video_url}
                      onChange={(e) =>
                        setVideoForm((p) => ({
                          ...p,
                          video_url: e.target.value,
                        }))
                      }
                      placeholder="https://www.instagram.com/reel/..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {videoForm.video_url && (
                      <span
                        className="mt-1 inline-block text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            PLATFORM_COLORS[
                              detectPlatform(videoForm.video_url)
                            ] + "20",
                          color:
                            PLATFORM_COLORS[
                              detectPlatform(videoForm.video_url)
                            ],
                        }}
                      >
                        {PLATFORM_LABELS[detectPlatform(videoForm.video_url)]}{" "}
                        detectado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVideoForm(false)}
                    className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addVideo}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((v) => {
                const color = PLATFORM_COLORS[v.platform] || "#6B7280";
                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <span
                          className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-2"
                          style={{ backgroundColor: color + "18", color }}
                        >
                          {PLATFORM_LABELS[v.platform]}
                        </span>
                        {v.title && (
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {v.title}
                          </h3>
                        )}
                        <p className="text-xs text-gray-500 truncate mb-3">
                          {v.video_url}
                        </p>
                        <a
                          href={v.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Abrir vídeo
                        </a>
                      </div>
                      <button
                        onClick={() => deleteVideo(v.id)}
                        className="text-red-500 hover:text-red-700 border border-red-100 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
              {videos.length === 0 && !showVideoForm && (
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-600">
                  Nenhum vídeo adicionado
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
