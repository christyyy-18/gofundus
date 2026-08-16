import React from 'react';
import './Button.css';

const Button = ({ children, type = 'button', disabled = false, onClick }) => (
  <button type={type} disabled={disabled} onClick={onClick} className="button">
    {children}
  </button>
);

export default Button;
