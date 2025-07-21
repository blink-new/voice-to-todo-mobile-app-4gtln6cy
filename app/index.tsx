import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl,
  Alert,
  Animated,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, Plus, Settings } from 'lucide-react-native';
import blink from '@/lib/blink';
import VoiceRecorder from '@/components/VoiceRecorder';
import TaskItem from '@/components/TaskItem';
import TextInput from '@/components/TextInput';
import InputToggle, { InputMode } from '@/components/InputToggle';
import ThemeToggle from '@/components/ThemeToggle';
import TaskStats from '@/components/TaskStats';
import { useTheme } from '@/contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  completed: string | number;
  deadline?: string;
  created_at: string;
  user_id: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [showSettings, setShowSettings] = useState(false);
  const { colors, isDark } = useTheme();

  // Animation for new task creation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user && !state.isLoading) {
        loadTasks();
      }
      setLoading(state.isLoading);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (showSettings) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSettings]);

  const loadTasks = async () => {
    try {
      const userTasks = await blink.db.tasks.list({
        where: { user_id: user?.id },
        orderBy: { created_at: 'desc' },
      });
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const createTask = async (text: string) => {
    if (!user) return;

    setIsCreatingTask(true);
    
    // Animate new task creation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        title: text,
        completed: "0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await blink.db.tasks.create(newTask);
      await loadTasks();
      
      // Reset animation
      setTimeout(() => {
        fadeAnim.setValue(0);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    createTask(text);
  };

  const handleTextSubmit = (text: string) => {
    createTask(text);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingSpinner: {
      width: 32,
      height: 32,
      borderWidth: 2,
      borderColor: colors.primary,
      borderTopColor: 'transparent',
      borderRadius: 16,
    },
    loadingText: {
      color: colors.textSecondary,
      marginTop: 16,
      fontSize: 16,
    },
    authContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    authTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 24,
      textAlign: 'center',
    },
    authSubtitle: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 24,
      fontSize: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      marginTop: 4,
      fontSize: 16,
    },
    settingsButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsPanel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 24,
      paddingVertical: 16,
      zIndex: 1000,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    settingsPanelTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    successBanner: {
      marginHorizontal: 24,
      marginBottom: 16,
      backgroundColor: colors.success + '20',
      borderWidth: 1,
      borderColor: colors.success + '40',
      borderRadius: 16,
      padding: 16,
    },
    successContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    successText: {
      color: colors.success,
      marginLeft: 8,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 24,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    emptyTitle: {
      color: colors.textSecondary,
      fontSize: 20,
      marginTop: 16,
      textAlign: 'center',
      fontWeight: '600',
    },
    emptySubtitle: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 24,
      fontSize: 16,
      opacity: 0.8,
    },
    tasksContainer: {
      paddingBottom: 24,
    },
    taskSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      paddingTop: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputToggleContainer: {
      marginBottom: 16,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.authContainer}>
          <CheckCircle size={80} color={colors.primary} />
          <Text style={styles.authTitle}>Voice Todo</Text>
          <Text style={styles.authSubtitle}>
            Please sign in to start capturing your tasks with voice and text
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedTasks = tasks.filter(task => Number(task.completed) > 0);
  const pendingTasks = tasks.filter(task => Number(task.completed) === 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Settings Panel */}
      {showSettings && (
        <Animated.View 
          style={[
            styles.settingsPanel,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.settingsPanelTitle}>Settings</Text>
          <ThemeToggle />
        </Animated.View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Voice Todo</Text>
          <Text style={styles.headerSubtitle}>
            Hey {user.email?.split('@')[0]}! {pendingTasks.length} tasks pending
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettings(!showSettings)}
          style={styles.settingsButton}
        >
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Task Creation Success Animation */}
      {isCreatingTask && (
        <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
          <View style={styles.successContent}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={styles.successText}>Task created successfully!</Text>
          </View>
        </Animated.View>
      )}

      {/* Task Statistics */}
      <TaskStats 
        totalTasks={tasks.length}
        completedTasks={completedTasks.length}
        pendingTasks={pendingTasks.length}
      />

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Plus size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              Use voice or text input below to create your first task
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>
                  To Do ({pendingTasks.length})
                </Text>
                {pendingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={loadTasks}
                  />
                ))}
              </View>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View style={styles.taskSection}>
                <Text style={styles.sectionTitle}>
                  Completed ({completedTasks.length})
                </Text>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={loadTasks}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Input Mode Toggle */}
        <View style={styles.inputToggleContainer}>
          <InputToggle mode={inputMode} onModeChange={setInputMode} />
        </View>

        {/* Voice or Text Input */}
        {inputMode === 'voice' ? (
          <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
        ) : (
          <TextInput 
            onSubmit={handleTextSubmit}
            placeholder="Type a new task..."
            disabled={isCreatingTask}
          />
        )}
      </View>
    </SafeAreaView>
  );
}