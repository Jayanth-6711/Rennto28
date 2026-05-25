import { BookingProvider } from "@/src/context/BookingContext";
import { TenantProvider } from "@/src/context/TenantContext";
import { LanguageProvider } from "@/src/utils/LanguageContext";
import MainNavigator from "@/src/navigation/MainNavigator";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental is currently a no-op",
  "Unable to activate keep awake",
]);

export default function App() {
  return (
    <LanguageProvider>
      <BookingProvider>
        <TenantProvider>
          <MainNavigator />
        </TenantProvider>
      </BookingProvider>
    </LanguageProvider>
  );
}