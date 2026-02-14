import React from "react";
import { IconType } from "react-icons/lib";
import { Card } from "../ui/card";

type SummaryCardProps = {
  label: string;
  value: number;
  icon: IconType;
  color: string;
};

const SummayCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
}) => {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className="text-2xl" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
};

export default SummayCard;
