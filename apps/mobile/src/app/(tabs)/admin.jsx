import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/utils/auth/useAuth";
import useUser from "@/utils/auth/useUser";
import useUpload from "@/utils/useUpload";
import * as ImagePicker from "expo-image-picker";
import {
  Calendar,
  Clock,
  XCircle,
  Phone,
  Mail,
  LogOut,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Video,
  CheckCircle,
  ExternalLink,
} from "lucide-react-native";

const ALLOWED_ADMINS = ["jean.dev.com@gmail.com", "estimesabrina15@gmail.com"];

// ─── Helper: detect video platform ─────────────────────────────────────────
function detectPlatform(url) {
  if (!url) return "other";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "other";
}

function platformLabel(p) {
  return (
    {
      youtube: "YouTube",
      instagram: "Instagram",
      tiktok: "TikTok",
      other: "Outro",
    }[p] || "Outro"
  );
}

function platformColor(p) {
  return (
    {
      youtube: "#EF4444",
      instagram: "#E1306C",
      tiktok: "#111827",
      other: "#6B7280",
    }[p] || "#6B7280"
  );
}

// ─── Small reusable components ───────────────────────────────────────────────
function SectionHeader({ title, onAdd }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
        {title}
      </Text>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={16} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            Adicionar
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function TabBar({ tabs, active, onPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        flexGrow: 0,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", paddingHorizontal: 16 }}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => onPress(t.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderBottomWidth: 2,
              borderColor: active === t.key ? "#2563EB" : "transparent",
              marginRight: 4,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: active === t.key ? "#2563EB" : "#6B7280",
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const insets = useSafeAreaInsets();
  const { signOut, isReady, auth, signIn } = useAuth();
  const { data: user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("appointments");
  const [refreshing, setRefreshing] = useState(false);

  // ── Appointments state ──
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [stats, setStats] = useState({ today: 0, upcoming: 0, total: 0 });

  // ── Gallery state ──
  const [gallery, setGallery] = useState([]);
  const [editingGallery, setEditingGallery] = useState(null); // { id, image_url, caption }
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [newGalleryCaption, setNewGalleryCaption] = useState("");
  const [newGalleryImage, setNewGalleryImage] = useState("");
  const [newGalleryPreview, setNewGalleryPreview] = useState("");

  // ── Services state ──
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
  const [servicePreview, setServicePreview] = useState("");

  // ── Videos state ──
  const [videos, setVideos] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: "", video_url: "" });

  const [upload, { loading: uploading }] = useUpload();

  const isAdmin =
    user && ALLOWED_ADMINS.includes(user.email?.toLowerCase().trim());

  // ── Fetch helpers ──
  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
        const today = new Date().toISOString().split("T")[0];
        setStats({
          today: data.appointments.filter(
            (a) => a.appointment_date === today && a.status !== "cancelled",
          ).length,
          upcoming: data.appointments.filter(
            (a) => a.appointment_date >= today && a.status !== "cancelled",
          ).length,
          total: data.appointments.length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAppts(false);
    }
  }, []);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery?active=false");
      const data = await res.json();
      if (data.success) setGallery(data.gallery);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.success) setVideos(data.videos);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isReady && auth && isAdmin) {
      fetchAppointments();
      fetchGallery();
      fetchServices();
      fetchVideos();
    }
  }, [isReady, auth, isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAppointments(),
      fetchGallery(),
      fetchServices(),
      fetchVideos(),
    ]);
    setRefreshing(false);
  };

  // ── Image picker helper ──
  const pickImage = async (onUrl, onPreview) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (onPreview) onPreview(asset.uri);
      const { url, error } = await upload({ reactNativeAsset: asset });
      if (error) {
        Alert.alert("Erro", "Falha ao enviar imagem");
        return;
      }
      onUrl(url);
    }
  };

  // ── Appointment actions ──
  const updateAppointmentStatus = async (id, status) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const openWhatsApp = (phone, name) => {
    const msg = encodeURIComponent(`Olá ${name}! Aqui é da Sabrina Tranças.`);
    Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${msg}`);
  };

  // ── Gallery actions ──
  const saveGalleryEdit = async () => {
    if (!editingGallery) return;
    try {
      await fetch(`/api/gallery/${editingGallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: editingGallery.image_url,
          caption: editingGallery.caption,
        }),
      });
      setEditingGallery(null);
      fetchGallery();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteGalleryPhoto = async (id) => {
    Alert.alert("Remover foto", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          await fetch(`/api/gallery/${id}`, { method: "DELETE" });
          fetchGallery();
        },
      },
    ]);
  };

  const addGalleryPhoto = async () => {
    if (!newGalleryImage) {
      Alert.alert("Erro", "Selecione uma imagem");
      return;
    }
    try {
      await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: newGalleryImage,
          caption: newGalleryCaption,
          display_order: gallery.length,
        }),
      });
      setShowGalleryForm(false);
      setNewGalleryCaption("");
      setNewGalleryImage("");
      setNewGalleryPreview("");
      fetchGallery();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Service actions ──
  const saveService = async () => {
    const method = editingService ? "PATCH" : "POST";
    const url = editingService
      ? `/api/services/${editingService.id}`
      : "/api/services";
    try {
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
      setServicePreview("");
      fetchServices();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteService = async (id) => {
    Alert.alert("Remover serviço", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          await fetch(`/api/services/${id}`, { method: "DELETE" });
          fetchServices();
        },
      },
    ]);
  };

  const openEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      image_url: service.image_url || "",
    });
    setServicePreview(service.image_url || "");
    setShowServiceForm(true);
  };

  // ── Video actions ──
  const addVideo = async () => {
    if (!videoForm.video_url) {
      Alert.alert("Erro", "URL do vídeo é obrigatória");
      return;
    }
    const platform = detectPlatform(videoForm.video_url);
    try {
      await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...videoForm, platform }),
      });
      setShowVideoForm(false);
      setVideoForm({ title: "", video_url: "" });
      fetchVideos();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteVideo = async (id) => {
    Alert.alert("Remover vídeo", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          await fetch(`/api/videos/${id}`, { method: "DELETE" });
          fetchVideos();
        },
      },
    ]);
  };

  // ── Auth guards ──
  if (!isReady || userLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!auth) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar style="dark" />
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#111827" }}>
            Admin
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Acesso restrito
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Faça login para acessar o painel administrativo
          </Text>
          <TouchableOpacity
            onPress={() => signIn()}
            style={{
              backgroundColor: "#2563EB",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Fazer Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar style="dark" />
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#111827" }}>
            Admin
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <XCircle size={64} color="#EF4444" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#111827",
              marginTop: 16,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Usuário sem acesso
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Procure o admin.
          </Text>
          <TouchableOpacity
            onPress={() => signOut()}
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: "#111827", fontSize: 16, fontWeight: "600" }}>
              Sair
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ──
  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
            Painel Admin
          </Text>
          <TouchableOpacity onPress={() => signOut()}>
            <LogOut size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
          {user?.email}
        </Text>
      </View>

      {/* Tab bar */}
      <TabBar
        tabs={[
          { key: "appointments", label: "📋 Agendamentos" },
          { key: "gallery", label: "🖼️ Galeria" },
          { key: "services", label: "✂️ Serviços" },
          { key: "videos", label: "🎬 Vídeos" },
        ]}
        active={activeTab}
        onPress={setActiveTab}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── APPOINTMENTS TAB ── */}
        {activeTab === "appointments" && (
          <View>
            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {[
                ["Hoje", stats.today, "#DBEAFE", "#2563EB"],
                ["Próximos", stats.upcoming, "#D1FAE5", "#059669"],
                ["Total", stats.total, "#F3F4F6", "#374151"],
              ].map(([label, val, bg, color]) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    backgroundColor: bg,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </Text>
                  <Text style={{ fontSize: 26, fontWeight: "700", color }}>
                    {val}
                  </Text>
                </View>
              ))}
            </View>

            {loadingAppts ? (
              <ActivityIndicator color="#2563EB" />
            ) : appointments.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 24,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text style={{ color: "#6B7280" }}>
                  Nenhum agendamento encontrado
                </Text>
              </View>
            ) : (
              appointments.map((appt) => {
                const statusColors = {
                  pending: ["#FEF3C7", "#92400E"],
                  confirmed: ["#D1FAE5", "#065F46"],
                  completed: ["#DBEAFE", "#1E40AF"],
                  cancelled: ["#FEE2E2", "#991B1B"],
                };
                const statusLabels = {
                  pending: "Pendente",
                  confirmed: "Confirmado",
                  completed: "Concluído",
                  cancelled: "Cancelado",
                };
                const [bgC, textC] = statusColors[appt.status] || [
                  "#F3F4F6",
                  "#374151",
                ];
                return (
                  <View
                    key={appt.id}
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#111827",
                          flex: 1,
                        }}
                      >
                        {appt.client_name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: bgC,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: textC,
                          }}
                        >
                          {statusLabels[appt.status]}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: 6, marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Calendar size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: "#6B7280" }}>
                          {new Date(
                            appt.appointment_date + "T00:00:00",
                          ).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Clock size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: "#6B7280" }}>
                          {appt.start_time?.slice(0, 5)} –{" "}
                          {appt.end_time?.slice(0, 5)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Phone size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: "#6B7280" }}>
                          {appt.client_phone}
                        </Text>
                      </View>
                      {appt.client_email && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Mail size={14} color="#6B7280" />
                          <Text style={{ fontSize: 13, color: "#6B7280" }}>
                            {appt.client_email}
                          </Text>
                        </View>
                      )}
                    </View>
                    {appt.notes && (
                      <View
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
                          {appt.notes}
                        </Text>
                      </View>
                    )}
                    {appt.custom_model_image && (
                      <View style={{ marginBottom: 10 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: 6,
                          }}
                        >
                          Modelo Customizado:
                        </Text>
                        <Image
                          source={{ uri: appt.custom_model_image }}
                          style={{
                            width: "100%",
                            height: 140,
                            borderRadius: 10,
                          }}
                          resizeMode="cover"
                        />
                        {appt.custom_model_description && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6B7280",
                              marginTop: 6,
                            }}
                          >
                            {appt.custom_model_description}
                          </Text>
                        )}
                      </View>
                    )}
                    <View
                      style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          openWhatsApp(appt.client_phone, appt.client_name)
                        }
                        style={{
                          flex: 1,
                          backgroundColor: "#10B981",
                          borderRadius: 8,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          WhatsApp
                        </Text>
                      </TouchableOpacity>
                      {appt.status === "pending" && (
                        <TouchableOpacity
                          onPress={() =>
                            updateAppointmentStatus(appt.id, "confirmed")
                          }
                          style={{
                            flex: 1,
                            backgroundColor: "#2563EB",
                            borderRadius: 8,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            Confirmar
                          </Text>
                        </TouchableOpacity>
                      )}
                      {appt.status === "confirmed" && (
                        <TouchableOpacity
                          onPress={() =>
                            updateAppointmentStatus(appt.id, "completed")
                          }
                          style={{
                            flex: 1,
                            backgroundColor: "#059669",
                            borderRadius: 8,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            Concluir
                          </Text>
                        </TouchableOpacity>
                      )}
                      {appt.status !== "cancelled" &&
                        appt.status !== "completed" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateAppointmentStatus(appt.id, "cancelled")
                            }
                            style={{
                              flex: 1,
                              borderWidth: 1,
                              borderColor: "#FECACA",
                              borderRadius: 8,
                              paddingVertical: 10,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#EF4444",
                                fontSize: 13,
                                fontWeight: "600",
                              }}
                            >
                              Cancelar
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── GALLERY TAB ── */}
        {activeTab === "gallery" && (
          <View>
            <SectionHeader
              title="Galeria de Fotos"
              onAdd={() => {
                setShowGalleryForm(true);
                setNewGalleryCaption("");
                setNewGalleryImage("");
                setNewGalleryPreview("");
              }}
            />

            {/* Add photo form */}
            {showGalleryForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 12,
                  }}
                >
                  Nova Foto
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    pickImage(setNewGalleryImage, setNewGalleryPreview)
                  }
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 12,
                    height: 160,
                    justifyContent: "center",
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color="#2563EB" />
                  ) : newGalleryPreview ? (
                    <Image
                      source={{ uri: newGalleryPreview }}
                      style={{ width: "100%", height: 130, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <ImageIcon size={28} color="#9CA3AF" />
                      <Text
                        style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}
                      >
                        Toque para selecionar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TextInput
                  value={newGalleryCaption}
                  onChangeText={setNewGalleryCaption}
                  placeholder="Legenda (opcional)"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#111827",
                    marginBottom: 12,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowGalleryForm(false)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addGalleryPhoto}
                    style={{
                      flex: 2,
                      backgroundColor: "#2563EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Adicionar Foto
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Gallery list */}
            {gallery.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                {editingGallery?.id === item.id ? (
                  <View style={{ padding: 14 }}>
                    <TouchableOpacity
                      onPress={() =>
                        pickImage(
                          (url) =>
                            setEditingGallery((p) => ({
                              ...p,
                              image_url: url,
                            })),
                          (preview) =>
                            setEditingGallery((p) => ({
                              ...p,
                              _preview: preview,
                            })),
                        )
                      }
                      style={{
                        height: 160,
                        backgroundColor: "#F9FAFB",
                        borderRadius: 10,
                        overflow: "hidden",
                        marginBottom: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#2563EB" />
                      ) : (
                        <Image
                          source={{
                            uri:
                              editingGallery._preview ||
                              editingGallery.image_url,
                          }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      )}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          borderRadius: 8,
                          padding: 6,
                        }}
                      >
                        <Edit2 size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>
                    <TextInput
                      value={editingGallery.caption || ""}
                      onChangeText={(t) =>
                        setEditingGallery((p) => ({ ...p, caption: t }))
                      }
                      placeholder="Legenda"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 10,
                        padding: 10,
                        fontSize: 14,
                        color: "#111827",
                        marginBottom: 10,
                      }}
                    />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setEditingGallery(null)}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          borderRadius: 10,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveGalleryEdit}
                        style={{
                          flex: 2,
                          backgroundColor: "#2563EB",
                          borderRadius: 10,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                          Salvar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: "100%", height: 180 }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{ fontSize: 14, color: "#374151", flex: 1 }}
                        numberOfLines={1}
                      >
                        {item.caption || "Sem legenda"}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => setEditingGallery({ ...item })}
                          style={{
                            backgroundColor: "#EFF6FF",
                            borderRadius: 8,
                            padding: 8,
                          }}
                        >
                          <Edit2 size={16} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteGalleryPhoto(item.id)}
                          style={{
                            backgroundColor: "#FEE2E2",
                            borderRadius: 8,
                            padding: 8,
                          }}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))}
            {gallery.length === 0 && !showGalleryForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#6B7280" }}>
                  Nenhuma foto na galeria
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === "services" && (
          <View>
            <SectionHeader
              title="Serviços"
              onAdd={() => {
                setShowServiceForm(true);
                setEditingService(null);
                setServiceForm({
                  name: "",
                  description: "",
                  price: "",
                  duration_minutes: "",
                  image_url: "",
                });
                setServicePreview("");
              }}
            />

            {/* Service form */}
            {showServiceForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 14,
                  }}
                >
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </Text>

                {/* Image picker */}
                <TouchableOpacity
                  onPress={() =>
                    pickImage(
                      (url) =>
                        setServiceForm((p) => ({ ...p, image_url: url })),
                      setServicePreview,
                    )
                  }
                  style={{
                    height: 160,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color="#2563EB" />
                  ) : servicePreview || serviceForm.image_url ? (
                    <Image
                      source={{ uri: servicePreview || serviceForm.image_url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <ImageIcon size={28} color="#9CA3AF" />
                      <Text
                        style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}
                      >
                        Foto do serviço
                      </Text>
                    </>
                  )}
                  {(servicePreview || serviceForm.image_url) && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        borderRadius: 8,
                        padding: 6,
                      }}
                    >
                      <Edit2 size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                {[
                  ["Nome *", "name", "Ex: Box Braids", false],
                  ["Descrição", "description", "Descreva o serviço...", true],
                  ["Preço (R$) *", "price", "Ex: 150.00", false],
                  ["Duração (minutos) *", "duration_minutes", "Ex: 240", false],
                ].map(([label, field, placeholder, multi]) => (
                  <View key={field} style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </Text>
                    <TextInput
                      value={serviceForm[field]}
                      onChangeText={(t) =>
                        setServiceForm((p) => ({ ...p, [field]: t }))
                      }
                      placeholder={placeholder}
                      multiline={multi}
                      numberOfLines={multi ? 3 : 1}
                      keyboardType={
                        field === "price" || field === "duration_minutes"
                          ? "numeric"
                          : "default"
                      }
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                        textAlignVertical: multi ? "top" : "center",
                      }}
                    />
                  </View>
                ))}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowServiceForm(false);
                      setEditingService(null);
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveService}
                    style={{
                      flex: 2,
                      backgroundColor: "#2563EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {editingService ? "Salvar Alterações" : "Criar Serviço"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Services list */}
            {services.map((service) => (
              <View
                key={service.id}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                {service.image_url && (
                  <Image
                    source={{ uri: service.image_url }}
                    style={{ width: "100%", height: 150 }}
                    resizeMode="cover"
                  />
                )}
                <View style={{ padding: 14 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {service.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          marginBottom: 6,
                        }}
                        numberOfLines={2}
                      >
                        {service.description}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          R$ {parseFloat(service.price).toFixed(2)}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={13} color="#6B7280" />
                          <Text style={{ fontSize: 13, color: "#6B7280" }}>
                            {Math.floor(service.duration_minutes / 60)}h
                            {service.duration_minutes % 60 > 0
                              ? ` ${service.duration_minutes % 60}min`
                              : ""}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={{ flexDirection: "row", gap: 8, marginLeft: 10 }}
                    >
                      <TouchableOpacity
                        onPress={() => openEditService(service)}
                        style={{
                          backgroundColor: "#EFF6FF",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <Edit2 size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteService(service.id)}
                        style={{
                          backgroundColor: "#FEE2E2",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {services.length === 0 && !showServiceForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#6B7280" }}>
                  Nenhum serviço cadastrado
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── VIDEOS TAB ── */}
        {activeTab === "videos" && (
          <View>
            <SectionHeader
              title="Vídeos"
              onAdd={() => {
                setShowVideoForm(true);
                setVideoForm({ title: "", video_url: "" });
              }}
            />

            {/* Add video form */}
            {showVideoForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 12,
                  }}
                >
                  Adicionar Vídeo
                </Text>
                <Text
                  style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}
                >
                  Cole o link do vídeo (YouTube, Instagram, TikTok ou outro)
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Título (opcional)
                </Text>
                <TextInput
                  value={videoForm.title}
                  onChangeText={(t) =>
                    setVideoForm((p) => ({ ...p, title: t }))
                  }
                  placeholder="Ex: Box Braids Incrível"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#111827",
                    marginBottom: 12,
                  }}
                />

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  URL do Vídeo *
                </Text>
                <TextInput
                  value={videoForm.video_url}
                  onChangeText={(t) =>
                    setVideoForm((p) => ({ ...p, video_url: t }))
                  }
                  placeholder="https://www.instagram.com/reel/..."
                  autoCapitalize="none"
                  keyboardType="url"
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#111827",
                    marginBottom: 6,
                  }}
                />

                {videoForm.video_url ? (
                  <View
                    style={{
                      backgroundColor:
                        platformColor(detectPlatform(videoForm.video_url)) +
                        "15",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      alignSelf: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: platformColor(
                          detectPlatform(videoForm.video_url),
                        ),
                      }}
                    >
                      {platformLabel(detectPlatform(videoForm.video_url))}{" "}
                      detectado
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 12 }} />
                )}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowVideoForm(false)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addVideo}
                    style={{
                      flex: 2,
                      backgroundColor: "#2563EB",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Adicionar Vídeo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Videos list */}
            {videos.map((video) => {
              const color = platformColor(video.platform);
              return (
                <View
                  key={video.id}
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: color + "18",
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{ fontSize: 12, fontWeight: "700", color }}
                          >
                            {platformLabel(video.platform)}
                          </Text>
                        </View>
                      </View>
                      {video.title && (
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: 4,
                          }}
                        >
                          {video.title}
                        </Text>
                      )}
                      <Text
                        style={{ fontSize: 12, color: "#6B7280" }}
                        numberOfLines={1}
                      >
                        {video.video_url}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", gap: 8, marginLeft: 10 }}
                    >
                      <TouchableOpacity
                        onPress={() => Linking.openURL(video.video_url)}
                        style={{
                          backgroundColor: "#EFF6FF",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <ExternalLink size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteVideo(video.id)}
                        style={{
                          backgroundColor: "#FEE2E2",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
            {videos.length === 0 && !showVideoForm && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <Video size={36} color="#D1D5DB" />
                <Text style={{ color: "#6B7280", marginTop: 10 }}>
                  Nenhum vídeo adicionado
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
