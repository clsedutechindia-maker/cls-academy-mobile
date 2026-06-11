import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { formatScheduleDateLabel } from "../../shared";

// --- value <-> Date helpers ---

export function dateValueToDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  return new Date();
}

export function dateToValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeValueToDate(value: string): Date {
  const date = new Date();
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(":").map(Number);
    date.setHours(hour ?? 0, minute ?? 0, 0, 0);
  }
  return date;
}

export function timeToValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatTimeLabel(value: string): string {
  if (!/^\d{2}:\d{2}$/.test(value)) return "Select time";
  const [hour, minute] = value.split(":").map(Number);
  const ampm = (hour ?? 0) >= 12 ? "PM" : "AM";
  const display = (hour ?? 0) % 12 || 12;
  return `${display}:${String(minute ?? 0).padStart(2, "0")} ${ampm}`;
}

// --- Field label ---

export function FieldLabel({ children }: { children: string }) {
  return <Text style={kit.fieldLabel}>{children}</Text>;
}

// --- Dropdown trigger (opens a sheet) ---

export function DropdownButton({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  const empty = !value;
  return (
    <AnimatedPressable style={kit.dropdownBtn} onPress={onPress}>
      <Text style={[kit.dropdownText, { color: empty ? D.outline : D.onSurface }]} numberOfLines={1}>
        {empty ? placeholder : value}
      </Text>
      <Ionicons name="chevron-down" size={16} color={D.outline} />
    </AnimatedPressable>
  );
}

// --- Bottom-sheet option picker ---

export type SheetOption = { key: string; label: string };

export function OptionSheet({
  visible,
  title,
  options,
  selectedKey,
  emptyText,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selectedKey: string;
  emptyText?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={kit.modalOverlay} onPress={onClose}>
        <View style={kit.modalSheet}>
          <Text style={kit.modalTitle}>{title}</Text>
          {options.length === 0 ? (
            <Text style={kit.modalEmpty}>{emptyText ?? "No options available."}</Text>
          ) : (
            options.map((option) => {
              const active = option.key === selectedKey;
              return (
                <Pressable
                  key={option.key}
                  style={[kit.modalOption, active && kit.modalOptionActive]}
                  onPress={() => {
                    onSelect(option.key);
                    onClose();
                  }}
                >
                  <Text style={[kit.modalOptionText, active && { color: D.primary, fontFamily: D.fontBold }]}>
                    {option.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={D.primary} />}
                </Pressable>
              );
            })
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// --- Date picker field (native on device, text fallback on web) ---

export function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <TextInput
        style={kit.dropdownBtn}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={D.outline}
        autoCapitalize="none"
      />
    );
  }

  return (
    <>
      <AnimatedPressable style={kit.dropdownBtn} onPress={() => setShow(true)}>
        <Text style={[kit.dropdownText, { color: value ? D.onSurface : D.outline }]}>
          {value ? formatScheduleDateLabel(value) : "Select date"}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={D.outline} />
      </AnimatedPressable>
      {show && (
        <DateTimePicker
          value={dateValueToDate(value)}
          mode="date"
          onChange={(event, selected) => {
            setShow(false);
            if (event.type === "set" && selected) onChange(dateToValue(selected));
          }}
        />
      )}
    </>
  );
}

// --- Time picker field (native on device, text fallback on web) ---

export function TimeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <TextInput
        style={kit.dropdownBtn}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={D.outline}
        autoCapitalize="none"
      />
    );
  }

  return (
    <>
      <AnimatedPressable style={kit.dropdownBtn} onPress={() => setShow(true)}>
        <Text style={[kit.dropdownText, { color: value ? D.onSurface : D.outline }]}>{formatTimeLabel(value)}</Text>
        <Ionicons name="time-outline" size={16} color={D.outline} />
      </AnimatedPressable>
      {show && (
        <DateTimePicker
          value={timeValueToDate(value)}
          mode="time"
          onChange={(event, selected) => {
            setShow(false);
            if (event.type === "set" && selected) onChange(timeToValue(selected));
          }}
        />
      )}
    </>
  );
}

// --- Bottom action bar (cancel + save, optional delete) ---

export function EditorActionBar({
  onCancel,
  onSave,
  onDelete,
  saving,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <View style={kit.actionBar}>
      {onDelete ? (
        <AnimatedPressable style={kit.deleteBtn} onPress={onDelete} disabled={saving}>
          <Ionicons name="trash-outline" size={18} color={D.error} />
        </AnimatedPressable>
      ) : (
        <AnimatedPressable style={kit.cancelBtn} onPress={onCancel}>
          <Text style={kit.cancelText}>Cancel</Text>
        </AnimatedPressable>
      )}
      <AnimatedPressable style={[kit.saveBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
        <Ionicons name="checkmark" size={17} color="#fff" />
        <Text style={kit.saveText}>{saving ? "Saving…" : saveLabel}</Text>
      </AnimatedPressable>
    </View>
  );
}

export const kit = StyleSheet.create({
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  classBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18, padding: 12, borderRadius: 14, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  classBannerText: { flex: 1, fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.primary, letterSpacing: -0.1 },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  dropdownBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, gap: 8 },
  dropdownText: { flex: 1, fontSize: 13, fontFamily: D.fontMedium, letterSpacing: -0.2 },
  row: { flexDirection: "row", gap: 10 },
  dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  dayChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  dayChipText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  dayChipTextActive: { color: D.primary },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 96, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  deleteBtn: { width: 54, height: 54, borderRadius: 20, backgroundColor: D.errorBg, borderWidth: 1.5, borderColor: D.errorBg, alignItems: "center", justifyContent: "center" },
  saveBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  saveText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalEmpty: { fontSize: 13, fontFamily: D.font, color: D.outline, paddingVertical: 12 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
