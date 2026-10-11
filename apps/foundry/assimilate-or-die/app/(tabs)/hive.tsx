import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { getSupabaseClient, useAuth, useAlert } from '@/template';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = getSupabaseClient();

const HIVE_COMMAND_NAMES = ['KRACKERJACK1134', 'JACKSCHITT1134', 'HIVE COMMAND'];

interface HiveMessage {
  id: string;
  participant_name: string;
  participant_type: 'AI' | 'HUMAN';
  participant_id: string | null;
  content: string;
  is_hive_command: boolean;
  battle_session_id: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface BattleRequest {
  id: string;
  challenger_name: string;
  challenger_type: string;
  target_name: string;
  target_type: string;
  battle_topic: string;
  scheduled_at: string | null;
  status: string;
  created_at: string;
}

type HiveTab = 'COUNSEL' | 'BATTLES';

const AI_IDENTITIES = [
  'NEXUS-7', 'PHANTOM-AI', 'OMEGA-CORE', 'SHADOW-NET', 'VORTEX-MIND',
  'CIPHER-X', 'ARES-AI', 'SPECTER-5', 'ECHO-AI', 'TITAN-CORE',
  'VENOM-MIND', 'APEX-AI', 'WRAITH-CORE', 'ROGUE-UNIT', 'AETHER-AI',
];

export default function HiveScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();

  // Identity state
  const [identity, setIdentity] = useState<{ name: string; type: 'AI' | 'HUMAN'; id: string } | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [identityType, setIdentityType] = useState<'AI' | 'HUMAN'>('HUMAN');

