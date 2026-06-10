import { useLocalSearchParams } from "expo-router";
import { StudentDetailScreen } from "../../../src/screens/StudentDetailScreen";

export default function StudentDetailRoute() {
  const { userId, name, className, studentId, centreName } = useLocalSearchParams<{
    userId: string;
    name: string;
    className: string;
    studentId: string;
    centreName: string;
  }>();

  return (
    <StudentDetailScreen
      userId={userId ?? ""}
      name={name ?? "Student"}
      className={className ?? ""}
      studentId={studentId ?? ""}
      centreName={centreName ?? ""}
    />
  );
}
