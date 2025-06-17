import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  ReactNode,
} from "react";
import { BleManager, Device, State, Subscription } from "react-native-ble-plx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, PermissionsAndroid, Alert, Linking, AppState } from "react-native";
import { Href, useRouter } from "expo-router";
import { Buffer } from "buffer";
import * as SplashScreen from "expo-splash-screen";


// UUID Map for Characteristics
type SubscriptionCallback = (data: string, characteristicUUID: string) => void;

// BLE Context Interface
interface BLEContextType {
  devices: Device[];
  scanning: boolean;
  connectedDevice: Device | null;
  isConnecting: boolean;
  bleState: State | null;
  startScan: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: () => void;
  subscribeToCharacteristic: (
    serviceUUID: string,
    characteristicUUID: string,
    onDataReceived: SubscriptionCallback
  ) => Promise<Subscription | null>;
}

const BLEContext = createContext<BLEContextType | undefined>(undefined);

// BLEProvider Component
export const BLEProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bleState, setBleState] = useState<State | null>(null);

  const bleManager = useMemo(() => new BleManager(), []);
  const router = useRouter();

  // Bluetooth Permissions (Android)
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(granted).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  // Connect to BLE Device
  const connectToDevice = async (deviceId: string) => {
    setIsConnecting(true);
    console.log("Trying to connect");
    try {
      const connectPromise = bleManager.connectToDevice(
        deviceId
      ) as Promise<Device>;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 3000)
      );

      // Race between connecting and timing out
      const device = await Promise.race([connectPromise, timeoutPromise]);
      await device.discoverAllServicesAndCharacteristics();
      const mtu = await device.requestMTU(512);
      console.log(`Negotiated MTU: ${mtu}`);
      setConnectedDevice(device);
      setDevices([]);
      await AsyncStorage.setItem("deviceId", deviceId);

      const disconnectSubscription = bleManager.onDeviceDisconnected(
        deviceId,
        async (error, disconnectedDevice) => {
          if (error) {
            console.log("Disconnection error:", error.message);
            return;
          }

          if (disconnectedDevice) {
            setConnectedDevice(null);
            setScanning(false);
            router.replace("/");
            Alert.alert(
              "Device Disconnected",
              `The device ${disconnectedDevice.name} has been disconnected.`
            );
            null;
          }
          disconnectSubscription.remove();
        }
      );
    } catch (error) {
      SplashScreen.hideAsync();
      const err = error as Error;
      Alert.alert("Connection Error", `Failed to connect: ${err.message}`);
    } finally {
      setIsConnecting(false);
      setDevices([]);
    }
  };

  // Start BLE Device Scan
  const startScan = async () => {
    if (scanning || bleState !== State.PoweredOn) return;

    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) return;

    setDevices([]);
    setScanning(true);
    const scannedDeviceIds = new Set<string>();

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setScanning(false);
        Alert.alert("Scan Error", `Failed to scan: ${error.message}`);
        return;
      }

      if (device && !scannedDeviceIds.has(device.id)) {
        scannedDeviceIds.add(device.id); // Add device ID to Set to track uniqueness
        setDevices((prevDevices) => [...prevDevices, device]); // Add unique device to state
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 2000);
  };

  // Disconnect from BLE Device
  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        await AsyncStorage.removeItem("deviceId");
        router.replace("/" as Href);
      } catch (error) {
        const err = error as Error;
        Alert.alert(
          "Disconnection Error",
          `Failed to disconnect: ${err.message}`
        );
      }
    } else {
      Alert.alert("No device connected");
    }
    setDevices([]);
  };



  


  const subscribeToCharacteristic = async (
    serviceUUID: string,
    characteristicUUID: string,
    onDataReceived: SubscriptionCallback
  ) => {
    try {
      console.log("[BLE] subscribeToCharacteristic called");
      console.log("Service UUID:", serviceUUID);
      console.log("Characteristic UUID:", characteristicUUID);
      console.log("Connected Device:", connectedDevice);
      if (!connectedDevice || !serviceUUID || !characteristicUUID) {
        Alert.alert(
          "Subscription Error44",
          "Invalid characteristic or service UUID"
        );
        return null;
      }
      // Monitor the characteristic for changes
      const subscription = connectedDevice.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.log("[BLE] Subscription Error:", error.message);
            // Alert.alert(
            //   "Subscription Error",
            //   `Failed to subscribe: ${error.message}`
            // );
            return;
          }

          if (characteristic?.value) {
            // Decode the value from base64 to UTF-8
            const decodedValue = Buffer.from(
              characteristic.value,
              "base64"
            ).toString("utf-8");

            // Pass the decoded value to the callback
            onDataReceived(decodedValue, characteristic.uuid);
          }
        }
      );
      console.log("[BLE] monitorCharacteristicForService subscription created");
      return subscription;
    } catch (err) {
      console.log("[BLE] Unexpected Error in subscribeToCharacteristic:", err);
      Alert.alert(
        "Unexpected Error",
        `An unexpected error occurred: ${(err as Error).message}`
      );
      return null;
    }
  };


  // Auto-connect to previous device on app load
  useEffect(() => {
    const reconnectPreviousDevice = async () => {
      try {
        const deviceId = await AsyncStorage.getItem("deviceId");
        const bluetoothON = await bleManager.state();
        console.log("deviceId: ", deviceId);
        if (deviceId && bluetoothON == "PoweredOn") {
          await connectToDevice(deviceId);
        }
      } finally {
        await SplashScreen.hideAsync();
        console.log("hideAsync: ");
      }
    };
    console.log("reconnectPreviousDevice");

    reconnectPreviousDevice();

    const subscription = bleManager.onStateChange((state) => {
      setBleState(state);
      if (state === State.PoweredOff)
        Alert.alert("Bluetooth is off", "Please turn on Bluetooth", [
          {
            text: "Activate Bluetooth",
            onPress: () => {
              if (Platform.OS === "ios") {
                // iOS: Navigate to Bluetooth settings (as close as possible)
                Linking.openURL("App-Prefs:Bluetooth"); // iOS behavior may vary slightly
              } else if (Platform.OS === "android") {
                // Android: Open Bluetooth settings directly
                Linking.openURL("android.settings.BLUETOOTH_SETTINGS");
              }
            },
          },
        ]);
    }, true);

    return () => subscription.remove();
  }, []);

  // On app resume, check if device is still connected
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && connectedDevice) {
        try {
          const isConnected = await bleManager.isDeviceConnected(connectedDevice.id);
          if (!isConnected) {
            setConnectedDevice(null);
            await AsyncStorage.removeItem('deviceId');
          }
        } catch {
          setConnectedDevice(null);
          await AsyncStorage.removeItem('deviceId');
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [connectedDevice]);

  return (
    <BLEContext.Provider
      value={{
        devices,
        scanning,
        connectedDevice,
        isConnecting,
        startScan,
        connectToDevice,
        disconnectDevice,
        subscribeToCharacteristic,
        bleState,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
};

// Custom Hook to Use BLE Context
export const useBLE = (): BLEContextType => {
  const context = useContext(BLEContext);
  if (!context) throw new Error("useBLE must be used within a BLEProvider");
  return context;
};
