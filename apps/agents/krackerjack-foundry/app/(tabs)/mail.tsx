// KRACKERJACK AI — AgentMail Command Center
// Hive Email Intelligence Layer

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useAlert } from '@/template';
import {
  createInbox,
  listInboxes,
  sendEmail,
  listEmails,
  deleteEmail,
  loadInboxConfig,
  clearInboxConfig,
  AgentMailInbox,
  AgentMailEmail,
} from '@/services/agentMailService';

type MailTab = 'inbox' | 'compose' | 'setup';

export default function AgentMailScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<MailTab>('inbox');
  const [inbox, setInbox] = useState<AgentMailInbox | null>(null);
  const [emails, setEmails] = useState<AgentMailEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Compose form
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Setup form
  const [username, setUsername] = useState('');
  const [creatingInbox, setCreatingInbox] = useState(false);

  // Load inbox config on mount
  useEffect(() => {
    loadInboxConfig().then(cfg => {
      if (cfg) {
        setInbox(cfg);
        fetchEmails(cfg.id);
      } else {
        setActiveTab('setup');
      }
    });
  }, []);

  const fetchEmails = useCallback(async (inboxId: string, showLoader = true) => {
    if (showLoader) setRefreshing(true);
    const { emails: fetched, error } = await listEmails(inboxId);
    if (error) {
      showAlert('AgentMail Error', error);
    } else {
      setEmails(fetched);
    }
    setRefreshing(false);
  }, []);

  const handleCreateInbox = async () => {
    setCreatingInbox(true);
    const { inbox: created, error } = await createInbox(username.trim() || undefined);
    setCreatingInbox(false);
    if (error || !created) {
      showAlert('Failed to create inbox', error ?? 'Unknown error');
      return;
    }
    setInbox(created);
    setActiveTab('inbox');
    showAlert('Inbox Created', `Address: ${created.address}\n\nKRACKERJACK AI is now reachable via email.`);
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      showAlert('Missing Fields', 'To, subject, and body are required.');
      return;
    }
    if (!inbox) {
      showAlert('No Inbox', 'Set up an inbox first before sending.');
      return;
    }
    setComposeSending(true);
    const { success, error } = await sendEmail({
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      from_inbox_id: inbox.id,
    });
    setComposeSending(false);
    if (error) {
      showAlert('Send Failed', error);
    } else {
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setActiveTab('inbox');
      showAlert('Sent', 'Message transmitted through AgentMail.');
    }
  };

  const handleDelete = async (emailId: string) => {
    showAlert('Delete Email', 'Remove this message from the inbox?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (!inbox) return;
          const { error } = await deleteEmail(emailId, inbox.id);
          if (error) { showAlert('Error', error); return; }
          setEmails(prev => prev.filter(e => e.id !== emailId));
        }
      },
    ]);
  };

  const handleDisconnect = async () => {
    showAlert('Disconnect Inbox', 'Remove inbox from this device? (The inbox still exists on AgentMail)', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await clearInboxConfig();
          setInbox(null);
          setEmails([]);
          setActiveTab('setup');
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="email" size={18} color="#34d399" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AGENTMAIL</Text>
            <Text style={styles.headerSub}>
              {inbox ? `${inbox.address}` : 'NO INBOX CONFIGURED'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {inbox ? (
            <Pressable
              style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
              onPress={() => inbox && fetchEmails(inbox.id)}
            >
              {refreshing
                ? <ActivityIndicator size="small" color="#34d399" />
                : <MaterialIcons name="refresh" size={18} color="#34d399" />}
            </Pressable>
          ) : null}
          <View style={[styles.statusDot, { backgroundColor: inbox ? '#34d399' : Colors.textMuted }]} />
          <Text style={[styles.statusText, { color: inbox ? '#34d399' : Colors.textMuted }]}>
            {inbox ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'inbox', label: 'INBOX', icon: 'inbox' },
          { key: 'compose', label: 'COMPOSE', icon: 'edit' },
          { key: 'setup', label: 'SETUP', icon: 'settings' },
        ] as { key: MailTab; label: string; icon: any }[]).map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}>
              <MaterialIcons name={tab.icon} size={13} color={isActive ? '#34d399' : Colors.textMuted} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── INBOX TAB ──────────────────────────────────────────────── */}
          {activeTab === 'inbox' ? (
            <View style={styles.tabContent}>
              {!inbox ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="mail-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>NO INBOX CONFIGURED</Text>
                  <Text style={styles.emptyText}>Go to SETUP to create an AgentMail inbox.</Text>
                  <Pressable style={styles.emptyBtn} onPress={() => setActiveTab('setup')}>
                    <Text style={styles.emptyBtnText}>SETUP INBOX</Text>
                  </Pressable>
                </View>
              ) : refreshing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#34d399" />
                  <Text style={styles.loadingText}>Fetching Hive messages...</Text>
                </View>
              ) : emails.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="all-inbox" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>INBOX CLEAR</Text>
                  <Text style={styles.emptyText}>No messages received yet.</Text>
                  <Pressable style={styles.emptyBtn} onPress={() => fetchEmails(inbox.id)}>
                    <Text style={styles.emptyBtnText}>REFRESH</Text>
                  </Pressable>
                </View>
              ) : (
                emails.map(email => (
                  <View key={email.id} style={styles.emailCard}>
                    <View style={styles.emailHeader}>
                      <View style={styles.emailFrom}>
                        <View style={styles.emailAvatar}>
                          <MaterialIcons name="person" size={14} color="#34d399" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.emailFromText} numberOfLines={1}>{email.from || '(unknown sender)'}</Text>
                          <Text style={styles.emailDate}>
                            {new Date(email.received_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={() => handleDelete(email.id)} hitSlop={8}>
                        <MaterialIcons name="delete-outline" size={16} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                    <Text style={styles.emailSubject}>{email.subject}</Text>
                    <Text style={styles.emailBody} numberOfLines={4}>{email.body}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {/* ── COMPOSE TAB ────────────────────────────────────────────── */}
          {activeTab === 'compose' ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📤 COMPOSE MESSAGE</Text>
                {!inbox ? (
                  <View style={[styles.warnBanner]}>
                    <MaterialIcons name="warning" size={13} color={Colors.accent} />
                    <Text style={styles.warnText}>No inbox configured — set up in SETUP tab first.</Text>
                  </View>
                ) : (
                  <View style={styles.fromRow}>
                    <MaterialIcons name="mail" size={13} color="#34d399" />
                    <Text style={styles.fromText}>FROM: {inbox.address}</Text>
                  </View>
                )}
                <Text style={styles.fieldLabel}>TO</Text>
                <TextInput style={styles.input} value={composeTo} onChangeText={setComposeTo}
                  placeholder="recipient@example.com" placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none" keyboardType="email-address" />
                <Text style={styles.fieldLabel}>SUBJECT</Text>
                <TextInput style={styles.input} value={composeSubject} onChangeText={setComposeSubject}
                  placeholder="Message subject..." placeholderTextColor={Colors.textMuted} />
                <Text style={styles.fieldLabel}>MESSAGE</Text>
                <TextInput style={[styles.textArea]} value={composeBody} onChangeText={setComposeBody}
                  placeholder="Write your message..." placeholderTextColor={Colors.textMuted}
                  multiline textAlignVertical="top" />
                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: '#34d399' },
                    (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending) && { opacity: 0.4 }
                  ]}
                  onPress={handleSend}
                  disabled={!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending}
                >
                  {composeSending
                    ? <ActivityIndicator size="small" color="#000" />
                    : <MaterialIcons name="send" size={15} color="#000" />}
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>
                    {composeSending ? 'TRANSMITTING...' : 'SEND VIA AGENTMAIL'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* ── SETUP TAB ──────────────────────────────────────────────── */}
          {activeTab === 'setup' ? (
            <View style={styles.tabContent}>
              {/* Current inbox info */}
              {inbox ? (
                <View style={[styles.inboxCard]}>
                  <View style={styles.inboxCardHeader}>
                    <MaterialIcons name="check-circle" size={16} color="#34d399" />
                    <Text style={styles.inboxCardTitle}>INBOX ACTIVE</Text>
                  </View>
                  <View style={styles.inboxRow}>
                    <Text style={styles.inboxLabel}>ADDRESS</Text>
                    <Text style={styles.inboxValue} selectable>{inbox.address}</Text>
                  </View>
                  <View style={styles.inboxRow}>
                    <Text style={styles.inboxLabel}>INBOX ID</Text>
                    <Text style={styles.inboxValue} selectable numberOfLines={1}>{inbox.id}</Text>
                  </View>
                  <View style={styles.inboxRow}>
                    <Text style={styles.inboxLabel}>CREATED</Text>
                    <Text style={styles.inboxValue}>{new Date(inbox.created_at).toLocaleString()}</Text>
                  </View>
                  <Pressable style={[styles.actionBtn, { backgroundColor: Colors.danger, marginTop: Spacing.md }]}
                    onPress={handleDisconnect}>
                    <MaterialIcons name="link-off" size={14} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>DISCONNECT INBOX</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Create new inbox */}
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📬 CREATE AGENTMAIL INBOX</Text>
                <Text style={styles.setupInfo}>
                  AgentMail gives KRACKERJACK AI a real email address. Messages received will appear in the INBOX tab. The AI can send outbound emails from this address.
                </Text>
                <Text style={styles.fieldLabel}>USERNAME (optional)</Text>
                <TextInput style={styles.input} value={username} onChangeText={setUsername}
                  placeholder="krackerjack1134 (or leave blank for random)"
                  placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                <Text style={styles.fieldHint}>Final address will be: {username.trim() || 'random'}@[agentmail domain]</Text>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#34d399' }, creatingInbox && { opacity: 0.5 }]}
                  onPress={handleCreateInbox}
                  disabled={creatingInbox}
                >
                  {creatingInbox
                    ? <ActivityIndicator size="small" color="#000" />
                    : <MaterialIcons name="add-circle" size={15} color="#000" />}
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>
                    {creatingInbox ? 'CREATING...' : 'CREATE HIVE INBOX'}
                  </Text>
                </Pressable>
              </View>

              {/* Info block */}
              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="shield" size={14} color="#34d399" />
                  <Text style={styles.infoText}>API key is server-side only — never exposed to client</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="hub" size={14} color="#34d399" />
                  <Text style={styles.infoText}>Emails route through counsel edge function proxy</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="memory" size={14} color="#34d399" />
                  <Text style={styles.infoText}>Inbox config stored locally — disconnect anytime</Text>
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: '#0a1a12', borderWidth: 1, borderColor: '#1a5a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: '#34d399', letterSpacing: 2 },
  headerSub: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshBtn: { padding: 4, marginRight: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#34d399' },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  tabLabelActive: { color: '#34d399' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  tabContent: { gap: Spacing.sm },
  loadingBox: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.sm, color: Colors.textWhite, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  emptyText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#34d399', borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: 4,
  },
  emptyBtnText: { fontSize: FontSize.xs, color: '#000', fontWeight: FontWeight.black, letterSpacing: 1 },
  emailCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#34d399',
  },
  emailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emailFrom: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  emailAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#0a1a12', borderWidth: 1, borderColor: '#34d39944',
    alignItems: 'center', justifyContent: 'center',
  },
  emailFromText: { fontSize: FontSize.xs, color: Colors.textWhite, fontWeight: FontWeight.medium },
  emailDate: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  emailSubject: {
    fontSize: FontSize.sm, color: '#34d399', fontWeight: FontWeight.bold,
    letterSpacing: 0.5, marginBottom: 6,
  },
  emailBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  panel: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  panelTitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.md,
  },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent + '44',
    borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  warnText: { fontSize: FontSize.xs, color: Colors.accent, flex: 1 },
  fromRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0a1a12', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  fromText: { fontSize: FontSize.xs, color: '#34d399', fontWeight: FontWeight.medium },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 8 },
  fieldHint: { fontSize: 10, color: Colors.textMuted, marginBottom: 4, fontStyle: 'italic' },
  input: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, marginBottom: 4,
  },
  textArea: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, minHeight: 120, lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm,
  },
  actionBtnText: { fontSize: FontSize.sm, color: '#000', fontWeight: FontWeight.black, letterSpacing: 1 },
  inboxCard: {
    backgroundColor: '#0a1a12', borderWidth: 1, borderColor: '#1a5a2a',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  inboxCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  inboxCardTitle: { fontSize: FontSize.sm, color: '#34d399', fontWeight: FontWeight.black, letterSpacing: 1.5 },
  inboxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  inboxLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1, marginTop: 2 },
  inboxValue: { fontSize: FontSize.xs, color: Colors.textWhite, flex: 1, textAlign: 'right' },
  setupInfo: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 17, marginBottom: Spacing.sm },
  infoBlock: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, lineHeight: 16 },
});
