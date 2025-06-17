import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Button,
  Pressable,
  Alert,
  Dimensions,
  Share,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState, useEffect } from "react";
import {
  State,
  Subscription,
} from "react-native-ble-plx";
import WelcomeBox from "@/components/mainScreen/WelcomeBox";
import DevicesList from "@/components/mainScreen/DevicesList";
import { useRouter } from "expo-router";
import { useBLE } from "@/store/BLE-context";

import CustomText from "@/components/global/CustomText";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768 && height >= 1024;


// Function to parse the decrypted data into the SensorData_t structure
export interface SensorData {
  usResistanceValue: number;
  usCapacitanceValue: number;
  usFrequencyValue: number;
  sTemperature: number; // Temperature in degrees Celsius
  uiSensorSerialNumber: number;
  uiTimeWorked: number; // In minutes
}


interface GameData {
  p: number;
  b: number;
  s: number;
  e: number;
  t: number;
}

interface GameInterfaceProps {
  jsonData?: string;
  placeholder?: boolean;
}

// Helper to get a color from green (0) to yellow (0.5) to red (1)
const getErrorColor = (normalized: number) => {
  if (normalized <= 0.5) {
    // green to yellow
    const r = Math.round(255 * (normalized * 2));
    const g = 200;
    return `rgb(${r},${g},50)`;
  } else {
    // yellow to red
    const r = 255;
    const g = Math.round(200 * (1 - (normalized - 0.5) * 2));
    return `rgb(${r},${g},50)`;
  }
};

const GameInterface: React.FC<GameInterfaceProps> = ({ jsonData, placeholder }) => {
  if (placeholder) {
    return (
      <View style={[styles.gameContainer, { opacity: 0.6 }]}> 
        <Text style={[styles.gameTitle, { color: '#bbb' }]}>Reaction Time Challenge</Text>
        <View style={[styles.progressContainer, { backgroundColor: '#eee' }]}> 
          <View style={styles.progressCenter}>
            <Text style={[styles.centerMarker, { color: '#bbb' }]}>|</Text>
          </View>
          <View style={[styles.progressIndicator, { left: '50%', backgroundColor: '#bbb' }]} />
        </View>
        <Text style={[styles.feedbackText, { color: '#bbb' }]}>--</Text>
        <Text style={[styles.positionText, { color: '#bbb' }]}>Position Accuracy: --</Text>
      </View>
    );
  }
  const parsedData: GameData = jsonData ? JSON.parse(jsonData) : { p: 0, b: 0, s: 0, e: 1 };
  // If this is a reference time, render nothing
  if (parsedData.t !== undefined && parsedData.s === 0 && parsedData.p === 0 && parsedData.b === 0 && parsedData.e === 0) {
    return null;
  }
  const { p, b, s, e } = parsedData;
  const errorPercentage = Math.min(Math.max(b / (e - s), -1), 1);
  const absTimingMs = Math.abs(b * 1000);
  const absPositionCm = Math.abs(p) / 10;
  const maxTiming = 300; // ms
  const normTiming = Math.min(absTimingMs / maxTiming, 1);
  const timingColor = getErrorColor(normTiming);
  return (
    <View style={styles.gameContainer}>
      <Text style={styles.gameTitle}>Reaction Time Challenge</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressCenter}>
          <Text style={styles.centerMarker}>|</Text>
        </View>
        <View style={[
          styles.progressIndicator,
          {
            left: `${50 + (errorPercentage * 50)}%`,
            backgroundColor: timingColor,
          }
        ]} />
      </View>
      <Text style={[
        styles.feedbackText,
        { color: timingColor }
      ]}>
        {b < 0
          ? `${absTimingMs.toFixed(0)}ms Early`
          : `${absTimingMs.toFixed(0)}ms Late`}
      </Text>
      <Text style={styles.positionText}> 
        Position Accuracy: {absPositionCm < 1 ? 'Perfect!' : `${(p / 10).toFixed(1)}cm off`}
      </Text>
    </View>
  );
};

