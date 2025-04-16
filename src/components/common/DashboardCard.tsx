
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface DashboardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard = ({ title, description, value, icon, trend }: DashboardCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="w-4 h-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`text-xs mt-1 ${
            trend.isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
