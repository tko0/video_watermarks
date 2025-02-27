import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions, Linking } from 'react-native';
import { pick } from '@react-native-documents/picker';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null); // Store the URL
  const [loading, setLoading] = useState(false);
  const [hasWatermark, setHasWatermark] = useState<boolean | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      console.log("Picking video...");
      const [res] = await pick({ type: ['video/mp4', 'video/avi', 'video/mkv'] });

      if (!res) {
        console.log("No video selected.");
        return;
      }

      console.log('Picked video URI:', res.uri);

      setVideoUri(res.uri);
      setProcessedVideoUrl(null); // Reset URL
      setHasWatermark(null);

      const formData = new FormData();
      formData.append('video', {
        uri: res.uri.startsWith('content://') ? res.uri : `file://${res.uri}`,
        name: res.name,
        type: res.type,
      });

      setLoading(true);
      console.log("Uploading video...");

      const { data } = await axios.post('http://192.168.1.14:5001/api/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("Video uploaded, response data:", data);

      const processRes = await axios.get(`http://192.168.1.14:5001/api/videos/process/${data.filename}`);

      console.log("Processed video response:", processRes.data);

      if (processRes.data.processedFilePath) {
        const processedVideoPath = `http://192.168.1.14:5001/video/${processRes.data.processedFilePath.split('/').pop()}`;
        console.log('Processed Video Path:', processedVideoPath);

        setProcessedVideoUrl(processedVideoPath); // Set the URL
        setHasWatermark(true);
      } else {
        setHasWatermark(false);
      }
    } catch (err) {
      console.error("Error during video processing:", err);
      setVideoError('Error processing the video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openProcessedVideo = () => {
    if (processedVideoUrl) {
      Linking.openURL(processedVideoUrl);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickVideo} style={styles.button}>
        <Text style={styles.buttonText}>Select Video</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#4e84c7" style={styles.loadingIndicator} />}

      {videoError && (
        <Text style={styles.errorText}>
          {videoError}
        </Text>
      )}

      {hasWatermark !== null && (
        <Text style={styles.watermarkText}>
          Watermark Detected: {hasWatermark ? 'Yes' : 'No'}
        </Text>
      )}

      {processedVideoUrl && (
        <TouchableOpacity onPress={openProcessedVideo} style={styles.button}>
          <Text style={styles.buttonText}>Open Processed Video</Text>
        </TouchableOpacity>
      )}

      {/* Optionally show original video */}
      {videoUri && !loading && !processedVideoUrl && (
        <Text style={styles.videoText}>Original Video Selected</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  button: {
    backgroundColor: '#4e84c7',
    width: width - 40,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  watermarkText: {
    marginBottom: 20,
    fontSize: 16,
    color: 'green',
  },
  videoText:{
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
});

export default App;