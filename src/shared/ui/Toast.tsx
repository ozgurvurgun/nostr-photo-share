import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StillHaptics} from '../haptics/haptics';
import {useTheme} from '../theme/ThemeProvider';
import type {Theme} from '../theme/types';

export type ToastTone = 'info' | 'success' | 'error';

export type ToastShowOptions = {
  readonly tone?: ToastTone;
  readonly durationMs?: number;
};

type ToastItem = {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly durationMs: number;
};

type ToastContextValue = {
  readonly show: (message: string, options?: ToastShowOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 2800;

export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: string, options?: ToastShowOptions) => {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return;
    }
    const tone = options?.tone ?? 'info';
    if (tone === 'error') {
      StillHaptics.error();
    }
    seq.current += 1;
    setToast({
      id: seq.current,
      message: trimmed,
      tone,
      durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    });
  }, []);

  const value = useMemo(() => ({show}), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} onDismiss={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

function ToastHost({
  toast,
  onDismiss,
}: {
  readonly toast: ToastItem | null;
  readonly onDismiss: () => void;
}): React.JSX.Element | null {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(theme, insets.bottom),
    [theme, insets.bottom],
  );
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const animateOut = useCallback(() => {
    clearHideTimer();
    opacity.value = withTiming(0, {duration: theme.motion.duration.short}, finished => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
    translateY.value = withTiming(12, {duration: theme.motion.duration.short});
  }, [clearHideTimer, onDismiss, opacity, theme.motion.duration.short, translateY]);

  useEffect(() => {
    if (toast === null) {
      return;
    }
    clearHideTimer();
    opacity.value = withTiming(1, {duration: theme.motion.duration.short});
    translateY.value = withTiming(0, {duration: theme.motion.duration.short});
    hideTimer.current = setTimeout(() => {
      animateOut();
    }, toast.durationMs);
    return clearHideTimer;
  }, [
    animateOut,
    clearHideTimer,
    opacity,
    theme.motion.duration.short,
    toast,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  if (toast === null) {
    return null;
  }

  const toneStyle =
    toast.tone === 'success'
      ? styles.success
      : toast.tone === 'error'
        ? styles.error
        : styles.info;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Animated.View style={[styles.toast, toneStyle, animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={toast.message}
          onPress={animateOut}
          style={styles.press}>
          <Text style={styles.message} numberOfLines={3}>
            {toast.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createStyles(theme: Theme, insetBottom: number) {
  return StyleSheet.create({
    host: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenEdge,
      paddingBottom: Math.max(insetBottom, theme.spacing.md) + theme.spacing.lg,
      zIndex: 1000,
      elevation: 1000,
    },
    toast: {
      maxWidth: 420,
      width: '100%',
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      ...theme.elevation.raised,
    },
    press: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
    },
    message: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      fontWeight: '500',
      textAlign: 'center',
    },
    info: {
      backgroundColor: theme.colors.background.elevated,
      borderColor: theme.colors.border.default,
    },
    success: {
      backgroundColor: theme.colors.background.elevated,
      borderColor: theme.colors.state.success,
    },
    error: {
      backgroundColor: theme.colors.background.elevated,
      borderColor: theme.colors.state.error,
    },
  });
}
