// Animation utilities and spring constants generated with Motion MCP
// These provide natural, physics-based animations throughout the application

/**
 * Spring animation presets with optimized timing functions
 * Generated using Motion MCP for natural, smooth animations
 */
export const springs = {
  // Quick interactions (buttons, hover states)
  quick: '300ms linear(0, 0.2348, 0.6075, 0.8763, 1.0076, 1.0451, 1.0389, 1.0217, 1.0079, 1.0006, 0.9981, 0.9981, 0.9988, 0.9995, 1)',
  
  // Medium interactions (dialogs, cards, navigation)
  medium: '350ms linear(0, 0.3772, 0.8604, 1.0738, 1.0846, 1.0353, 1.0006, 0.991, 0.9941, 0.9985, 1.0006, 1)',
  
  // Slow interactions (page transitions, complex animations)
  slow: '450ms linear(0, 0.2348, 0.6075, 0.8763, 1.0076, 1.0451, 1.0389, 1.0217, 1.0079, 1.0006, 0.9981, 0.9981, 0.9988, 0.9995, 1)',
  
  // Bounce effect for success states and special interactions
  bounce: '800ms linear(0, 0.0012, 0.0048, 0.0109, 0.0194, 0.0303, 0.0436, 0.0594, 0.0776, 0.0982, 0.1212, 0.1466, 0.1745, 0.2048, 0.2375, 0.2726, 0.3102, 0.3502, 0.3926, 0.4374, 0.4847, 0.5344, 0.5865, 0.641, 0.698, 0.7573, 0.8191, 0.8834, 0.95, 0.9906, 0.9577, 0.9271, 0.8991, 0.8734, 0.8501, 0.8293, 0.8109, 0.795, 0.7814, 0.7703, 0.7616, 0.7553, 0.7514, 0.75, 0.751, 0.7544, 0.7603, 0.7685, 0.7792, 0.7923, 0.8078, 0.8258, 0.8462, 0.869, 0.8942, 0.9219, 0.9519, 0.9844, 0.9909, 0.976, 0.9635, 0.9535, 0.9459, 0.9407, 0.938, 0.9377, 0.9398, 0.9443, 0.9512, 0.9606, 0.9724, 0.9866, 0.9985, 0.9914, 0.9868, 0.9846, 0.9848, 0.9874, 0.9925, 1)'
} as const

/**
 * Animation classes that can be added to Tailwind CSS config
 * These provide ready-to-use animation classes for common UI patterns
 */
export const animations = {
  // Button interactions
  'button-press': 'transform scale-95 transition-transform ' + springs.quick,
  'button-hover': 'transform scale-105 transition-transform ' + springs.quick,
  
  // Card interactions
  'card-hover': 'transform translateY(-4px) transition-all ' + springs.medium,
  'card-enter': 'transform scale-100 opacity-100 transition-all ' + springs.medium,
  
  // Dialog animations
  'dialog-enter': 'transform scale-100 opacity-100 transition-all ' + springs.medium,
  'dialog-exit': 'transform scale-95 opacity-0 transition-all ' + springs.quick,
  
  // Progress animations
  'progress-fill': 'width transition-all ' + springs.slow,
  
  // Menu animations
  'menu-expand': 'height opacity transition-all ' + springs.medium,
  'menu-slide': 'transform translateX(0) transition-transform ' + springs.medium,
  
  // Form feedback
  'field-focus': 'border-color box-shadow transition-all ' + springs.quick,
  'success-bounce': 'transform scale-110 transition-transform ' + springs.bounce,
  
  // Stagger delays for sequential animations
  'stagger-1': 'animation-delay: 100ms',
  'stagger-2': 'animation-delay: 200ms',
  'stagger-3': 'animation-delay: 300ms',
  'stagger-4': 'animation-delay: 400ms',
} as const

/**
 * Utility function to create staggered animations
 * @param index - The index of the element in the sequence
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @returns Animation delay style
 */
export const staggerDelay = (index: number, baseDelay: number = 100): string => {
  return `${index * baseDelay}ms`
}

/**
 * Animation variants for different states
 */
export const variants = {
  // Card states
  card: {
    default: 'transform-gpu transition-all duration-300 ease-out',
    hover: 'transform-gpu -translate-y-1 shadow-lg transition-all ' + springs.medium,
    active: 'transform-gpu scale-95 transition-all ' + springs.quick,
  },
  
  // Button states
  button: {
    default: 'transform-gpu transition-all duration-200 ease-out',
    hover: 'transform-gpu scale-105 transition-all ' + springs.quick,
    active: 'transform-gpu scale-95 transition-all ' + springs.quick,
  },
  
  // Dialog states
  dialog: {
    closed: 'transform-gpu scale-95 opacity-0 transition-all ' + springs.quick,
    open: 'transform-gpu scale-100 opacity-100 transition-all ' + springs.medium,
  },
  
  // List item states
  listItem: {
    hidden: 'transform-gpu translate-y-4 opacity-0 transition-all ' + springs.medium,
    visible: 'transform-gpu translate-y-0 opacity-100 transition-all ' + springs.medium,
  },
  
  // Form states
  field: {
    default: 'transition-all duration-200 ease-out',
    focus: 'ring-2 ring-primary/20 border-primary transition-all ' + springs.quick,
    error: 'ring-2 ring-red-500/20 border-red-500 transition-all ' + springs.quick,
    success: 'ring-2 ring-green-500/20 border-green-500 transition-all ' + springs.bounce,
  },
  
  // Navigation states
  nav: {
    closed: 'transform-gpu -translate-x-full transition-transform ' + springs.medium,
    open: 'transform-gpu translate-x-0 transition-transform ' + springs.medium,
  },
} as const

/**
 * Utility function to check if user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Utility function to conditionally apply animations based on user preferences
 * @param animationClass - The animation class to apply
 * @param fallbackClass - The fallback class for reduced motion (optional)
 * @returns The appropriate class based on user preferences
 */
export const conditionalAnimation = (
  animationClass: string, 
  fallbackClass?: string
): string => {
  if (prefersReducedMotion()) {
    return fallbackClass || ''
  }
  return animationClass
}

/**
 * Common keyframe animations for complex effects
 */
export const keyframes = {
  // Pulse effect for loading states
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  
  // Shake effect for error states
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
  `,
  
  // Fade in up effect for entrance animations
  fadeInUp: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  
  // Scale in effect for modals
  scaleIn: `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
} as const

/**
 * Animation configuration for common UI patterns
 */
export const config = {
  // Entrance animations for page components
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, easing: springs.medium },
  },
  
  // Exit animations for page components
  pageExit: {
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, easing: springs.quick },
  },
  
  // Stagger configuration for lists
  stagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, easing: springs.medium },
    },
  },
} as const