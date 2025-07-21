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
import { CheckCircle, Plus, Settings, Menu, Tag as TagIcon } from 'lucide-react-native';
import blink from '@/lib/blink';
import VoiceRecorder from '@/components/VoiceRecorder';
import TaskItem from '@/components/TaskItem';
import TextInput from '@/components/TextInput';
import InputToggle, { InputMode } from '@/components/InputToggle';
import TaskStats from '@/components/TaskStats';
import Sidebar, { FilterType } from '@/components/Sidebar';
import TagManager from '@/components/TagManager';
import SettingsPanel from '@/components/SettingsPanel';
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
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const { colors, isDark } = useTheme();

  // Animation for new task creation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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
    applyFilter();
  }, [tasks, currentFilter]);

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

  const applyFilter = async () => {
    let filtered = [...tasks];

    switch (currentFilter) {
      case 'all':
        // No filtering needed
        break;
      case 'pending':
        filtered = tasks.filter(task => Number(task.completed) === 0);
        break;
      case 'completed':
        filtered = tasks.filter(task => Number(task.completed) > 0);
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = tasks.filter(task => {
          if (!task.deadline) return false;
          return new Date(task.deadline).toDateString() === today;
        });
        break;
      case 'overdue':
        const now = new Date();
        filtered = tasks.filter(task => {
          if (!task.deadline || Number(task.completed) > 0) return false;
          return new Date(task.deadline) < now;
        });
        break;
      default:
        if (typeof currentFilter === 'object' && currentFilter.type === 'tag') {
          try {
            // Get tasks with this tag
            const taskTags = await blink.db.taskTags.list({
              where: { tag_id: currentFilter.tagId }
            });
            const taskIds = taskTags.map(tt => tt.task_id);
            filtered = tasks.filter(task => taskIds.includes(task.id));
          } catch (error) {
            console.error('Error filtering by tag:', error);
          }
        }
        break;
    }

    setFilteredTasks(filtered);
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

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  const getFilterTitle = () => {
    switch (currentFilter) {
      case 'all': return 'All Tasks';
      case 'pending': return 'Pending Tasks';
      case 'completed': return 'Completed Tasks';
      case 'today': return 'Due Today';
      case 'overdue': return 'Overdue Tasks';
      default:
        if (typeof currentFilter === 'object' && currentFilter.type === 'tag') {
          return `#${currentFilter.tagName}`;
        }
        return 'Tasks';
    }
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuButton: {
      padding: 8,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      marginTop: 2,
      fontSize: 14,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    successBanner: {
      marginHorizontal: 20,
      marginVertical: 12,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
      borderRadius: 12,
      padding: 12,
    },
    successContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successText: {
      color: colors.primary,
      marginLeft: 8,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    statsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    tasksContainer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    inputContainer: {
      paddingHorizontal: 20,
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
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setShowSidebar(true)}
            style={styles.menuButton}
          >
            <Menu size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{getFilterTitle()}</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTasks.length} tasks • {pendingTasks.length} pending
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowTagManager(true)}
            style={styles.headerButton}
          >
            <TagIcon size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.headerButton}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Creation Success Animation */}
      {isCreatingTask && (
        <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
          <View style={styles.successContent}>
            <CheckCircle size={16} color={colors.primary} />
            <Text style={styles.successText}>Task created successfully!</Text>
          </View>
        </Animated.View>
      )}

      {/* Task Statistics */}
      <View style={styles.statsContainer}>
        <TaskStats 
          totalTasks={tasks.length}
          completedTasks={completedTasks.length}
          pendingTasks={pendingTasks.length}
        />
      </View>

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
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Plus size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {currentFilter === 'all' ? 'No tasks yet' : 'No tasks found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {currentFilter === 'all' 
                ? 'Use voice or text input below to create your first task'
                : 'Try adjusting your filter or create a new task'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            <Text style={styles.sectionTitle}>
              {getFilterTitle()} ({filteredTasks.length})
            </Text>
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={loadTasks}
              />
            ))}
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

      {/* Sidebar */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNavigate={handleFilterChange}
        currentFilter={currentFilter}
      />

      {/* Tag Manager */}
      <TagManager
        visible={showTagManager}
        onClose={() => setShowTagManager(false)}
        mode="manage"
      />

      {/* Settings Panel */}
      <SettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}