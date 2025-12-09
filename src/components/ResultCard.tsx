import { ReactNode } from 'react';

interface ResultCardProps<T> {
  title: string;
  icon: ReactNode;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
}

export function ResultCard<T>({ title, icon, items, emptyMessage, renderItem }: ResultCardProps<T>) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <span className="ml-auto bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-slate-50 rounded-lg text-center">
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
