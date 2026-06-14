import { Text } from "react-native";
import { useResource } from "../hooks/useResource";
import { listAnnouncementsForProfile } from "../lib/erp";
import { formatDateTimeLabel } from "../lib/date";
import { useSession } from "../providers/session";
import { Card, EmptyCard, ErrorCard, LoadingCard, Pill, Screen, SectionListItem } from "../components/ui";
import { Stagger } from "../components/motion";

export function AnnouncementsScreen() {
  const { profile } = useSession();
  const resource = useResource(async () => {
    if (!profile) {
      return [];
    }

    return listAnnouncementsForProfile(profile);
  }, [profile?.userId, profile?.regionId, profile?.centreId]);

  return (
    <Screen title="Circulars" subtitle="Approved notices available for your current CLS Academy scope.">
      {resource.loading ? (
        <LoadingCard label="Loading circulars..." />
      ) : resource.error ? (
        <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
      ) : !resource.data || resource.data.length === 0 ? (
        <EmptyCard title="No circulars" message="There are no approved notices for your current role and centre yet." />
      ) : (
        <Stagger>
          {resource.data.map((announcement) => (
            <Card
              key={announcement.id}
              title={announcement.title}
              subtitle={`${announcement.createdByName} · ${formatDateTimeLabel(announcement.createdAtIso)}`}
              right={<Pill label={announcement.status} tone={announcement.status === "approved" ? "success" : "warning"} />}
            >
              <Text style={{ color: "#334155", lineHeight: 22 }}>{announcement.message}</Text>
              <SectionListItem
                title={announcement.audienceScope === "all" ? "All Students" : announcement.centreName || announcement.regionName || "Scoped audience"}
                meta={`Scope: ${announcement.audienceScope}`}
              />
            </Card>
          ))}
        </Stagger>
      )}
    </Screen>
  );
}
