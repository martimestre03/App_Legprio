import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CustomText from "@/components/global/CustomText";

interface ColorStatusProps {
  color: string;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

const ColorStatus: React.FC<ColorStatusProps> = ({
  color,
  title,
  description,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.patternStep, isSelected && styles.selectedState]}
      onPress={onPress}
    >
      <View style={[styles.colorIndicator, { backgroundColor: color }]} />
      <View style={styles.descriptionContainer}>
        <CustomText style={styles.stateLabel}>{title}</CustomText>
        <CustomText style={styles.stateDescription}>{description}</CustomText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  patternStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedState: {
    borderColor: "#007BFF",
    borderWidth: 2,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  descriptionContainer: {
    flex: 1,
  },
  stateLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  stateDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
    marginTop: 4,
  },
});

export default ColorStatus;
