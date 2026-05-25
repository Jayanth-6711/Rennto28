import React, { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
 
// Screens
import TenantHomeScreen, { PropertyDetailsScreen } from "../screens/tenant/TenantHomeScreen";
import HostelScreen from "../screens/tenant/HostelScreen";
import ApartmentScreen from "../screens/tenant/ApartmentScreen";
import CommercialScreen from "../screens/tenant/CommercialScreen";
 
import IssuesScreen1 from "../screens/tenant/IssuesScreen1";
import TenantIssuesScreen from "../screens/tenant/TenantIssuesScreen";
import PaymentScreen from "../screens/tenant/PaymentScreen";
import TenantPaymentScreen from "../screens/tenant/TenantPaymentScreen";
import ProfileScreen from "../screens/tenant/TenantProfileScreen";
 
// Context
import { BookingContext } from "../context/BookingContext";
import COLORS from "../theme/colors";
import { useLanguage } from "../utils/LanguageContext";
 
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
 
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TenantHome" component={TenantHomeScreen} />
      <Stack.Screen name="HostelScreen" component={HostelScreen} />
      <Stack.Screen name="ApartmentScreen" component={ApartmentScreen} />
      <Stack.Screen name="CommercialScreen" component={CommercialScreen} />
      <Stack.Screen name="PropertyDetailsScreen" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}
 
// Wrapper components to decide which screen to show
function IssuesWrapper() {
  const { requests = [] } = useContext(BookingContext);
  const isApproved = requests.some((r) => r.status === "accepted");
  return isApproved ? <TenantIssuesScreen /> : <IssuesScreen1 />;
}
 
function PaymentWrapper() {
  const { requests = [] } = useContext(BookingContext);
  const isApproved = requests.some((r) => r.status === "accepted");
  return isApproved ? <TenantPaymentScreen /> : <PaymentScreen />;
}
 
export default function TenantNavigation() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Issues") iconName = "alert-circle";
          else if (route.name === "Payment") iconName = "card";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="Issues" component={IssuesWrapper} options={{ tabBarLabel: t('issues') }} />
      <Tab.Screen name="Payment" component={PaymentWrapper} options={{ tabBarLabel: t('payments') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('edit_profile') }} />
    </Tab.Navigator>
  );
}