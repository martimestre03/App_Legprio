import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Fontisto from "@expo/vector-icons/Fontisto";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { SensorData } from "./../../app/mainScreen";
import CustomText from "../global/CustomText";

type LastReadingCardProps = {
  data: SensorData;
};

const LastReadingCard: React.FC<LastReadingCardProps> = ({ data }) => {
  return (
    <View style={{ marginTop: 20 }}>
      <CustomText style={styles.title}>Last reading!</CustomText>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.mainInfo}>
            <CustomText style={styles.mainValue}>{data.uiSensorSerialNumber}</CustomText>
            {/* {batteryLevel ? (
              <View style={styles.batteryInfo}>
                <Fontisto name="battery-half" size={24} color="#CCC" />
                <CustomText style={styles.batteryText}>{batteryLevel}%</CustomText>
              </View>
            ) : (
              <FontAwesome5
                name="plug"
                size={20}
                color="#CCC"
                style={[{ transform: [{ rotate: "90deg" }] }]}
              />
            )} */}
          </View>
          <View style={styles.details}>
            <DetailBox label="Res" value={data.usResistanceValue} />
            <DetailBox label="Cap." value={data.usCapacitanceValue} />
            <DetailBox label="Freq." value={data.usFrequencyValue} />
          </View>
        </View>
      </View>
    </View>
  );
};

type DetailBoxProps = {
  label: string;
  value?: number;
};

const DetailBox: React.FC<DetailBoxProps> = ({ label, value }) => (
  <View style={styles.detailBox}>
    <CustomText style={styles.detailLabel}>{label}</CustomText>
    <View style={styles.valueContainer}>
      <CustomText style={styles.valueText}>{value  || "-"}</CustomText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    width: "100%",
  },
  title: {
    fontWeight: "700",
    fontSize: 18,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  mainInfo: {
    alignItems: "flex-start",
  },
  mainValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  batteryInfo: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  batteryText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 5,
    color: "#ccc",
  },
  details: {
    flexDirection: "row",
  },
  detailBox: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  detailLabel: {
    textAlign: "center",
    width: "100%",
    fontSize: 16,
    fontWeight: "400",
  },
  valueContainer: {
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 45,
  },
  valueText: {
    fontWeight: "600",
    fontSize: 16,
  },
});

export default LastReadingCard;
