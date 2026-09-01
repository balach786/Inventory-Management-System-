import React from 'react';

export const Button = ({
  children,
  className = '',
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, success, ghost, icon
  size = 'md', // sm, md, lg
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) => {
  const variantClass = variant ? `btn-${variant}` : '';
  const sizeClass = size ? `btn-${size}` : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className} ${loading ? 'btn-loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        <>
          {Icon && <Icon className="btn-icon-prefix" size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

Button.displayName = 'Button';
export default Button;