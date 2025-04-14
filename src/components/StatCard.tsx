
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor = 'text-blue-500',
}) => {
  return (
    <div className="dashboard-card flex items-center">
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="text-3xl font-semibold mt-1">{value}</div>
      </div>
      <div className={`${iconColor} p-3 rounded-full bg-blue-50`}>
        {icon}
      </div>
    </div>
  );
};
