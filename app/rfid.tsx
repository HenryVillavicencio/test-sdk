import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, FlatList, Alert } from 'react-native';
import * as C72Rfid from 'c72-rfid';

export default function RfidTestScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize on mount
    const initReader = async () => {
      try {
        const success = C72Rfid.init();
        setInitialized(success);
        if (!success) {
          console.warn("RFID Init failed");
        }
      } catch (e) {
        console.error("RFID Init error", e);
      }
    };

    initReader();

    // Setup listener
    const subscription = C72Rfid.addTagListener((event) => {
      setTags((prevTags) => {
        const existing = prevTags.find(t => t.epc === event.epc);
        if (existing) {
          // Update RSSI or count
          return prevTags.map(t => t.epc === event.epc ? { ...t, rssi: event.rssi, count: (t.count || 1) + 1 } : t);
        }
        return [...prevTags, { ...event, count: 1 }];
      });
    });

    return () => {
      C72Rfid.stopScanning();
      C72Rfid.free();
      subscription.remove();
    };
  }, []);

  const toggleScan = () => {
    if (isScanning) {
      C72Rfid.stopScanning();
      setIsScanning(false);
    } else {
      if (!initialized) {
        Alert.alert("Error", "RFID Reader not initialized");
        // Try init again
        if (C72Rfid.init()) {
            setInitialized(true);
        } else {
            return;
        }
      }
      const started = C72Rfid.startScanning();
      if (started) {
        setIsScanning(true);
      } else {
        Alert.alert("Error", "Failed to start scanning");
      }
    }
  };

  const clearTags = () => {
    setTags([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>C72 RFID Test</Text>
      <View style={styles.statusContainer}>
        <Text>Status: {initialized ? "Initialized" : "Not Initialized"}</Text>
        <Text>Scanning: {isScanning ? "Yes" : "No"}</Text>
        <Text>Tags Found: {tags.length}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isScanning ? "Stop Scanning" : "Start Scanning"}
          onPress={toggleScan}
        />
        <Button title="Clear List" onPress={clearTags} />
      </View>

      <FlatList
        data={tags}
        keyExtractor={(item) => item.epc}
        renderItem={({ item }) => (
          <View style={styles.tagItem}>
            <Text style={styles.epc}>{item.epc}</Text>
            <Text>RSSI: {item.rssi}</Text>
            <Text>Count: {item.count}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tagItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  epc: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
