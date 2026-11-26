import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { DataLoadStatus } from "@/components/DataLoadStatus";
import { FormGroup } from "@/components/FormGroup";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  AnalyticsEvents,
  trackAppEvent,
  useTrackScreenView,
} from "@/lib/analytics";
import {
  deleteApiV1SharesById,
  deleteApiV1SharesInvitesById,
  getApiV1CardsOptions,
  getApiV1CardsQueryKey,
  getApiV1SharesIncomingOptions,
  getApiV1SharesIncomingQueryKey,
  getApiV1SharesOutgoingOptions,
  getApiV1SharesOutgoingQueryKey,
} from "@/lib/api-client";
import { resolveCardHeadings } from "@/lib/cardHeadings";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { showShareCardSheet } from "@/sheets";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type Row = {
  id: string;
  email: string;
  what: string;
  actionLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  run: () => Promise<unknown>;
};

const ShareRow = ({ row, showDivider }: { row: Row; showDivider: boolean }) => {
  const { t } = useTranslation(I18nNamespace.Sharing);
  const { theme } = useTheme();

  const confirm = () =>
    Alert.alert(row.confirmTitle, row.confirmMessage, [
      { text: t("keep"), style: "cancel" },
      {
        text: row.actionLabel,
        style: "destructive",
        onPress: () => {
          row.run().catch((err: unknown) => {
            Alert.alert(t("actionErrorTitle"), getErrorMessage(err));
          });
        },
      },
    ]);

  return (
    <View
      style={[
        styles.row,
        showDivider && [styles.rowDivider, { borderTopColor: theme.border }],
      ]}
    >
      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={[typography.body, { color: theme.textPrimary }]}
        >
          {row.email}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>
          {row.what}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.actionLabel}, ${row.email}`}
        onPress={confirm}
      >
        <Text style={[typography.bodySemibold, { color: theme.error }]}>
          {row.actionLabel}
        </Text>
      </Pressable>
    </View>
  );
};

const Section = ({
  label,
  rows,
  emptyText,
}: {
  label: string;
  rows: Row[];
  emptyText: string;
}) => {
  const { theme } = useTheme();
  return (
    <FormGroup label={label}>
      {rows.length === 0 ? (
        <Text style={[typography.body, { color: theme.textSecondary }]}>
          {emptyText}
        </Text>
      ) : (
        <View
          style={[
            styles.list,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          {rows.map((row, index) => (
            <ShareRow key={row.id} row={row} showDivider={index > 0} />
          ))}
        </View>
      )}
    </FormGroup>
  );
};

export const SharingScreen = () => {
  const { t } = useTranslation(I18nNamespace.Sharing);
  useTrackScreenView(Routes.SHARING, { title: "Sharing Screen" });
  const queryClient = useQueryClient();

  const outgoing = useQuery(getApiV1SharesOutgoingOptions());
  const incoming = useQuery(getApiV1SharesIncomingOptions());
  // Card names for card shares. Shared and owned cards are both in this list.
  const cards = useQuery(getApiV1CardsOptions());

  /** "All cards", or the card name. */
  const what = ({
    scope,
    cardId,
  }: {
    scope: string;
    cardId: string | null;
  }) => {
    if (scope === "account") return t("allCards");
    const card = cards.data?.find((c) => c.id === cardId);
    if (!card) return t("oneCard");
    return resolveCardHeadings(card.brand?.name ?? "", card.label ?? "").title;
  };

  const refresh = () =>
    Promise.all(
      [
        getApiV1SharesOutgoingQueryKey(),
        getApiV1SharesIncomingQueryKey(),
        getApiV1CardsQueryKey(),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const stopShare = async (id: string, role: "owner" | "recipient") => {
    await deleteApiV1SharesById({ path: { id }, throwOnError: true });
    void trackAppEvent(AnalyticsEvents.SHARE_STOP, { role });
    await refresh();
  };

  const cancelInvite = async (id: string) => {
    await deleteApiV1SharesInvitesById({ path: { id }, throwOnError: true });
    void trackAppEvent(AnalyticsEvents.SHARE_INVITE_CANCEL);
    await refresh();
  };

  const sharedByYou: Row[] = [
    ...(outgoing.data?.shares ?? []).map((share) => ({
      id: share.id,
      email: share.email,
      what: what(share),
      actionLabel: t("stopSharing"),
      confirmTitle: t("stopSharingTitle"),
      confirmMessage: t("stopSharingMessage", { email: share.email }),
      run: () => stopShare(share.id, "owner"),
    })),
    ...(outgoing.data?.invites ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      what: t("invitePending", { what: what(invite) }),
      actionLabel: t("cancelInvite"),
      confirmTitle: t("cancelInviteTitle"),
      confirmMessage: t("cancelInviteMessage", { email: invite.email }),
      run: () => cancelInvite(invite.id),
    })),
  ];

  const sharedWithYou: Row[] = (incoming.data ?? []).map((share) => ({
    id: share.id,
    email: share.email,
    what: what(share),
    actionLabel: t("leave"),
    confirmTitle: t("leaveTitle"),
    confirmMessage: t("leaveMessage", { email: share.email }),
    run: () => stopShare(share.id, "recipient"),
  }));

  const failed = outgoing.error ?? incoming.error;

  return (
    <ScreenShell
      footer={
        <View style={styles.footer}>
          <Button
            title={t("shareAllCards")}
            onPress={() => void showShareCardSheet()}
          />
        </View>
      }
    >
      <ScreenShell.Body>
        <ScreenHeader title={t("title")} actions={<CloseButton />} embedded />
        <DataLoadStatus
          error={failed ? getErrorMessage(failed) : null}
          loaded={outgoing.isSuccess && incoming.isSuccess}
          loadingLabel={t("loading")}
        >
          <View style={styles.sections}>
            <Section
              label={t("sharedByYou")}
              rows={sharedByYou}
              emptyText={t("nothingSharedByYou")}
            />
            <Section
              label={t("sharedWithYou")}
              rows={sharedWithYou}
              emptyText={t("nothingSharedWithYou")}
            />
          </View>
        </DataLoadStatus>
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  sections: {
    gap: spacing.lg,
  },
  list: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  rowDivider: {
    borderTopWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
