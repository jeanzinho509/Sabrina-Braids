import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  StatusBar as RNStatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Clock,
  ExternalLink,
  X,
  ChevronRight,
  Play,
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, galleryRes, videosRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/gallery"),
          fetch("/api/videos"),
        ]);
        const servicesData = await servicesRes.json();
        const galleryData = await galleryRes.json();
        const videosData = await videosRes.json();
        if (servicesData.services) setServices(servicesData.services);
        if (galleryData.success) setGallery(galleryData.gallery);
        if (videosData.success) setVideos(videosData.videos);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const openServiceDetail = (service) => {
    setSelectedService(service);
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeServiceDetail = () => {
    Animated.timing(modalAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedService(null);
    });
  };

  const openWhatsApp = () => {
    Linking.openURL(
      "https://wa.me/5521993662669?text=Olá! Gostaria de saber mais sobre os serviços",
    );
  };

  const openInstagram = () => {
    Linking.openURL("https://instagram.com/sabrin_braids");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />

      {/* Service Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeServiceDetail}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Pressable style={{ flex: 1 }} onPress={closeServiceDetail} />
          <Animated.View
            style={{
              transform: [{ translateY: modalAnim }],
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: "hidden",
              maxHeight: SCREEN_HEIGHT * 0.88,
            }}
          >
            {/* Full-size image */}
            <View
              style={{ width: "100%", height: 340, backgroundColor: "#F3F4F6" }}
            >
              {selectedService && (
                <Image
                  source={{ uri: selectedService.image_url }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={200}
                />
              )}
              {/* Close button */}
              <TouchableOpacity
                onPress={closeServiceDetail}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={{
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
              showsVerticalScrollIndicator={false}
            >
              {selectedService && (
                <>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "700",
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    {selectedService.name}
                  </Text>

                  <Text
                    style={{
                      fontSize: 15,
                      color: "#6B7280",
                      lineHeight: 22,
                      marginBottom: 20,
                    }}
                  >
                    {selectedService.description}
                  </Text>

                  {/* Price + Duration row */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F9FAFB",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 14,
                        padding: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          marginBottom: 4,
                        }}
                      >
                        Preço
                      </Text>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        R$ {parseFloat(selectedService.price).toFixed(2)}
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#EFF6FF",
                        borderWidth: 1,
                        borderColor: "#BFDBFE",
                        borderRadius: 14,
                        padding: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#3B82F6",
                          marginBottom: 4,
                        }}
                      >
                        Duração
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Clock size={16} color="#2563EB" />
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#2563EB",
                          }}
                        >
                          {Math.floor(selectedService.duration_minutes / 60)}h
                          {selectedService.duration_minutes % 60 > 0
                            ? ` ${selectedService.duration_minutes % 60}min`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      closeServiceDetail();
                      setTimeout(
                        () =>
                          router.push(
                            `/(tabs)/agendar?service=${selectedService.id}`,
                          ),
                        320,
                      );
                    }}
                    style={{
                      backgroundColor: "#111827",
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}
                    >
                      Agendar este serviço
                    </Text>
                    <ChevronRight size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#111827" }}>
            Sabrina Tranças
          </Text>
        </View>

        {/* Hero */}
        <View
          style={{
            backgroundColor: "#F5F1E8",
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
              }}
            />
            <Text style={{ fontSize: 12, fontWeight: "500", color: "#374151" }}>
              Aceito novos agendamentos
            </Text>
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: "600",
              color: "#111827",
              lineHeight: 40,
              marginBottom: 12,
            }}
          >
            Transforme seu visual com tranças exclusivas
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            Especialista em box braids, knotless, passion twists e muito mais.
            Mais de 5 anos de experiência.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/agendar")}
            style={{
              backgroundColor: "#111827",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Agendar Horário
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openWhatsApp}
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#111827", fontSize: 16, fontWeight: "600" }}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gallery Carousel */}
        {gallery.length > 0 && (
          <View style={{ paddingVertical: 32 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                Nossos Trabalhos
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                Veja alguns dos nossos melhores trabalhos
              </Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false },
              )}
              scrollEventThrottle={16}
            >
              {gallery.map((item) => (
                <View
                  key={item.id}
                  style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}
                >
                  <View
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      backgroundColor: "#F3F4F6",
                    }}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: "100%", height: 340 }}
                      contentFit="cover"
                      transition={300}
                    />
                    {item.caption && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          padding: 16,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            textAlign: "center",
                            fontWeight: "500",
                          }}
                        >
                          {item.caption}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Dot indicators */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              {gallery.map((_, index) => {
                const inputRange = [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ];
                const width = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 28, 8],
                  extrapolate: "clamp",
                });
                const backgroundColor = scrollX.interpolate({
                  inputRange,
                  outputRange: ["#D1D5DB", "#111827", "#D1D5DB"],
                  extrapolate: "clamp",
                });
                return (
                  <Animated.View
                    key={index}
                    style={{
                      height: 8,
                      width,
                      backgroundColor,
                      borderRadius: 4,
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 28,
              backgroundColor: "#F9FAFB",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              Vídeos
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
              Assista aos nossos trabalhos em vídeo
            </Text>
            {videos.map((video) => {
              const color = PLATFORM_COLORS[video.platform] || "#6B7280";
              const label = PLATFORM_LABELS[video.platform] || "Vídeo";
              return (
                <TouchableOpacity
                  key={video.id}
                  onPress={() => Linking.openURL(video.video_url)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    marginBottom: 12,
                    overflow: "hidden",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      backgroundColor: color + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={18} color="#fff" fill="#fff" />
                    </View>
                  </View>
                  <View style={{ flex: 1, padding: 14 }}>
                    <View
                      style={{
                        backgroundColor: color + "18",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        alignSelf: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color }}>
                        {label}
                      </Text>
                    </View>
                    {video.title && (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: 2,
                        }}
                        numberOfLines={1}
                      >
                        {video.title}
                      </Text>
                    )}
                    <Text
                      style={{ fontSize: 11, color: "#9CA3AF" }}
                      numberOfLines={1}
                    >
                      {video.video_url}
                    </Text>
                  </View>
                  <ExternalLink
                    size={16}
                    color="#9CA3AF"
                    style={{ marginRight: 14 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Services Grid */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Serviços
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
            Toque para ver detalhes
          </Text>

          {/* 2-column grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {services.map((service) => {
              const cardWidth = (SCREEN_WIDTH - 40 - 12) / 2;
              return (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => openServiceDetail(service)}
                  activeOpacity={0.92}
                  style={{
                    width: cardWidth,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 18,
                    overflow: "hidden",
                  }}
                >
                  {/* Square image */}
                  <View
                    style={{
                      width: "100%",
                      height: cardWidth,
                      backgroundColor: "#F3F4F6",
                    }}
                  >
                    <Image
                      source={{ uri: service.image_url }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>

                  {/* Info */}
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                    >
                      {service.name}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        R$ {parseFloat(service.price).toFixed(0)}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Clock size={11} color="#6B7280" />
                        <Text style={{ fontSize: 11, color: "#6B7280" }}>
                          {Math.floor(service.duration_minutes / 60)}h
                          {service.duration_minutes % 60 > 0
                            ? `${service.duration_minutes % 60}m`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* About */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Sobre Sabrina Tranças
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Com mais de 5 anos de experiência, sou especialista em diversos
            estilos de tranças afro. Meu objetivo é valorizar a beleza natural
            de cada cliente.
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            Cada trança é feita com cuidado e atenção aos detalhes, garantindo
            não apenas um visual incrível, mas também a saúde dos seus cabelos.
          </Text>
        </View>

        {/* Contact Footer */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 32,
            borderTopWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Contato
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
            Rua Gâmbia, 17 - CEP 22775-400
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
            WhatsApp: (21) 99366-2669
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
            WhatsApp: (21) 97373-5791
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
            estimesabrina15@gmail.com
          </Text>

          <TouchableOpacity
            onPress={openInstagram}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
            }}
          >
            <ExternalLink size={16} color="#2563EB" />
            <Text style={{ fontSize: 14, color: "#2563EB" }}>
              @sabrin_braids
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Horário de Funcionamento
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 2 }}>
              Domingo a Quinta: 07h às 19h
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 2 }}>
              Sexta-feira: 08h às 17h
            </Text>
            <Text style={{ fontSize: 14, color: "#EF4444", fontWeight: "600" }}>
              Sábado: Fechado
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
