import { useLocalSearchParams } from "expo-router";
import { StaffDetailScreen } from "../../../src/screens/StaffDetailScreen";

export default function StaffDetailRoute() {
  const { userId, name, teacherId, className, centreName } = useLocalSearchParams<{
    userId: string;
    name: string;
    teacherId: string;
    className: string;
    centreName: string;
  }>();

  return (
    <StaffDetailScreen
      userId={userId ?? ""}
      name={name ?? "Staff"}
      teacherId={teacherId ?? ""}
      className={className ?? ""}
      centreName={centreName ?? ""}
    />
  );
}
