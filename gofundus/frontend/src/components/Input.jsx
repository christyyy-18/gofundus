import React from 'react';

/**
 * Shared Input component.
 * Uses inline-styles that inherit from global CSS variables / tokens.
 */
const Input = ({ label, type = 'text', value, onChange, required = false, placeholder = '' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
    {label && (
      <label
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      style={{
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        border: '1.5px solid var(--color-border)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontSize: '0.875rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.15s',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
    />
  </div>
);

export default Input;
