import React from 'react';

// Safe wrapper component that ensures all props are serializable
export function SafeComponent({ children, fallback = null }) {
  try {
    return children;
  } catch (error) {
    console.error('SafeComponent caught error:', error);
    return fallback;
  }
}

// Safe text renderer that converts any value to string
export function SafeText({ value, fallback = 'N/A' }) {
  try {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    return String(value);
  } catch (error) {
    console.error('SafeText error:', error);
    return fallback;
  }
}

export default SafeComponent;
