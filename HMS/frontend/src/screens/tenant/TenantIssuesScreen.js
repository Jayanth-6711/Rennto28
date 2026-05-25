import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useState, useEffect, useCallback } from "react";
import BASE_URL from "@/src/config/Api";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../../utils/LanguageContext";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Replace this with: import COLORS from './colors';
const COLORS = {
  PRIMARY: "#5F259F",
  PRIMARY_LIGHT: "#7A3FC4",
  PRIMARY_DARK: "#4A1D7A",
  WHITE: "#FFFFFF",
  BACKGROUND: "#F5F5F5",
  CARD: "#EEEEEE",
  TEXT_PRIMARY: "#212121",
  TEXT_SECONDARY: "#757575",
  TEXT_LIGHT: "#9E9E9E",
  SUCCESS: "#16A34A",
  ERROR: "#DC2626",
  WARNING: "#F59E0B",
  INFO: "#2563EB",
  BORDER: "#E0E0E0",
  DIVIDER: "#D6D6D6",
  GOLD: "#D4AF37",
  BLUE_LIGHT: "#E3F2FD",
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function IssuesScreen() {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [issues, setIssues] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [tenantId, setTenantId] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");

  useEffect(() => {
    const getTenantData = async () => {
      try {
        const storedId = await AsyncStorage.getItem("tenantId");
        const storedPhone = await AsyncStorage.getItem("tenantPhone");
        const storedEmail = await AsyncStorage.getItem("tenantEmail");

        console.log("STORED TENANT ID:", storedId);
        console.log("STORED TENANT PHONE:", storedPhone);
        console.log("STORED TENANT EMAIL:", storedEmail);

        if (storedId) {
          setTenantId(storedId);
        }
        if (storedPhone) {
          setTenantPhone(storedPhone);
        }
        if (storedEmail) {
          setTenantEmail(storedEmail);
        }
      } catch (error) {
        console.log("ASYNC STORAGE ERROR:", error);
      }
    };

    getTenantData();
  }, []);


  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/update-issue/${editingId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title,
            description: description,
            severity: priority,
          }),
        }
      );

      const result = await response.json();
      console.log("UPDATE RESULT:", result);

      if (response.ok) {
        Alert.alert("Success", "Issue updated");
        fetchIssues();
      } else {
        Alert.alert("Error", JSON.stringify(result));
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err.message);
    }
  };
  // Fetch issues using tenant ID
  const fetchIssues = async () => {
    if (!tenantId) {
      console.log('Tenant ID not available yet; skipping fetch.');
      return;
    }

    setLoading(true);

    try {
      console.log('FETCHING ISSUES FOR tenant ID:', tenantId);
      const response = await fetch(`${BASE_URL}/api/tenant-issues/${tenantId}/`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Fetch Issues HTTP error:', response.status, errorText);
        setIssues([]);
        return;
      }

      const data = await response.json();

      let issuesArray = [];
      if (Array.isArray(data)) {
        issuesArray = data;
      } else if (data && Array.isArray(data.results)) {
        issuesArray = data.results;
      } else if (data && Array.isArray(data.issues)) {
        issuesArray = data.issues;
      }
      setIssues(issuesArray);
    } catch (error) {
      console.log('Fetch Issues Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch issues when tenantEmail becomes available.
  useEffect(() => {
    if (tenantEmail) {
      fetchIssues();
    }
  }, [tenantId]);

  // Refetch issues when screen gains focus and tenantId is set.
  useFocusEffect(
    useCallback(() => {
      if (tenantId) {
        fetchIssues();
      }
    }, [tenantId])
  );

  // Aligned with your specific STATUS colors
  const priorities = [
    { label: "Low", color: COLORS.INFO, bg: COLORS.BLUE_LIGHT },
    { label: "Medium", color: COLORS.WARNING, bg: `${COLORS.WARNING}15` },
    { label: "High", color: COLORS.ERROR, bg: `${COLORS.ERROR}15` },
  ];

  const stats = useMemo(
    () => ({
      total: issues.length,
      high: issues.filter((i) => i.severity === "High").length,
      resolved: issues.filter((i) => i.status === "Completed").length,
    }),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    if (activeFilter === "All") return issues;
    return issues.filter((i) => i.severity === activeFilter);
  }, [issues, activeFilter]);

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(!isFormVisible);
    if (isFormVisible && editingId) {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setImage(null);
      setPriority("Medium");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.2,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitIssue = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!tenantId) {
      Alert.alert("Error", "Tenant not found. Login again.");
      return;
    }

    try {
      console.log("SUBMITTING TENANT ID:", tenantId);

      const formData = new FormData();

      formData.append("tenant_id", tenantId.toString());
      formData.append("title", title);
      formData.append("description", description);
      formData.append("severity", priority);

      if (image) {
        formData.append("image", {
          uri: image.startsWith("file://") ? image : `file://${image}`,
          name: "issue.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetch(`${BASE_URL}/api/create-issue/`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      const data = await response.json();

      console.log("CREATE ISSUE RESPONSE:", data);

      if (response.status === 201) {
        Alert.alert("Success", "Issue submitted successfully");

        setTitle("");
        setDescription("");
        setPriority("Medium");
        setImage(null);
        setIsFormVisible(false);
        // Optimistically add the new issue to the list (fallback generates temporary ID)
        const tempId = Date.now();
        const newIssue = {
          id: data && data.id ? data.id : tempId,
          title,
          description,
          severity: priority,
          image: image,
          status: "Pending",
          created_at: new Date().toISOString(),
        };
        setIssues((prev) => [newIssue, ...prev]);

        fetchIssues(); // re-enable to sync with backend after submission
      } else {
        Alert.alert("Error", data.error || "Failed to submit issue");
      }
    } catch (error) {
      console.log("Submit Issue Error:", error);
      Alert.alert("Error", "Network error");
    }
  };

  //   LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  //   const dateStr = new Date().toLocaleDateString("en-IN", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //   });

  //   if (editingId) {
  //     setIssues(
  //       issues.map((i) =>
  //         i.id === editingId
  //           ? { ...i, title, description, image, priority }
  //           : i,
  //       ),
  //     );
  //     setEditingId(null);
  //   } else {
  //     setIssues([
  //       {
  //         id: Date.now(),
  //         title,
  //         description,
  //         image,
  //         priority,
  //         date: dateStr,
  //         status: "Open",
  //       },
  //       ...issues,
  //     ]);
  //   }

  //   setTitle("");
  //   setDescription("");
  //   setImage(null);
  //   setPriority("Medium");
  //   setIsFormVisible(false);
  // };

  const deleteIssue = (id) => {
    Alert.alert("Confirm Deletion", "Remove this issue permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/api/delete-issue/${id}/`, {
              method: "DELETE",
            });

            if (response.status === 200) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

              // remove from UI AFTER backend success
              setIssues(issues.filter((i) => i.id !== id));

              Alert.alert("Success", "Issue deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete issue");
            }
          } catch (error) {
            console.log("Delete Error:", error);
            Alert.alert("Error", "Network error");
          }
        },
      },
    ]);
  };

  const startEdit = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTitle(item.title);
    setDescription(item.description);
    setImage(item.image);
    setPriority(item.severity || "Medium"); // Use severity from item
    setEditingId(item.id);
    setIsFormVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{t('tenant')}</Text>
          <Text style={styles.headerTitle}>{t('issues')}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
          <Ionicons
            name={isFormVisible ? "close" : "add"}
            size={22}
            color={COLORS.WHITE}
          />
          <Text style={styles.addButtonText}>
            {isFormVisible ? t('skip') : t('report_issue')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DASHBOARD STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('all')}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.ERROR, borderLeftWidth: 3 },
            ]}
          >
            <Text style={styles.statNumber}>{stats.high}</Text>
            <Text style={styles.statLabel}>{t('pending_count')}</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.SUCCESS, borderLeftWidth: 3 },
            ]}
          >
            <Text style={styles.statNumber}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('completed')}</Text>
          </View>
        </View>

        {/* COLLAPSIBLE FORM CARD */}
        {isFormVisible && (
          <View style={styles.formCard}>
            <Text style={styles.formHeader}>
              {editingId ? t('update_status') : t('report_issue')}
            </Text>

            <Text style={styles.inputLabel}>{t('type')}</Text>
            <TextInput
              placeholder={t('search_by_name')}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>{t('description')}</Text>
            <TextInput
              placeholder={t('description')}
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>SEVERITY LEVEL</Text>
            <View style={styles.priorityGroup}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setPriority(p.label)}
                  style={[
                    styles.priorityChip,
                    priority === p.label && {
                      backgroundColor: p.color,
                      borderColor: p.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p.label && { color: COLORS.WHITE },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Feather
                  name={image ? "check" : "paperclip"}
                  size={18}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.attachText}>
                  {image ? "Attached" : "Attach File"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={editingId ? handleUpdate : submitIssue}
              >
                <Text style={styles.submitBtnText}>
                  {editingId ? "Save Changes" : "Submit Issue"}
                </Text>
                <Ionicons
                  name="send"
                  size={14}
                  color={COLORS.WHITE}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}
          </View>
        )}

        {/* LIST FILTERS */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Active Tickets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {["All", "High", "Medium", "Low"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setActiveFilter(f);
                }}
                style={[
                  styles.filterChip,
                  activeFilter === f && { backgroundColor: COLORS.PRIMARY },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f && { color: COLORS.WHITE },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ISSUES FEED */}
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={54}
              color={COLORS.TEXT_LIGHT}
            />
            <Text style={styles.emptyTitle}>No issues found</Text>
            <Text style={styles.emptySub}>You're all caught up for now.</Text>
          </View>
        ) : (
          filteredIssues.map((item) => {
            const pData =
              priorities.find((p) => p.label === item.severity) || priorities[1];

            const isCompleted = item.status === "Completed";
            const isWorking =
              item.status === "Pending" || item.status === "In Progress";

            return (
              <View key={item.id} style={styles.issueCard}>

                {/* TOP ROW */}
                <View style={styles.issueTopRow}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: pData.color },
                    ]}
                  />
                  <Text style={styles.issueDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* ✅ COMPLETED VIEW */}
                {isCompleted ? (
                  <>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "green",
                        marginBottom: 6,
                      }}
                    >
                      Status: {item.status}
                    </Text>

                    {item.owner_comment && (
                      <View
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: "#F1F5F9",
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontWeight: "700", fontSize: 13 }}>
                          Owner Response:
                        </Text>
                        <Text style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                          {item.owner_comment}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* NORMAL DETAILS */}
                    <Text style={styles.issueTitle}>{item.title}</Text>

                    <Text style={styles.issueDesc} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.issueImage}
                      />
                    )}

                    {/* ✅ ADD THIS BLOCK (Pending + In Progress) */}
                    {isWorking && item.owner_comment && (
                      <View
                        style={{
                          marginTop: 10,
                          padding: 12,
                          backgroundColor: "#F1F5F9",
                          borderRadius: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            marginBottom: 4,
                            color:
                              item.status === "Pending"
                                ? "#F59E0B" // orange
                                : "#3B82F6", // blue
                          }}
                        >
                          Status: {item.status}
                        </Text>

                        <Text style={{ fontWeight: "700", fontSize: 13 }}>
                          Owner Response:
                        </Text>

                        <Text style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                          {item.owner_comment}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* FOOTER */}
                <View style={styles.issueFooter}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: pData.bg },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: pData.color }]}>
                      {item.severity || "Medium"} Severity
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      style={styles.iconBtn}
                    >
                      <Feather
                        name="edit-2"
                        size={16}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteIssue(item.id)}
                      style={styles.iconBtn}
                    >
                      <Feather name="trash-2" size={16} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Header
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },

  // Dashboard Stats
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: "uppercase",
  },

  // Collapsible Form
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 24,
    elevation: 4,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },

  priorityGroup: { flexDirection: "row", gap: 10, marginBottom: 24 },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },

  formFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  attachText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginLeft: 6,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: { color: COLORS.WHITE, fontSize: 14, fontWeight: "700" },
  previewImage: { width: "100%", height: 140, borderRadius: 10, marginTop: 16 },

  // Filters & List Header
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginRight: 16,
  },
  filterScroll: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.BORDER,
  },
  filterText: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  emptySub: { fontSize: 13, color: COLORS.TEXT_LIGHT, marginTop: 4 },

  // Issue Card
  issueCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 16,
    elevation: 1,
  },
  issueTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  issueDate: { fontSize: 12, color: COLORS.TEXT_LIGHT, fontWeight: "600" },

  issueTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  issueDesc: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 16,
  },
  issueImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },

  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    paddingTop: 16,
  },



  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  actionButtons: { flexDirection: "row", gap: 16 },
  iconBtn: { padding: 4 },
});