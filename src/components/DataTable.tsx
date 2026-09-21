import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyText?: string;
}

export default function DataTable<T>({ columns, data, rowKey, emptyTitle = 'Nothing here yet', emptyText = 'Records will appear here once they are available.' }: DataTableProps<T>) {
  if (!data.length) {
    return <div className="empty-state"><div className="empty-icon">◇</div><h3>{emptyTitle}</h3><p>{emptyText}</p></div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column.key} className={column.className}>{column.header}</th>)}</tr></thead>
        <tbody>{data.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
