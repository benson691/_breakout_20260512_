/**
 * Game Constants for Breakout
 */

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 16;
export const PADDLE_BOTTOM_MARGIN = 40;
export const PADDLE_SPEED = 10;

export const BALL_RADIUS = 8;
export const BALL_SPEED_START = 5;

export const BRICK_ROWS = 8;
export const BRICK_COLS = 8;
export const BRICK_PADDING = 10;
export const BRICK_OFFSET_TOP = 40;
export const BRICK_OFFSET_LEFT = 15;
export const BRICK_HEIGHT = 20;
export const BRICK_WIDTH = 85;

export const COLORS = {
  BACKGROUND: '#020617', // slate-950 roughly
  CANVAS_GRADIENT_START: '#0f172a',
  CANVAS_GRADIENT_END: '#020617',
  PADDLE: '#10b981', // Emerald-500
  BALL: '#FFFFFF',
  BRICKS: [
    '#f43f5e', // Rose-500
    '#ec4899', // Pink-500
    '#d946ef', // Fuchsia-500
    '#a855f7', // Purple-500
    '#8b5cf6', // Violet-500
    '#6366f1', // Indigo-500
    '#3b82f6', // Blue-500
    '#0ea5e9', // Sky-500
  ],
  TEXT: '#e2e8f0', // slate-200
  OVERLAY: 'rgba(2, 6, 23, 0.8)',
};

export const INITIAL_LIVES = 3;
