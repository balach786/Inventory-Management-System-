import React from 'react';

export const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="table-responsive">
      <table className={`table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

Table.displayName = 'Table';
export default Table;