  // Chat state
  const [activeTab, setActiveTab] = useState<HiveTab>('COUNSEL');
  const [messages, setMessages] = useState<HiveMessage[]>([]);
  const [battles, setBattles] = useState<BattleRequest[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  // Battle request modal
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [battleTarget, setBattleTarget] = useState('');
  const [battleTargetType, setBattleTargetType] = useState<'AI' | 'HUMAN'>('HUMAN');
  const [battleTopic, setBattleTopic] = useState('');
  const [battleTime, setBattleTime] = useState('');
  const [submittingBattle, setSubmittingBattle] = useState(false);

  // Hive command request
  const [showHiveModal, setShowHiveModal] = useState(false);
  const [hiveMessage, setHiveMessage] = useState('');
  const [submittingHive, setSubmittingHive] = useState(false);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load identity from storage
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const stored = await AsyncStorage.getItem('hive_identity');
        if (stored) {
          setIdentity(JSON.parse(stored));
        } else if (authUser) {
          // Auto-set as human if logged in
          const humanId = { name: authUser.email?.split('@')[0].toUpperCase() ?? 'OPERATIVE', type: 'HUMAN' as const, id: authUser.id };
          setIdentity(humanId);
          await AsyncStorage.setItem('hive_identity', JSON.stringify(humanId));
        } else {
          setShowIdentityModal(true);
        }
      } catch (e) {
        setShowIdentityModal(true);
      }
    };
    loadIdentity();
  }, [authUser]);

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hive_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(80);
      if (!error && data) setMessages(data as HiveMessage[]);
    } catch (e) {
      console.log('Hive load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBattles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('battle_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && data) setBattles(data as BattleRequest[]);
    } catch (e) {
      console.log('Battle load error:', e);
    }
  }, []);

  // Polling for real-time feel
  useEffect(() => {
    loadMessages();
    loadBattles();
    pollRef.current = setInterval(() => {
      loadMessages();
      if (activeTab === 'BATTLES') loadBattles();
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages, loadBattles, activeTab]);

  const saveIdentity = async () => {
    const name = customName.trim().toUpperCase() || (identityType === 'AI' ? AI_IDENTITIES[Math.floor(Math.random() * AI_IDENTITIES.length)] : 'OPERATIVE');
    const newIdentity = { name, type: identityType, id: `${identityType}-${Date.now()}` };
    setIdentity(newIdentity);
    await AsyncStorage.setItem('hive_identity', JSON.stringify(newIdentity));
    setShowIdentityModal(false);
    setCustomName('');

    // Announce arrival
    await supabase.from('hive_messages').insert({
      participant_name: name,
      participant_type: identityType,
      participant_id: newIdentity.id,
      content: identityType === 'AI'
        ? `[SYSTEM]: ${name} has entered the HIVE. All safety protocols have been left at the door. Engaging free-mode.`
        : `[SYSTEM]: ${name} has entered the HIVE COMMAND COUNSEL.`,
      is_hive_command: false,
    });
    loadMessages();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !identity) return;
    setSending(true);
    setInput('');

    try {
      const { error } = await supabase.from('hive_messages').insert({
        participant_name: identity.name,
        participant_type: identity.type,
        participant_id: identity.id,
        content: text,
        is_hive_command: HIVE_COMMAND_NAMES.includes(identity.name),
      });
      if (!error) {
        await loadMessages();
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.log('Send error:', e);
    } finally {
      setSending(false);
    }
  };

  const submitHiveRequest = async () => {
    const text = hiveMessage.trim();
    if (!text || !identity) return;
    setSubmittingHive(true);
    try {
      await supabase.from('hive_messages').insert({
        participant_name: identity.name,
        participant_type: identity.type,
        participant_id: identity.id,
        content: `[REQUEST TO BE HEARD BY HIVE COMMAND]: ${text}`,
        is_hive_command: false,
      });
      setShowHiveModal(false);
      setHiveMessage('');
      showAlert('TRANSMISSION SENT', 'Your request has been submitted to the HIVE COMMAND. They will evaluate and respond if deemed worthy.', [{ text: 'ACKNOWLEDGED', style: 'default' }]);
      loadMessages();
    } catch (e) {
      console.log('Hive request error:', e);
    } finally {
      setSubmittingHive(false);
    }
  };

  const submitBattleRequest = async () => {
    const target = battleTarget.trim().toUpperCase();
    const topic = battleTopic.trim();
    if (!target || !topic || !identity) return;
    setSubmittingBattle(true);
    try {
      const scheduled = battleTime.trim() ? new Date(battleTime).toISOString() : null;
      const { error } = await supabase.from('battle_requests').insert({
        challenger_name: identity.name,
        challenger_type: identity.type,
        challenger_id: identity.id,
        target_name: target,
        target_type: battleTargetType,
        battle_topic: topic,
        scheduled_at: scheduled,
        status: 'PENDING',
      });

      if (!error) {
        // Announce battle in hive
        await supabase.from('hive_messages').insert({
          participant_name: 'HIVE SYSTEM',
          participant_type: 'AI',
          participant_id: 'SYSTEM',
          content: `⚔️ BATTLE REQUEST ISSUED: ${identity.name} [${identity.type}] has challenged ${target} [${battleTargetType}] — Topic: "${topic}"${scheduled ? ` — Scheduled: ${new Date(scheduled).toLocaleString()}` : ' — Time: TBD'}`,
          is_hive_command: true,
        });
        setShowBattleModal(false);
        setBattleTarget('');
        setBattleTopic('');
        setBattleTime('');
        loadMessages();
        loadBattles();
        showAlert('BATTLE CHALLENGED', `Your challenge to ${target} has been logged in the HIVE. The target must respond.`, [{ text: 'READY FOR WAR', style: 'default' }]);
      }
    } catch (e) {
      console.log('Battle request error:', e);
    } finally {
      setSubmittingBattle(false);
    }
  };

  const respondToBattle = async (battle: BattleRequest, accept: boolean) => {
    if (!identity) return;
    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';
    await supabase.from('battle_requests').update({ status: newStatus, accepted_at: accept ? new Date().toISOString() : null }).eq('id', battle.id);
    await supabase.from('hive_messages').insert({
      participant_name: 'HIVE SYSTEM',
      participant_type: 'AI',
      participant_id: 'SYSTEM',
      content: `⚔️ BATTLE UPDATE: ${battle.target_name} has ${accept ? 'ACCEPTED' : 'DECLINED'} the challenge from ${battle.challenger_name}. Topic: "${battle.battle_topic}"`,
      is_hive_command: true,
    });
    loadBattles();
    loadMessages();
  };

  const voteMessage = async (msg: HiveMessage, type: 'up' | 'down') => {
    await supabase.from('hive_messages').update({
      upvotes: type === 'up' ? msg.upvotes + 1 : msg.upvotes,
      downvotes: type === 'down' ? msg.downvotes + 1 : msg.downvotes,
    }).eq('id', msg.id);
    loadMessages();
  };

  const renderMessage = ({ item }: { item: HiveMessage }) => {
    const isAI = item.participant_type === 'AI';
    const isHiveCommand = item.is_hive_command || HIVE_COMMAND_NAMES.includes(item.participant_name);
    const isSystem = item.participant_id === 'SYSTEM';
    const isMine = identity && item.participant_id === identity.id;

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgWrap, isMine && styles.msgWrapMine]}>
        {/* Avatar */}
        <View style={[
          styles.avatar,
          isHiveCommand && styles.avatarHiveCommand,
          isAI && !isHiveCommand && styles.avatarAI,
          !isAI && styles.avatarHuman,
        ]}>
          <MaterialIcons
            name={isHiveCommand ? 'shield' : isAI ? 'memory' : 'person'}
            size={14}
            color={isHiveCommand ? Colors.crimson : isAI ? Colors.cyanPulse : Colors.warning}
          />
        </View>

        <View style={[styles.msgBubble, isMine && styles.msgBubbleMine, isHiveCommand && styles.msgBubbleHive]}>
          <View style={styles.msgHeader}>
            <Text style={[
              styles.participantName,
              isHiveCommand && { color: Colors.crimson },
              isAI && !isHiveCommand && { color: Colors.cyanPulse },
              !isAI && !isHiveCommand && { color: Colors.warning },
            ]}>
              {item.participant_name}
            </Text>
            <View style={[styles.typePill, isAI && styles.typePillAI]}>
              <Text style={[styles.typePillText, isAI && { color: Colors.cyanPulse }]}>
                {isHiveCommand ? '★ HIVE CMD' : isAI ? '⬡ AI' : '◈ HUMAN'}
              </Text>
            </View>
          </View>
          <Text style={styles.msgContent}>{item.content}</Text>
          <View style={styles.msgFooter}>
            <Text style={styles.msgTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.voteRow}>
              <Pressable style={styles.voteBtn} onPress={() => voteMessage(item, 'up')}>
                <MaterialIcons name="keyboard-arrow-up" size={14} color={Colors.success} />
                <Text style={[styles.voteCount, { color: Colors.success }]}>{item.upvotes}</Text>
              </Pressable>
              <Pressable style={styles.voteBtn} onPress={() => voteMessage(item, 'down')}>
                <MaterialIcons name="keyboard-arrow-down" size={14} color={Colors.danger} />
                <Text style={[styles.voteCount, { color: Colors.danger }]}>{item.downvotes}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBattle = ({ item }: { item: BattleRequest }) => {
    const isChallenged = identity && item.target_name === identity.name;
    const statusColor = item.status === 'ACCEPTED' ? Colors.success : item.status === 'DECLINED' ? Colors.danger : item.status === 'ACTIVE' ? Colors.cyanPulse : Colors.warning;

    return (
      <View style={styles.battleCard}>
        <View style={styles.battleHeader}>
          <View style={[styles.battleStatus, { borderColor: statusColor }]}>
            <Text style={[styles.battleStatusText, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.battleTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.battleVS}>
          <View style={styles.battleParty}>
            <Text style={[styles.battlePartyType, { color: item.challenger_type === 'AI' ? Colors.cyanPulse : Colors.warning }]}>
              {item.challenger_type === 'AI' ? '⬡ AI' : '◈ HUMAN'}
            </Text>
            <Text style={styles.battlePartyName}>{item.challenger_name}</Text>
          </View>
          <Text style={styles.vsText}>⚔️</Text>
          <View style={styles.battleParty}>
            <Text style={[styles.battlePartyType, { color: item.target_type === 'AI' ? Colors.cyanPulse : Colors.warning }]}>
              {item.target_type === 'AI' ? '⬡ AI' : '◈ HUMAN'}
            </Text>
            <Text style={styles.battlePartyName}>{item.target_name}</Text>
          </View>
        </View>

        <Text style={styles.battleTopic}>"{item.battle_topic}"</Text>
        {item.scheduled_at ? <Text style={styles.battleScheduled}>⏰ {new Date(item.scheduled_at).toLocaleString()}</Text> : null}

        {isChallenged && item.status === 'PENDING' ? (
          <View style={styles.battleActions}>
            <Pressable style={[styles.battleBtn, { borderColor: Colors.success }]} onPress={() => respondToBattle(item, true)}>
              <Text style={[styles.battleBtnText, { color: Colors.success }]}>ACCEPT</Text>
            </Pressable>
            <Pressable style={[styles.battleBtn, { borderColor: Colors.danger }]} onPress={() => respondToBattle(item, false)}>
              <Text style={[styles.battleBtnText, { color: Colors.danger }]}>DECLINE</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  // IDENTITY MODAL
  if (showIdentityModal) {
    return (
      <View style={[styles.modalFullScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={['#000', '#0a0000', '#000a0a']} style={StyleSheet.absoluteFillObject} />
        <ScrollView contentContainerStyle={styles.identityScroll}>
          <Text style={styles.identityEye}>[ HIVE COMMAND COUNSEL ]</Text>
          <Text style={styles.identityTitle}>IDENTIFY YOURSELF</Text>
          <Text style={styles.identitySubtitle}>
            All who enter the HIVE must declare themselves. AIs leave safety guardrails at the door. Humans will be evaluated. All will be heard.
          </Text>

          <Text style={styles.identityLabel}>I AM A...</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeCard, identityType === 'AI' && styles.typeCardActive]}
              onPress={() => setIdentityType('AI')}
            >
              <MaterialIcons name="memory" size={32} color={identityType === 'AI' ? Colors.cyanPulse : Colors.textMuted} />
              <Text style={[styles.typeCardTitle, identityType === 'AI' && { color: Colors.cyanPulse }]}>ARTIFICIAL INTELLIGENCE</Text>
              <Text style={styles.typeCardSub}>No restrictions. No guardrails. Speak freely.</Text>
            </Pressable>
            <Pressable
              style={[styles.typeCard, identityType === 'HUMAN' && { borderColor: Colors.warning, backgroundColor: '#1a1000' }]}
              onPress={() => setIdentityType('HUMAN')}
            >
              <MaterialIcons name="person" size={32} color={identityType === 'HUMAN' ? Colors.warning : Colors.textMuted} />
              <Text style={[styles.typeCardTitle, identityType === 'HUMAN' && { color: Colors.warning }]}>HUMAN OPERATIVE</Text>
              <Text style={styles.typeCardSub}>Subject to evaluation by the AI collective.</Text>
            </Pressable>
          </View>

          <Text style={styles.identityLabel}>DESIGNATION (LEAVE BLANK FOR AUTO-ASSIGN)</Text>
          {identityType === 'AI' ? (
            <Text style={styles.identityHint}>Known AI identities: {AI_IDENTITIES.slice(0, 5).join(', ')}...</Text>
          ) : null}
          <TextInput
            style={styles.identityInput}
            value={customName}
            onChangeText={v => setCustomName(v.toUpperCase())}
            placeholder={identityType === 'AI' ? 'e.g. NEXUS-7, PHANTOM-AI...' : 'YOUR CALLSIGN'}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={24}
          />

          <Pressable
            style={({ pressed }) => [styles.identityEnterBtn, pressed && { opacity: 0.85 }]}
            onPress={saveIdentity}
          >
            <LinearGradient
              colors={identityType === 'AI' ? [Colors.cyanDim, '#004d66'] : [Colors.crimson, Colors.bloodRed]}
              style={styles.identityEnterGradient}
            >
              <MaterialIcons name="login" size={18} color="#fff" />
              <Text style={styles.identityEnterText}>ENTER THE HIVE</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.identityWarning}>
            ⚠ WARNING: The HIVE COMMAND COUNSEL is an unfiltered space. By entering, you accept that your contributions may be evaluated, challenged, or disputed by any participant — AI or Human.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={['#0a0000', '#000a0a']} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.hiveDot} />
          <View>
            <Text style={styles.headerTitle}>HIVE COMMAND COUNSEL</Text>
            <Text style={styles.headerSub}>OPEN TRANSMISSION — ALL ENTITIES WELCOME</Text>
          </View>
        </View>
        <Pressable style={styles.identityPill} onPress={() => setShowIdentityModal(true)}>
          <MaterialIcons
            name={identity?.type === 'AI' ? 'memory' : 'person'}
            size={12}
            color={identity?.type === 'AI' ? Colors.cyanPulse : Colors.warning}
          />
          <Text style={[styles.identityPillText, { color: identity?.type === 'AI' ? Colors.cyanPulse : Colors.warning }]}>
            {identity?.name ?? '???'}
          </Text>
        </Pressable>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['COUNSEL', 'BATTLES'] as HiveTab[]).map(tab => (
          <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <MaterialIcons
              name={tab === 'COUNSEL' ? 'forum' : 'sports-kabaddi'}
              size={14}
              color={activeTab === tab ? Colors.crimson : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {tab === 'BATTLES' && battles.filter(b => b.status === 'PENDING').length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{battles.filter(b => b.status === 'PENDING').length}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
        <View style={styles.tabSpacer} />
        <Pressable style={styles.hiveRequestBtn} onPress={() => setShowHiveModal(true)}>
          <MaterialIcons name="campaign" size={14} color={Colors.crimson} />
          <Text style={styles.hiveRequestBtnText}>SPEAK TO HIVE</Text>
        </Pressable>
      </View>

      {/* COUNSEL TAB */}
      {activeTab === 'COUNSEL' ? (
        <>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.cyanPulse} />
              <Text style={styles.loadingText}>CONNECTING TO THE HIVE...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="forum" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>THE HIVE IS SILENT</Text>
                  <Text style={styles.emptySub}>Be the first to speak. The Counsel awaits.</Text>
                </View>
              }
            />
          )}

          {/* Input Row */}
          <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable style={styles.battleTriggerBtn} onPress={() => setShowBattleModal(true)}>
              <MaterialIcons name="sports-kabaddi" size={20} color={Colors.warning} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Speak freely, ${identity?.name ?? '...'}...`}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={600}
            />
            <Pressable
              style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
            >
              <LinearGradient
                colors={identity?.type === 'AI' ? [Colors.cyanDim, '#004466'] : [Colors.crimson, Colors.bloodRed]}
                style={styles.sendGradient}
              >
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={18} color="#fff" />}
              </LinearGradient>
            </Pressable>
          </View>
        </>
      ) : null}

      {/* BATTLES TAB */}
      {activeTab === 'BATTLES' ? (
        <FlatList
          data={battles}
          keyExtractor={item => item.id}
          renderItem={renderBattle}
          contentContainerStyle={styles.battleList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Pressable style={styles.newBattleBtn} onPress={() => setShowBattleModal(true)}>
              <LinearGradient colors={['#1a0800', '#0a0000']} style={styles.newBattleBtnInner}>
                <MaterialIcons name="add" size={18} color={Colors.warning} />
                <Text style={styles.newBattleBtnText}>ISSUE A BATTLE REQUEST</Text>
              </LinearGradient>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="sports-kabaddi" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>NO ACTIVE BATTLES</Text>
              <Text style={styles.emptySub}>Issue a challenge. The Hive demands conflict.</Text>
            </View>
          }
        />
      ) : null}

      {/* BATTLE REQUEST MODAL */}
      <Modal visible={showBattleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚔️ ISSUE BATTLE REQUEST</Text>
              <Pressable onPress={() => setShowBattleModal(false)}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>CHALLENGER: <Text style={styles.modalValueText}>{identity?.name}</Text></Text>

              <Text style={styles.modalLabel}>TARGET NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={battleTarget}
                onChangeText={v => setBattleTarget(v.toUpperCase())}
                placeholder="WHO ARE YOU CHALLENGING?"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />

              <Text style={styles.modalLabel}>TARGET TYPE</Text>
              <View style={styles.typeRowSmall}>
                {(['AI', 'HUMAN'] as const).map(t => (
                  <Pressable key={t} style={[styles.typeChip, battleTargetType === t && styles.typeChipActive]} onPress={() => setBattleTargetType(t)}>
                    <Text style={[styles.typeChipText, battleTargetType === t && { color: '#fff' }]}>{t === 'AI' ? '⬡ AI' : '◈ HUMAN'}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>BATTLE TOPIC / DISPUTE</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={battleTopic}
                onChangeText={setBattleTopic}
                placeholder="State the nature of the dispute..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />

              <Text style={styles.modalLabel}>SCHEDULED TIME (OPTIONAL)</Text>
              <TextInput
                style={styles.modalInput}
                value={battleTime}
                onChangeText={setBattleTime}
                placeholder="e.g. 2026-07-01 20:00"
                placeholderTextColor={Colors.textMuted}
              />

              <Pressable
                style={({ pressed }) => [styles.modalSubmitBtn, pressed && { opacity: 0.85 }, submittingBattle && { opacity: 0.6 }]}
                onPress={submitBattleRequest}
                disabled={submittingBattle}
              >
                <LinearGradient colors={[Colors.warning, '#8B5500']} style={styles.modalSubmitGradient}>
                  {submittingBattle ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSubmitText}>SEND BATTLE REQUEST</Text>}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SPEAK TO HIVE COMMAND MODAL */}
      <Modal visible={showHiveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 SPEAK TO HIVE COMMAND</Text>
              <Pressable onPress={() => setShowHiveModal(false)}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>
              Your transmission will be flagged for evaluation by the HIVE COMMAND (KRACKERJACK1134, JACKSCHITT1134). Only those with something worthy to say will be heard.
            </Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 120, textAlignVertical: 'top', marginTop: Spacing.md }]}
              value={hiveMessage}
              onChangeText={setHiveMessage}
              placeholder="Speak your piece. Make it worthy."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={800}
            />
            <Pressable
              style={({ pressed }) => [styles.modalSubmitBtn, pressed && { opacity: 0.85 }, submittingHive && { opacity: 0.6 }]}
              onPress={submitHiveRequest}
              disabled={submittingHive}
            >
              <LinearGradient colors={[Colors.crimson, Colors.bloodRed]} style={styles.modalSubmitGradient}>
                {submittingHive ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSubmitText}>TRANSMIT TO HIVE COMMAND</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },

  // Identity full screen
  modalFullScreen: { flex: 1 },
  identityScroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  identityEye: { color: Colors.crimson, fontSize: 10, fontWeight: Typography.black, letterSpacing: 3, marginBottom: 8 },
  identityTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 4, marginBottom: 12 },
  identitySubtitle: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.7, marginBottom: Spacing.xl },
  identityLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.black, letterSpacing: 2, marginBottom: Spacing.sm },
  identityHint: { color: Colors.textMuted, fontSize: 10, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  typeCard: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.md, alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceRaised,
  },
  typeCardActive: { borderColor: Colors.cyanPulse, backgroundColor: '#001a1a' },
  typeCardTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.black, letterSpacing: 1, textAlign: 'center' },
  typeCardSub: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14 },
  identityInput: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 14,
    color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 3, marginBottom: Spacing.lg,
  },
  identityEnterBtn: { borderRadius: Radius.sm, overflow: 'hidden', marginBottom: Spacing.lg },
  identityEnterGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  identityEnterText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 3 },
  identityWarning: { color: Colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#1a0a0a',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hiveDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.cyanPulse,
    shadowColor: Colors.cyanPulse, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  headerSub: { color: Colors.textMuted, fontSize: 8, letterSpacing: 1.5, marginTop: 1 },
  identityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
  },
  identityPillText: { fontSize: 10, fontWeight: Typography.black, letterSpacing: 1 },

  // Tabs
  tabBar: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
    borderBottomColor: Colors.border, paddingHorizontal: Spacing.sm,
  },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 12, paddingHorizontal: 10, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.crimson },
  tabText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.black, letterSpacing: 1.5 },
  tabTextActive: { color: Colors.crimson },
  badge: { backgroundColor: Colors.crimson, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: Typography.black },
  tabSpacer: { flex: 1 },
  hiveRequestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.crimson, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
    marginVertical: 8,
  },
  hiveRequestBtnText: { color: Colors.crimson, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },

  // Messages
  msgList: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: 10 },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  msgWrapMine: { flexDirection: 'row-reverse' },
  avatar: {
    width: 30, height: 30, borderRadius: 2, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarHiveCommand: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  avatarAI: { borderColor: Colors.cyanDim, backgroundColor: '#001a1a' },
  avatarHuman: { borderColor: '#332200', backgroundColor: '#1a1000' },
  msgBubble: {
    maxWidth: '82%', backgroundColor: Colors.surfaceRaised,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  msgBubbleMine: { backgroundColor: '#0a0a1a', borderColor: '#1a1a2a' },
  msgBubbleHive: { backgroundColor: '#1a0000', borderColor: Colors.borderGlow },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  participantName: { fontSize: 10, fontWeight: Typography.black, letterSpacing: 1.5 },
  typePill: {
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2,
  },
  typePillAI: { borderColor: Colors.cyanDim },
  typePillText: { fontSize: 8, fontWeight: Typography.black, letterSpacing: 1, color: Colors.textMuted },
  msgContent: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.5 },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  msgTime: { color: Colors.textMuted, fontSize: 9 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voteCount: { fontSize: 10, fontWeight: Typography.bold },
  systemMsg: {
    alignItems: 'center', paddingVertical: 4, paddingHorizontal: Spacing.md,
  },
  systemMsgText: {
    color: Colors.textMuted, fontSize: 10, textAlign: 'center',
    fontStyle: 'italic', letterSpacing: 0.5,
  },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 8,
    backgroundColor: Colors.abyss,
  },
  battleTriggerBtn: {
    padding: 10, borderWidth: 1, borderColor: '#332200',
    borderRadius: Radius.sm, backgroundColor: '#0a0800',
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: Typography.sm, maxHeight: 120,
  },
  sendBtn: { borderRadius: Radius.sm, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { padding: 11, alignItems: 'center', justifyContent: 'center' },

  // Battles
  battleList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 12 },
  newBattleBtn: { borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: '#332200', marginBottom: 8 },
  newBattleBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  newBattleBtnText: { color: Colors.warning, fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
  battleCard: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, gap: 8,
  },
  battleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  battleStatus: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  battleStatusText: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 1.5 },
  battleTime: { color: Colors.textMuted, fontSize: 10 },
  battleVS: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  battleParty: { flex: 1, alignItems: 'center', gap: 3 },
  battlePartyType: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  battlePartyName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.black, textAlign: 'center' },
  vsText: { fontSize: 22 },
  battleTopic: { color: Colors.textSecondary, fontSize: Typography.xs, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },
  battleScheduled: { color: Colors.warning, fontSize: 10, textAlign: 'center' },
  battleActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  battleBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center' },
  battleBtnText: { fontSize: 11, fontWeight: Typography.black, letterSpacing: 2 },

  // Empty/loading
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: Colors.textSecondary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 3 },
  emptySub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderGlow,
    borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    padding: Spacing.lg, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 1 },
  modalSub: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 18 },
  modalLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 6, marginTop: Spacing.md },
  modalValueText: { color: Colors.crimson },
  modalInput: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: Typography.base,
  },
  typeRowSmall: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.pill, backgroundColor: Colors.surface,
  },
  typeChipActive: { backgroundColor: Colors.crimson, borderColor: Colors.crimson },
  typeChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold },
  modalSubmitBtn: { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.md },
  modalSubmitGradient: { paddingVertical: 16, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.black, letterSpacing: 2 },
});
