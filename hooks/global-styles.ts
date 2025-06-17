import { Dimensions } from "react-native";

// Get screen dimensions
const { width, height } = Dimensions.get("window");
const isTablet = width >= 768 && height >= 1024;

// Define your global styles
const GlobalStyles = {
  colors: {
    primary: "#1B88FF",
    secondary: "#D9EBFF",
    textPrimary: "#000000",
    textSecondary: "#A7A7A7",
    background: "#F0F4F8",
    cardBackground: "#FFFFFF",
    border: "#CCCCCC",
  },
  fonts: {
    regular: "System", // Replace with your custom font family if needed
    bold: "System", // Replace with your custom font family if needed
  },
  dimensions: {
    padding: isTablet ? 30 : 15,
    margin: isTablet ? 20 : 10,
    borderRadius: isTablet ? 15 : 12,
    buttonHeight: isTablet ? 50 : 40,
    buttonPadding: isTablet ? 40 : 20,
    marginBetweenComponents: isTablet ? 16 : 10, // Margin between similar components
    marginBetweenSections: isTablet ? 30 : 20, // Margin between sections
  },
  text: {
    large: {
      fontSize: isTablet ? 30 : 24,
      fontWeight: "700",
      textAlign: "center",
      color: "#000",
    },
    medium: {
      fontSize: isTablet ? 24 : 18,
      fontWeight: "500",
      textAlign: "left",
      color: "#000",
    },
    small: {
      fontSize: isTablet ? 18 : 14,
      fontWeight: "400",
      textAlign: "left",
      color: "#A7A7A7",
    },
  },
  images: {
    small: {
      width: isTablet ? 150 : 100,
      height: isTablet ? 150 : 100,
    },
    large: {
      width: isTablet ? 200 : 150,
      height: isTablet ? 200 : 150,
    },
  },
};

export default GlobalStyles;
