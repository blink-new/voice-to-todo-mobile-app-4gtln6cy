import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff } from 'lucide-react-native';
import blink from '@/lib/blink';
import { useTheme } from '@/contexts/ThemeContext';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const { colors } = useTheme();
  
  // Animation values for waveform
  const waveAnimations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.5),
    new Animated.Value(0.7),
    new Animated.Value(0.4),
    new Animated.Value(0.6),
  ]).current;

  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Start waveform animation
      const animations = waveAnimations.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 300 + index * 100,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 300 + index * 100,
              useNativeDriver: false,
            }),
          ])
        )
      );
      
      Animated.parallel(animations).start();
      
      // Scale animation for recording button
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animations
      waveAnimations.forEach(anim => anim.stopAnimation());
      scaleAnimation.stopAnimation();
      scaleAnimation.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        try {
          // Use Blink AI for transcription with the audio file URI
          const { text } = await blink.ai.transcribeAudio({
            audio: uri,
            language: 'en'
          });
          
          if (text.trim()) {
            onTranscriptionComplete(text.trim());
          } else {
            Alert.alert('No speech detected', 'Please try recording again with clearer speech.');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          Alert.alert('Transcription failed', 'Could not convert speech to text. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setRecording(null);
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginBottom: 24,
      height: 64,
    },
    waveformBar: {
      width: 4,
      backgroundColor: colors.primary,
      marginHorizontal: 2,
      borderRadius: 2,
    },
    recordButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    loadingSpinner: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: 'white',
      borderTopColor: 'transparent',
      borderRadius: 12,
    },
    statusText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Waveform Animation */}
      {isRecording && (
        <View style={styles.waveformContainer}>
          {waveAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 64],
                  }),
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Recording Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isProcessing}
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording 
                ? colors.error 
                : isProcessing 
                  ? colors.textSecondary 
                  : colors.primary
            }
          ]}
        >
          {isProcessing ? (
            <View style={styles.loadingSpinner} />
          ) : isRecording ? (
            <MicOff size={32} color="white" />
          ) : (
            <Mic size={32} color="white" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {isProcessing 
          ? 'Converting speech to text...' 
          : isRecording 
            ? 'Tap to stop recording' 
            : 'Tap to record a task'
        }
      </Text>
    </View>
  );
}

