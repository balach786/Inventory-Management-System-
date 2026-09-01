import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, footer, onClick, ...props }) => {
  return (
    <div
      className={`card ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || action) && (
        <div className="card-header">
          <div className="card-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export const CardsGrid = ({ children, className = '', cols = 4 }) => {
  return (
    <div className={`cards-grid grid-cols-${cols} ${className}`}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';
export default Card;