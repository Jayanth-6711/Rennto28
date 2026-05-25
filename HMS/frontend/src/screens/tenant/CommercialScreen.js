import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import BASE_URL from "@/src/config/Api";
import COLORS from "../../theme/colors";
import { TenantContext } from "@/src/context/TenantContext";
import { BookingContext } from "@/src/context/BookingContext";

const { width } = Dimensions.get("window");

export default function CommercialScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState([]);
  const { tenantEmail } = useContext(TenantContext);

  useEffect(() => {
    fetchCommercial();
  }, []);

  const fetchCommercial = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/owner_props/`);
      const result = await response.json();
      const MEDIA_URL = `${BASE_URL}/media/`;

      const formattedData = result.data
        .filter((item) => item.type === "Commercial")
        .map((item) => {
          let mainImage = item.image
            ? item.image.startsWith("http")
              ? item.image
              : MEDIA_URL + item.image
            : null;

          let galleryImages = item.gallery
            ? item.gallery.map((img) =>
              img.startsWith("http") ? img : MEDIA_URL + img
            )
            : [];

          if (!mainImage && galleryImages.length > 0) {
            mainImage = galleryImages[0];
          }

          return {
            id: String(item.id),

            type: item.type || "Commercial",

            name: item.name || "Unnamed Space",
            address: item.address || "No Address",

            image: mainImage || "https://via.placeholder.com/400",
            galleryImages: galleryImages || [],

            rating: item.rating || 4.5,
            reviewCount: 18,

            facilities: Array.isArray(item.facilities)
              ? item.facilities
              : [],

            price: item.price || "45,000",

            category: item.category || "Office",

            ownerEmail: item.owner_email || "",
            ownerName: item.owner_name || "Owner",

            contact: item.contact || "",

            latitude: item.latitude
              ? parseFloat(item.latitude)
              : 17.385044,

            longitude: item.longitude
              ? parseFloat(item.longitude)
              : 78.486671,

            isAvailable:
              item.isAvailable !== undefined
                ? item.isAvailable
                : true,
          };
        });

      setProperties(formattedData);
    } catch (error) {
      console.log("Fetch Commercial Error:", error);
    }
  };

  const filteredCommercial = properties.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );


  const shortenAddress = (address) => {
    if (!address) return "No Address";
    const parts = address.split(',').map(s => s.trim());
    if (parts.length > 2) {
      return `${parts[0]}, ${parts[parts.length - 2]}`;
    }
    return address;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={["#f97316", "#fb923c"]}
          style={styles.hero}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Commercial</Text>
              <Text style={styles.heroSubtitle}>Grow Your Business</Text>
            </View>
            <Image
              source={require("../../../assets/images/commercialLogo.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Search Bar Container */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location, property or owner..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color="#f97316" />
              <Text style={styles.filterText}>Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Popular Commercial Spaces</Text>

          {filteredCommercial.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate("PropertyDetailsScreen", { property: item })}
            >
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardAddress} numberOfLines={1}>{shortenAddress(item.address)}</Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating} ({item.reviewCount})</Text>
                </View>

                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category}</Text>
                  </View>
                  {item.facilities.slice(0, 2).map((fac, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{fac}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.price}</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCommercial.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No commercial spaces found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  hero: {
    height: 240,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  heroImage: {
    width: 120,
    height: 120,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 60,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 12,
    marginLeft: 10,
  },
  filterText: {
    color: "#f97316",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 12,
    flexDirection: "row",
    marginBottom: 15,
    height: 135,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardAddress: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  ratingText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: "#f97316",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#999",
    marginTop: 10,
    fontSize: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f97316",
  },
  pricePeriod: {
    fontSize: 12,
    color: "#777",
    marginLeft: 2,
  },
});
