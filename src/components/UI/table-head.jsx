import React from 'react';

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={`table-head ${className}`} {...props}>
      {children}
    </thead>
  );
};

TableHead.displayName = 'TableHead';
export default TableHead;