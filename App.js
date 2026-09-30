import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import GameFlow from "./src/screens/GameFlow";
import { posthog } from "./src/services/analytics";
import { ThemeAccessProvider } from "./src/services/ThemeAccessContext";
import { fonts } from "./src/theme/theme";

export default function App() {
  const [loaded] = useFonts({
    [fonts.display]: require("./assets/fonts/Luckiest_Guy/LuckiestGuy-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureTouches: false,
          captureScreens: false,
        }}
        style={{ flex: 1 }}
      >
        <ThemeAccessProvider>
          <GameFlow />
        </ThemeAccessProvider>
      </PostHogProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
