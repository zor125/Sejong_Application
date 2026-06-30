import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../state/AuthContext';
import type { ScreenProps } from '../types/navigation';

const statusMessages = {
  pending: {
    title: '승인 대기 중입니다.',
    description: '강사가 학생 정보를 확인하고 기수를 배정하면 앱을 이용할 수 있습니다.',
  },
  rejected: {
    title: '가입 승인이 거절되었습니다.',
    description: '학원에 문의해 가입 정보를 다시 확인해주세요.',
  },
  suspended: {
    title: '이용이 중지된 계정입니다.',
    description: '서비스 이용 재개가 필요하면 학원에 문의해주세요.',
  },
};

export function ApprovalStatusScreen({ navigation }: ScreenProps<'ApprovalStatus'>) {
  const { approval, logout } = useAuth();
  const status = approval?.status ?? 'pending';
  const message = statusMessages[status];

  const handleRefresh = () => {
    navigation.replace('Login');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.kicker}>KAKAO LOGIN</Text>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.description}>{message.description}</Text>

          {approval?.student ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>학생명</Text>
              <Text style={styles.infoValue}>{approval.student.name}</Text>
              <Text style={styles.infoLabel}>상태</Text>
              <Text style={styles.infoValue}>{status}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton onPress={handleRefresh}>승인 상태 새로고침</PrimaryButton>
            <PrimaryButton variant="light" onPress={() => logout()}>
              로그아웃
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3FBF5',
  },
  card: {
    gap: 14,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  kicker: {
    color: '#0B9444',
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: '#1A1F1B',
    fontSize: 24,
    fontWeight: '900',
  },
  description: {
    color: '#66706A',
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    gap: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F7F9F7',
  },
  infoLabel: {
    color: '#66706A',
    fontSize: 12,
    fontWeight: '800',
  },
  infoValue: {
    color: '#1A1F1B',
    fontSize: 15,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});
