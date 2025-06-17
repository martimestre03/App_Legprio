import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { BleManager, Device, BleError, State } from "react-native-ble-plx";

import React, { useState } from "react";
import { useBLE } from "@/store/BLE-context";
import CustomText from "../global/CustomText";

const prefix = "LegPrio";

export default function DevicesList({ devices, startScan, scanning }) {
  const [isDisabled, setIsDisabled] = useState(false); // State to track if buttons should be disabled
  const [connecting, setConnecting] = useState(null);
  const { connectToDevice, subscribeToCharacteristic} = useBLE();

  const handleDevicePress = (device) => {
    const handle = async () => {
      setConnecting(device.id);
      setIsDisabled(true); // Disable all buttons once one is pressed
      await connectToDevice(device.id); // Proceed with connecting to the selected device
      setConnecting(null);
    };
    handle();
  };

  const renderDevices = () => {
    const namedDevices = devices.filter(
      (device) => device.name && device.name.startsWith(prefix)
    );
    if (scanning && namedDevices.length === 0) {
      return <ActivityIndicator style={{ marginTop: 5 }} />;
    }
    if (namedDevices.length === 0) {
      return (
        <CustomText style={{ marginTop: 5, fontSize: 16, fontWeight: "500" }}>
          No devices found.
        </CustomText>
      );
    }
    return namedDevices.map((device, index) => {
      const isLastDevice = index === namedDevices.length - 1; // Check if it's the last device
      return (
        <TouchableOpacity
          disabled={isDisabled}
          onPress={() => handleDevicePress(device)}
          key={device.id}
          style={[
            {
              padding: 10,
              paddingLeft: 0,
              borderBottomWidth: 1,
              borderColor: "#ccc",
              marginLeft: 10,
              flexDirection: "row",
              justifyContent: "space-between",
            },
            isLastDevice && { borderBottomWidth: 0, paddingBottom: 0 }, // No bottom border for the last device
          ]}
        >
          <CustomText style={{ fontWeight: "600", fontSize: 18 }}>
            {device.name}
          </CustomText>
          {connecting === device.id && <ActivityIndicator />}
        </TouchableOpacity>
      );
    });
  };

  return (
    <>
      <View style={[styles.mainCard, { justifyContent: "space-between" }]}>
        <CustomText style={{ fontSize: 20, fontWeight: "bold" }}>
          Choose your device:
        </CustomText>
        {renderDevices()}
      </View>
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            "Device Not Found",
            "Make sure your device is powered on and nearby. If you're still having trouble, disconnect and reconnect it, then tap 'Rescan' to try again.",
            [
              { text: "Rescan", onPress: startScan }, // Replace `startScan` with your actual rescan function
            ]
          );
        }}
      >
        <View style={{ width: "100%", alignItems: "center", marginTop: 20 }}>
          <CustomText
            style={{ fontWeight: "400", fontSize: 16, color: "grey" }}
          >
            Can’t find your device?
          </CustomText>
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    width: "100%",
  },
});
