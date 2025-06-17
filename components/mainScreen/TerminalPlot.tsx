import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBLE } from '@/store/BLE-context';

const TerminalPlot: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { subscribeToCharacteristic } = useBLE();

  // Subscribe to BLE characteristic
  useEffect(() => {
    let subscription: any = null;
    let cancelled = false;

    const subscribe = async () => {
      try {
        subscription = await subscribeToCharacteristic(
          "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
          "beb5483e-36e1-4688-b7f5-ea07361b26a9",
          (data) => {
            if (cancelled) return;
            setLogs(prev => {
              const newLogs = [...prev, data];
              // Keep only last 1000 lines
              return newLogs.slice(-1000);
            });
          }
        );
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  // Handle scroll events
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsAtBottom(isCloseToBottom);
  };

  // Scroll to bottom when new logs arrive and we're at the bottom
  useEffect(() => {
    if (isAtBottom && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [logs, isAtBottom]);

  const clearLogs = () => {
    setLogs([]);
  };

  const TerminalContent = () => (
    <View style={[styles.terminalBox, isFullScreen && styles.terminalBoxFullScreen]}>
      <View style={styles.terminalHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.terminalTitle}>BLE Terminal</Text>
          <Text style={styles.terminalSubtitle}>Characteristic: beb5483e-36e1-4688-b7f5-ea07361b26a9</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={clearLogs}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </TouchableOpacity>
          {!isFullScreen && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsFullScreen(true)}
            >
              <Ionicons name="expand-outline" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {logs.slice().reverse().map((log, index) => (
          <Text key={index} style={styles.logLine}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <>
      <TerminalContent />
      <Modal
        visible={isFullScreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsFullScreen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsFullScreen(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TerminalContent />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  terminalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    // marginHorizontal: 16,
    marginTop: 16,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  terminalBoxFullScreen: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
    height: '100%',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  terminalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terminalSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  terminalContent: {
    flex: 1,
  },
  logLine: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
  iconButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
});

export default TerminalPlot; 