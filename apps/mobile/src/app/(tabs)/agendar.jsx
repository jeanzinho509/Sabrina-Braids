import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Clock, Plus, Upload } from "lucide-react-native";
import useUpload from "@/utils/useUpload";
import * as ImagePicker from "expo-image-picker";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function AgendarPage() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelImage, setCustomModelImage] = useState("");
  const [customModelDescription, setCustomModelDescription] = useState("");
  const [uploadedImagePreview, setUploadedImagePreview] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
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

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => setServices(data.services || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if ((selectedService || isCustomModel) && selectedDate) {
      setLoading(true);
      const duration = isCustomModel
        ? 300
        : selectedService?.duration_minutes || 300;
      fetch(
        `/api/appointments/available-times?date=${selectedDate}&duration=${duration}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setAvailableTimes(data.availableSlots || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedService, isCustomModel, selectedDate]);

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setUploadedImagePreview(asset.uri);

      const { url, error: uploadError } = await upload({
        reactNativeAsset: asset,
      });

      if (uploadError) {
        setError("Erro ao fazer upload da imagem");
        return;
      }

      setCustomModelImage(url);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Pular sábados (6)
      if (date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split("T")[0],
          label: date.toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }),
        });
      }
    }

    return dates;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

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
        throw new Error(errorData.error || "Erro ao criar agendamento");
      }

      setSuccess(true);
      setStep(4);

      const serviceName = isCustomModel
        ? "Modelo Customizado"
        : selectedService.name;
      const whatsappMessage = encodeURIComponent(
        `Olá! Acabei de fazer um agendamento:\n\n` +
          `📅 Serviço: ${serviceName}\n` +
          `📆 Data: ${new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR")}\n` +
          `⏰ Horário: ${selectedTime}\n` +
          `👤 Nome: ${formData.clientName}\n\n` +
          `Aguardo a confirmação!`,
      );

      setTimeout(() => {
        Linking.openURL(`https://wa.me/5521993662669?text=${whatsappMessage}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      {[
        { num: 1, label: "Serviço" },
        { num: 2, label: "Data" },
        { num: 3, label: "Dados" },
        { num: 4, label: "Confirmação" },
      ].map((s, idx) => (
        <View
          key={s.num}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", flex: 1 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: step >= s.num ? "#2563EB" : "#E5E7EB",
                backgroundColor: step >= s.num ? "#2563EB" : "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: step >= s.num ? "#fff" : "#9CA3AF",
                }}
              >
                {s.num}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                marginTop: 4,
                color: step >= s.num ? "#111827" : "#9CA3AF",
              }}
            >
              {s.label}
            </Text>
          </View>
          {idx < 3 && (
            <View
              style={{
                height: 2,
                flex: 0.5,
                backgroundColor: step > s.num ? "#2563EB" : "#E5E7EB",
                marginTop: -20,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

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
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Agendamento
        </Text>
      </View>

      {renderProgressBar()}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {error && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderWidth: 1,
                borderColor: "#FCA5A5",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: "#991B1B" }}>{error}</Text>
            </View>
          )}

          {/* Step 1: Select Service */}
          {step === 1 && (
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Escolha o serviço
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 20,
                }}
              >
                Selecione o estilo de trança que você deseja
              </Text>

              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => handleServiceSelect(service)}
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 6,
                    }}
                  >
                    {service.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      marginBottom: 12,
                    }}
                  >
                    {service.description}
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
                        fontSize: 24,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      R$ {parseFloat(service.price).toFixed(2)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#DBEAFE",
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Clock size={14} color="#2563EB" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: "#2563EB",
                        }}
                      >
                        {Math.floor(service.duration_minutes / 60)}h
                        {service.duration_minutes % 60 > 0
                          ? ` ${service.duration_minutes % 60}min`
                          : ""}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handleCustomModelSelect}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 2,
                  borderColor: "#E5E7EB",
                  borderStyle: "dashed",
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 180,
                }}
              >
                <Plus size={48} color="#9CA3AF" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#111827",
                    marginTop: 12,
                    marginBottom: 4,
                  }}
                >
                  Outro Modelo
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  Envie uma foto do modelo que você deseja
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Date, Time and Custom Model */}
          {step === 2 && (
            <View>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 20,
                }}
              >
                <ChevronLeft size={20} color="#6B7280" />
                <Text style={{ fontSize: 14, color: "#6B7280" }}>Voltar</Text>
              </TouchableOpacity>

              {isCustomModel && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 16,
                    }}
                  >
                    Envie o Modelo Desejado
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    Foto do Modelo *
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 16,
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#2563EB" />
                    ) : uploadedImagePreview ? (
                      <Image
                        source={{ uri: uploadedImagePreview }}
                        style={{
                          width: "100%",
                          height: 200,
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <>
                        <Upload size={32} color="#9CA3AF" />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginTop: 8,
                          }}
                        >
                          Tocar para selecionar imagem
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    Descrição do Modelo *
                  </Text>
                  <TextInput
                    value={customModelDescription}
                    onChangeText={setCustomModelDescription}
                    placeholder="Descreva o modelo que você deseja fazer..."
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 14,
                      color: "#111827",
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              )}

              {selectedService && !isCustomModel && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {selectedService?.name}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}
                  >
                    R$ {parseFloat(selectedService?.price || 0).toFixed(2)} •{" "}
                    {Math.floor((selectedService?.duration_minutes || 0) / 60)}h
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Escolha a data e horário
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 20,
                }}
              >
                Selecione quando você quer fazer suas tranças
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Data
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 20, flexGrow: 0 }}
              >
                {getAvailableDates().map((date) => (
                  <TouchableOpacity
                    key={date.value}
                    onPress={() => {
                      setSelectedDate(date.value);
                      setSelectedTime("");
                    }}
                    style={{
                      backgroundColor:
                        selectedDate === date.value ? "#2563EB" : "#fff",
                      borderWidth: 1,
                      borderColor:
                        selectedDate === date.value ? "#2563EB" : "#E5E7EB",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: selectedDate === date.value ? "#fff" : "#111827",
                      }}
                    >
                      {date.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedDate && (
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    Horário disponível
                  </Text>
                  {loading ? (
                    <ActivityIndicator color="#2563EB" />
                  ) : availableTimes.length === 0 ? (
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>
                      Nenhum horário disponível nesta data
                    </Text>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {availableTimes.map((slot) => (
                        <TouchableOpacity
                          key={slot.start}
                          onPress={() => {
                            setSelectedTime(slot.start);
                            setStep(3);
                          }}
                          style={{
                            backgroundColor: "#fff",
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "500",
                              color: "#111827",
                            }}
                          >
                            {slot.display}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Step 3: Client Info */}
          {step === 3 && (
            <KeyboardAvoidingAnimatedView
              style={{ flex: 1 }}
              behavior="padding"
            >
              <View>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 20,
                  }}
                >
                  <ChevronLeft size={20} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>Voltar</Text>
                </TouchableOpacity>

                <View
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {isCustomModel
                      ? "Modelo Customizado"
                      : selectedService?.name}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}
                  >
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}{" "}
                    às {selectedTime}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Seus dados
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    marginBottom: 20,
                  }}
                >
                  Preencha suas informações para confirmar o agendamento
                </Text>

                <View style={{ gap: 16 }}>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      Nome completo *
                    </Text>
                    <TextInput
                      value={formData.clientName}
                      onChangeText={(text) =>
                        setFormData({ ...formData, clientName: text })
                      }
                      placeholder="Seu nome completo"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      WhatsApp *
                    </Text>
                    <TextInput
                      value={formData.clientPhone}
                      onChangeText={(text) =>
                        setFormData({ ...formData, clientPhone: text })
                      }
                      placeholder="(11) 99999-9999"
                      keyboardType="phone-pad"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      E-mail (opcional)
                    </Text>
                    <TextInput
                      value={formData.clientEmail}
                      onChangeText={(text) =>
                        setFormData({ ...formData, clientEmail: text })
                      }
                      placeholder="seu@email.com"
                      keyboardType="email-address"
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      Observações (opcional)
                    </Text>
                    <TextInput
                      value={formData.notes}
                      onChangeText={(text) =>
                        setFormData({ ...formData, notes: text })
                      }
                      placeholder="Alguma preferência ou informação importante?"
                      multiline
                      numberOfLines={4}
                      style={{
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                        textAlignVertical: "top",
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? "#9CA3AF" : "#2563EB",
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Confirmar Agendamento
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingAnimatedView>
          )}

          {/* Step 4: Success */}
          {step === 4 && success && (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: "#D1FAE5",
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 32 }}>✓</Text>
              </View>

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Agendamento realizado!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                Seu agendamento foi enviado com sucesso. Você receberá a
                confirmação em breve.
              </Text>

              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 16,
                  padding: 20,
                  width: "100%",
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    Serviço:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {isCustomModel
                      ? "Modelo Customizado"
                      : selectedService?.name}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>Data:</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    Horário:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {selectedTime}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setStep(1);
                  setSelectedService(null);
                  setIsCustomModel(false);
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
                style={{
                  backgroundColor: "#2563EB",
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Fazer outro agendamento
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
