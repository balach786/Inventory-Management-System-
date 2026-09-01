import React from 'react';

export const TableCell = ({ children, className = '', isHeader = false, ...props }) => {
  if (isHeader) {
    return (
      <th className={`table-cell table-header-cell ${className}`} {...props}>
        {children}
      </th>
    );
  }

  return (
    <td className={`table-cell ${className}`} {...props}>
      {children}
    </td>
  );
};

TableCell.displayName = 'TableCell';
export default TableCell;