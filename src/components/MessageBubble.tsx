import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { ChatMessage } from '../types/message';
import { Check, CheckCheck, Clock, AlertCircle, Shield, GitBranch } from 'lucide-react-native';

interface MessageBubbleProps {
  message: ChatMessage;
  onLongPress?: () => void;
  onSelectReaction?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLongPress,
  onSelectReaction,
}) => {
  const isOut = message.isOutgoing;
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderStatusIcon = () => {
    switch (message.status) {
      case 'queued':
        return <Clock size={12} color={Colors.textMuted} />;
      case 'sending':
        return <Clock size={12} color={Colors.warning} />;
      case 'sent':
        return <Check size={13} color={Colors.textSecondary} />;
      case 'delivered':
        return <CheckCheck size={14} color={Colors.success} />;
      case 'failed':
        return <AlertCircle size={13} color={Colors.danger} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      style={[
        styles.wrapper,
        isOut ? styles.wrapperOutgoing : styles.wrapperIncoming,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOut ? styles.bubbleOutgoing : styles.bubbleIncoming,
        ]}
      >
        {!isOut && (
          <Text style={styles.senderLabel}>{message.senderName}</Text>
        )}

        <Text style={styles.content}>{message.content}</Text>

        <View style={styles.footerRow}>
          <View style={styles.leftMeta}>
            <Shield size={10} color={Colors.primary} style={{ marginRight: 2 }} />
            {message.hopCount && message.hopCount > 0 ? (
              <View style={styles.hopBadge}>
                <GitBranch size={9} color={Colors.purple} />
                <Text style={styles.hopText}>{message.hopCount} {message.hopCount === 1 ? 'hop' : 'hops'}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rightMeta}>
            <Text style={styles.timeText}>{timeStr}</Text>
            {isOut && <View style={styles.statusBox}>{renderStatusIcon()}</View>}
          </View>
        </View>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View style={styles.reactionsRow}>
            {Object.keys(message.reactions).map((emoji) => (
              <View key={emoji} style={styles.reactionPill}>
                <Text style={styles.reactionText}>{emoji}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  wrapperOutgoing: {
    alignSelf: 'flex-end',
  },
  wrapperIncoming: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOutgoing: {
    backgroundColor: Colors.bubbleOutgoing,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  bubbleIncoming: {
    backgroundColor: Colors.bubbleIncoming,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  content: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purpleGlow,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  hopText: {
    fontSize: 9,
    color: Colors.purple,
    fontWeight: '600',
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  statusBox: {
    marginLeft: 2,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionPill: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionText: {
    fontSize: 12,
  },
});
