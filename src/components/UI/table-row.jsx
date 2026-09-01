import React from 'react';

export const TableRow = ({ children, className = '', onClick, ...props }) => {
  return (
    <tr
      className={`table-row ${onClick ? 'table-row-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
};

TableRow.displayName = 'TableRow';
export default TableRow;