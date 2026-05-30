// ============================================
// UI STATE — Estado de la interfaz de usuario
// ============================================

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  createdAt: number;
}

export interface UIState {
  // Modales
  activeModal: string | null;
  modalQueue: string[];
  
  // Toasts
  toasts: ToastNotification[];
  
  // Transiciones
  isTransitioning: boolean;
  transitionType: 'fade' | 'slide' | 'none';
  
  // Screens
  currentScreen: string;
  previousScreen: string;
  
  // HUD
  hudVisible: boolean;
  hudScoreVisible: boolean;
  hudComboVisible: boolean;
  hudTimerVisible: boolean;
  
  // Loading
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  
  // Feedback
  screenShakeIntensity: number;
  screenShakeDuration: number;
  timeDilationActive: boolean;
  timeDilationScale: number;
  
  // Debug
  debugPanelVisible: boolean;
  showFpsCounter: boolean;
}

export function createInitialUIState(): UIState {
  return {
    activeModal: null,
    modalQueue: [],
    toasts: [],
    isTransitioning: false,
    transitionType: 'fade',
    currentScreen: 'boot',
    previousScreen: '',
    hudVisible: true,
    hudScoreVisible: true,
    hudComboVisible: true,
    hudTimerVisible: true,
    isLoading: false,
    loadingMessage: '',
    loadingProgress: 0,
    screenShakeIntensity: 0,
    screenShakeDuration: 0,
    timeDilationActive: false,
    timeDilationScale: 1,
    debugPanelVisible: false,
    showFpsCounter: true,
  };
}

// Toast helpers
let toastIdCounter = 0;

export function createToast(
  message: string,
  type: ToastNotification['type'] = 'info',
  duration = 3000
): ToastNotification {
  return {
    id: `toast_${toastIdCounter++}`,
    message,
    type,
    duration,
    createdAt: Date.now(),
  };
}

export function isToastExpired(toast: ToastNotification): boolean {
  return Date.now() - toast.createdAt > toast.duration;
}