export default function index() {
  const [isConnecting] = useState<boolean>(false);

  const {
    devices,
    scanning,
    connectedDevice,
    startScan,
    bleState,
    subscribeToCharacteristic,
    disconnectDevice,
  } = useBLE();

  
  // const connectedDevice = true; //PROVISIONAL
  const router = useRouter();
  const [data, setData] = useState<string | null>(null);
  const [logs, setLogs] = useState<GameData[]>([]);
  const LOGS_KEY = 'game_logs';
  const [subjectId, setSubjectId] = useState<string>('');
  const [trialId, setTrialId] = useState<string>('');
  const SUBJECT_ID_KEY = 'subject_id';
  const TRIAL_ID_KEY = 'trial_id';
  const [showIdModal, setShowIdModal] = useState(false);

  // Load logs from storage on mount
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOGS_KEY);
        if (stored) {
          setLogs(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    };
    loadLogs();
  }, []);

  // Save logs to storage whenever they change
  useEffect(() => {
    AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  // Load subject/trial IDs from storage on mount
  useEffect(() => {
    const loadIds = async () => {
      try {
        const s = await AsyncStorage.getItem(SUBJECT_ID_KEY);
        const t = await AsyncStorage.getItem(TRIAL_ID_KEY);
        if (s) setSubjectId(s);
        if (t) setTrialId(t);
      } catch {}
    };
    loadIds();
  }, []);

  // Save subject/trial IDs to storage when they change
  useEffect(() => {
    AsyncStorage.setItem(SUBJECT_ID_KEY, subjectId);
  }, [subjectId]);
  useEffect(() => {
    AsyncStorage.setItem(TRIAL_ID_KEY, trialId);
  }, [trialId]);

  // Add new log on BLE data
  useEffect(() => {
    if (!connectedDevice || !connectedDevice.id) {
      console.log('[BLE] Skipping subscription: No connected device');
      return;
    }
    if (connectedDevice && connectedDevice.id && connectedDevice.isConnected && typeof connectedDevice.isConnected === 'function') {
      connectedDevice.isConnected().then(isConnected => {
        if (!isConnected) {
          console.log('[BLE] Device is not actually connected, skipping subscription');
          return;
        }
      });
    }
    let subscription: Subscription | null = null;
    let cancelled = false;
    console.log('[BLE] Attempting to subscribe to characteristic');
    const subscCharacteristic = async () => {
      try {
        subscription = await subscribeToCharacteristic(
          "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
          "beb5483e-36e1-4688-b7f5-ea07361b26a8",
          (data) => {
            try {
              let parsed: GameData = JSON.parse(data);
              if (parsed.t === undefined) parsed.t = 0;
              const isReference = parsed.t !== undefined && parsed.s === 0 && parsed.p === 0 && parsed.b === 0 && parsed.e === 0;
              console.log('[BLE] Received:', parsed, 'isReference:', isReference, 't:', parsed.t, 's:', parsed.s, 'p:', parsed.p, 'b:', parsed.b, 'e:', parsed.e);
              setLogs((prev) => [parsed, ...prev].slice(0, 100));
              if (!isReference) {
                setData(data);
              }
            } catch {}
          }
        );
        if (subscription) {
          console.log('[BLE] Subscription created');
        } else {
          console.log('[BLE] Subscription not created');
        }
      } catch (error) {
        setData(null);
        console.log('[BLE] Subscription error:', error);
      }
    };
      subscCharacteristic();
    return () => {
      cancelled = true;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
        console.log('[BLE] Subscription removed');
    }
    };
  }, [connectedDevice]);

  // Download logs as csv (share as text, no new libraries)
  const downloadLogs = async () => {
    if (!logs.length) return;
    const header = 'Subject ID,Trial ID,Millis (t),Timing Error (ms),Position Error (mm),Score,Start,End,Button Time,Button Position,Reference\n';
    const body = logs.map(log => {
      const isReference = log.t !== undefined && log.s === 0 && log.p === 0 && log.b === 0 && log.e === 0;
      return `${subjectId || ''},${trialId || ''},${log.t},${isReference ? '' : (log.b*1000).toFixed(0)},${isReference ? '' : log.p.toFixed(2)},${isReference ? '' : Math.max(100 - Math.abs(log.p) / 10, 0).toFixed(0)},${log.s},${log.e},${log.b},${log.p},${isReference ? 'true' : 'false'}`;
    }).join('\n');
    const content = header + body;
    await Share.share({
      message: content,
      title: 'legprio_logs.csv',
    });
  };

  // Clear logs with confirmation
  const clearLogs = async () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: async () => {
          setLogs([]);
          await AsyncStorage.removeItem(LOGS_KEY);
        }},
      ]
    );
  };

  // Load dummy logs for testing
  const loadDummyLogs = () => {
    setLogs([
      { t: 1000, p: 5, b: 0.12, s: 0, e: 1 },
      { t: 2000, p: -8, b: -0.08, s: 0, e: 1 },
      { t: 3000, p: 15, b: 0.25, s: 0, e: 1 },
      { t: 4000, p: 2, b: 0.01, s: 0, e: 1 },
    ]);
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          horizontal={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ width: "100%" }}>
            
            {connectedDevice && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={{ marginLeft: 5, fontSize: 16, fontWeight: "bold", color: "#4CAF50" }}>
                  Connected
                  </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#FF6B6B',
                      borderRadius: 16,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      backgroundColor: 'white',
                      shadowColor: 'rgba(0,0,0,0.05)',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }}
                    onPress={() => {
                      Alert.alert(
                        'Disconnect',
                        'Are you sure you want to disconnect from the device?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Disconnect', style: 'destructive', onPress: disconnectDevice },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="log-out-outline" size={16} color="#FF6B6B" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 14 }}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
            )}
            {/* Game interface or WelcomeBox */}
            {connectedDevice && data && (
              <GameInterface jsonData={data} />
            )}
            {connectedDevice && !data && (
              <GameInterface placeholder />
            )}
            {!connectedDevice && !scanning && devices.length === 0 && !isConnecting && (
              <WelcomeBox
                onButtonPressed={startScan}
                disabled={scanning || bleState !== State.PoweredOn || isConnecting}
              />
            )}
            
            {!connectedDevice &&
              !isConnecting &&
              (devices.length !== 0 || scanning) && (
                <DevicesList
                  devices={devices}
                  startScan={startScan}
                  scanning={scanning}
                />
              )}
            {/* Logs Section */}
            <View style={{ marginTop: 30 }}>
              {/* Log actions and IDs header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <TouchableOpacity onPress={downloadLogs} style={{ backgroundColor: '#E6F0FA', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ color: '#1B88FF', fontWeight: '600' }}>Download CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={loadDummyLogs} style={{ backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ color: '#888', fontWeight: '600' }}>Load</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearLogs} style={{ backgroundColor: '#FFE6E6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ color: '#FF6B6B', fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowIdModal(true)} style={{ backgroundColor: '#F4F7FB', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-circle-outline" size={18} color="#1B88FF" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#1B88FF', fontWeight: '600' }}>IDs</Text>
                </TouchableOpacity>
              </View>
              {/* IDs Modal */}
              <Modal
                visible={showIdModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowIdModal(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowIdModal(false)}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} />
                </TouchableWithoutFeedback>
                <View style={{ position: 'absolute', top: '30%', left: '7%', right: '7%', backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 18, textAlign: 'center' }}>Subject & Trial IDs</Text>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: '#444', marginBottom: 2 }}>Subject ID</Text>
                    <TextInput
                      style={{ backgroundColor: '#F4F7FB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' }}
                      placeholder="Not set"
                      value={subjectId}
                      onChangeText={setSubjectId}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: '#444', marginBottom: 2 }}>Trial ID</Text>
                    <TextInput
                      style={{ backgroundColor: '#F4F7FB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' }}
                      placeholder="Not set"
                      value={trialId}
                      onChangeText={setTrialId}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowIdModal(false)} style={{ alignSelf: 'center', marginTop: 8, backgroundColor: '#E6F0FA', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24 }}>
                    <Text style={{ color: '#1B88FF', fontWeight: '600', fontSize: 16 }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
              {logs.length > 0 ? (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <CustomText style={{ fontWeight: '700', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Your Recent Results</CustomText>
                  {/* Modern header row with log count */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#F4F7FB', borderRadius: 10, paddingVertical: 8, marginBottom: 2 }}>
                    <Text style={{ width: 120, color: '#333', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Millis (t)</Text>
                    <Text style={{ flex: 1, color: '#333', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Timing (ms)</Text>
                    <Text style={{ flex: 1, color: '#333', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Position (mm)</Text>
                    <Text style={{ flex: 1, color: '#333', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Score</Text>
                  </View>
                  {logs.map((log, idx) => {
                    const isReference = log.t !== undefined && log.s === 0 && log.p === 0 && log.b === 0 && log.e === 0;
                    return (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: idx === logs.length - 1 ? 0 : 1, borderColor: '#F0F0F0', backgroundColor: isReference ? '#FFF9E3' : undefined }}>
                        <Text style={{ width: 120, color: isReference ? '#B8860B' : '#888', fontWeight: isReference ? 'bold' : 'normal', fontSize: 14, textAlign: 'center' }}>{log.t}</Text>
                        {isReference ? (
                          <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="time-outline" size={18} color="#B8860B" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#B8860B', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>Reference Time</Text>
                          </View>
                        ) : (
                          <>
                            <Text style={{ flex: 1, fontWeight: '500', fontSize: 15, color: '#444', textAlign: 'center' }}>{(log.b * 1000).toFixed(0)}</Text>
                            <Text style={{ flex: 1, fontWeight: '500', fontSize: 15, color: '#444', textAlign: 'center' }}>{log.p.toFixed(2)}</Text>
                            <Text style={{ flex: 1, fontWeight: '500', fontSize: 15, color: '#444', textAlign: 'center' }}>{Math.max(100 - Math.abs(log.p) / 10, 0).toFixed(0)}</Text>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <CustomText style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>
                  No results yet. Play a game to see your progress!
                </CustomText>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  batteryText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 5,
    color: "#ccc",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  scrollViewContent: {
    paddingHorizontal: "5%",
    width: "100%",
  },
  initText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  header: {
    marginTop: 10,
    justifyContent: "space-between",
    flexDirection: "row",
    width: "100%",
  },
  headerText: {
    fontSize: isTablet ? 40 : 30,
    fontWeight: "700",
  },
  mainCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    width: "100%",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
  },
  statsContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  statsRow: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  statBox: {
    backgroundColor: "#F0F4F8",
    width: 85,
    height: 55,
    borderRadius: 8,
  },

  container: {
    paddingHorizontal: "5%",
    width: "100%",
  },

  card: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  gameContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2C3E50'
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2C3E50'
  },
  progressContainer: {
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginVertical: 10,
    position: 'relative'
  },
  progressCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  centerMarker: {
    fontSize: 24,
    color: '#2C3E50',
    fontWeight: 'bold'
  },
  progressIndicator: {
    position: 'absolute',
    top: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: -15,
    backgroundColor: '#4CAF50'
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10
  },
  positionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    color: '#666'
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});
