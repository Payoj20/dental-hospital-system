import { Badge } from "../ui/badge";

type Status =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

const STATUS_STYLES: Record<Status, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  CHECKED_IN: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  NO_SHOW: "bg-orange-100 text-orange-700 border-orange-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={`font-medium tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
