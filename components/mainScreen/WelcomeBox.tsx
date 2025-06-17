import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import GlobalStyles from "@/hooks/global-styles";
import React from "react";
import CustomText from "../global/CustomText";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768 && height >= 1024;

export default function WelcomeBox({
  onButtonPressed = () => {},
  disabled = false,
}) {
  return (
    <View style={styles.mainCard}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
          <CustomText style={styles.initText}>
          {"Ready to play?"}
        </CustomText>
        <CustomText style={styles.subText}>
          {"Connect your Legprio to get started."}
          </CustomText>
        <TouchableOpacity onPress={onButtonPressed} disabled={disabled} style={{ marginTop: 18, alignSelf: 'flex-start' }}>
          <View style={styles.button}>
            <AntDesign
              name="poweroff"
              size={isTablet ? 28 : 20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <CustomText style={styles.buttonText}>Connect Legprio</CustomText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginTop: 10,
    justifyContent: "center",
    backgroundColor: GlobalStyles.colors.cardBackground,
    flexDirection: "row",
    padding: isTablet ? 30 : 15,
    borderRadius: GlobalStyles.dimensions.borderRadius,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    width: "100%",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  statsRow: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsTextContainer: {
    justifyContent: "flex-end",
  },
  initText: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: "700",
    textAlign: "left",
    color: '#222',
    marginBottom: 2,
  },
  subText: {
    fontSize: isTablet ? 18 : 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'left',
  },
  button: {
    paddingHorizontal: isTablet ? 28 : 16,
    paddingVertical: 10,
    backgroundColor: "#1B88FF",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#1B88FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: isTablet ? 18 : 14,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
