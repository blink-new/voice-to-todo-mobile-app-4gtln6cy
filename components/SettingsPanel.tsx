import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  StyleSheet,
  Switch,
  Modal 
} from 'react-native';
import { 
  X, 
  Settings, 
  Key, 
  Sparkles, 
  Save, 
  Eye, 
  EyeOff,
  Info,
  ArrowLeft
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoSuggestTags, setAutoSuggestTags] = useState(true);
  const [smartDeadlines, setSmartDeadlines] = useState(true);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem('gemini_api_key');
      const savedAiEnabled = await AsyncStorage.getItem('ai_enabled');
      const savedAutoSuggestTags = await AsyncStorage.getItem('auto_suggest_tags');
      const savedSmartDeadlines = await AsyncStorage.getItem('smart_deadlines');

      if (savedApiKey) setGeminiApiKey(savedApiKey);
      if (savedAiEnabled !== null) setAiEnabled(JSON.parse(savedAiEnabled));
      if (savedAutoSuggestTags !== null) setAutoSuggestTags(JSON.parse(savedAutoSuggestTags));
      if (savedSmartDeadlines !== null) setSmartDeadlines(JSON.parse(savedSmartDeadlines));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('gemini_api_key', geminiApiKey);
      await AsyncStorage.setItem('ai_enabled', JSON.stringify(aiEnabled));
      await AsyncStorage.setItem('auto_suggest_tags', JSON.stringify(autoSuggestTags));
      await AsyncStorage.setItem('smart_deadlines', JSON.stringify(smartDeadlines));
      
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = () => {
    if (!geminiApiKey.trim()) {
      Alert.alert('Error', 'Please enter your Gemini API key');
      return false;
    }
    if (!geminiApiKey.startsWith('AIza')) {
      Alert.alert('Error', 'Invalid Gemini API key format. It should start with "AIza"');
      return false;
    }
    return true;
  };

  const testApiKey = async () => {
    if (!validateApiKey()) return;

    setLoading(true);
    try {
      // Test the API key with a simple request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hello' }]
            }]
          })
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'API key is valid and working!');
      } else {
        Alert.alert('Error', 'Invalid API key or API error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test API key');
    } finally {
      setLoading(false);
    }
  };

  const showApiKeyInfo = () => {
    Alert.alert(
      'Gemini API Key',
      'To get your free Gemini API key:\n\n' +
      '1. Visit https://makersuite.google.com/app/apikey\n' +
      '2. Sign in with your Google account\n' +
      '3. Click "Create API Key"\n' +
      '4. Copy the key and paste it here\n\n' +
      'This enables AI features like:\n' +
      '• Smart task suggestions\n' +
      '• Auto tag recommendations\n' +
      '• Intelligent deadline suggestions\n' +
      '• Task priority analysis',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: 50,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: 8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    inputButton: {
      padding: 10,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    infoButton: {
      marginLeft: 8,
      padding: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontWeight: '600',
      marginLeft: 6,
    },
    primaryButtonText: {
      color: 'white',
    },
    secondaryButtonText: {
      color: colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingLabel: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ArrowLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>Settings</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Theme Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Settings size={20} color={colors.text} style={styles.sectionIcon} />
                Appearance
              </Text>
              <View style={styles.card}>
                <ThemeToggle />
              </View>
            </View>

            {/* AI Features Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Sparkles size={20} color={colors.text} style={styles.sectionIcon} />
                AI Features
              </Text>
              
              <View style={styles.card}>
                <View style={styles.inputLabel}>
                  <Key size={16} color={colors.text} />
                  <Text style={{ color: colors.text, marginLeft: 6, fontWeight: '500' }}>
                    Gemini API Key
                  </Text>
                  <TouchableOpacity onPress={showApiKeyInfo} style={styles.infoButton}>
                    <Info size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    value={geminiApiKey}
                    onChangeText={setGeminiApiKey}
                    placeholder="Enter your Gemini API key"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowApiKey(!showApiKey)}
                    style={styles.inputButton}
                  >
                    {showApiKey ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={testApiKey}
                    disabled={loading || !geminiApiKey.trim()}
                    style={[
                      styles.button,
                      styles.secondaryButton,
                      (!geminiApiKey.trim() || loading) && { opacity: 0.5 }
                    ]}
                  >
                    <Sparkles size={16} color={colors.text} />
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                      Test API Key
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingTitle}>Enable AI Features</Text>
                    <Text style={styles.settingDescription}>
                      Use AI for smart suggestions and analysis
                    </Text>
                  </View>
                  <Switch
                    value={aiEnabled}
                    onValueChange={setAiEnabled}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={aiEnabled ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingTitle}>Auto-suggest Tags</Text>
                    <Text style={styles.settingDescription}>
                      Automatically suggest relevant tags for new tasks
                    </Text>
                  </View>
                  <Switch
                    value={autoSuggestTags}
                    onValueChange={setAutoSuggestTags}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={autoSuggestTags ? colors.primary : colors.textSecondary}
                    disabled={!aiEnabled}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingTitle}>Smart Deadlines</Text>
                    <Text style={styles.settingDescription}>
                      AI-powered deadline suggestions based on task content
                    </Text>
                  </View>
                  <Switch
                    value={smartDeadlines}
                    onValueChange={setSmartDeadlines}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={smartDeadlines ? colors.primary : colors.textSecondary}
                    disabled={!aiEnabled}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveSettings}
              disabled={loading}
              style={[
                styles.saveButton,
                loading && styles.saveButtonDisabled
              ]}
            >
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}