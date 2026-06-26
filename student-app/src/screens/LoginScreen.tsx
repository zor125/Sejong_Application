import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { ApiConfigurationError, ApiNetworkError } from '../api/client';
import { useAuth } from '../state/AuthContext';
import type { ScreenProps } from '../types/navigation';

const KAKAO_CALLBACK_SCHEME = 'nursing-student-app://kakao/oauth';

const getWebLocation = () => {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) return null;
  return (globalThis as typeof globalThis & { location: Location }).location;
};

const getRedirectUri = () => {
  const configured = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI?.trim();
  if (configured) return configured;

  const webLocation = getWebLocation();
  if (Platform.OS === 'web' && webLocation?.origin) {
    return webLocation.origin;
  }

  return KAKAO_CALLBACK_SCHEME;
};

const extractCodeFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('code');
  } catch {
    return null;
  }
};

const clearWebKakaoQuery = () => {
  if (Platform.OS !== 'web') return;
  const history = (globalThis as typeof globalThis & { history?: History }).history;
  const location = getWebLocation();

  if (history && location?.origin) {
    history.replaceState({}, '', location.origin);
  }
};

const getLoginErrorMessage = (error: unknown) => {
  if (error instanceof ApiNetworkError || error instanceof ApiConfigurationError) {
    return error.message;
  }

  return '카카오 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const { approval, completeKakaoLogin, expiredMessage, getKakaoLoginUrl, isAuthenticated, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState(expiredMessage);
  const [isLoading, setIsLoading] = useState(false);
  const redirectUri = useMemo(getRedirectUri, []);

  const handleKakaoCallbackUrl = useCallback(async (url: string) => {
    const code = extractCodeFromUrl(url);
    if (!code || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await completeKakaoLogin(code, redirectUri);
      clearWebKakaoQuery();

      if ('role' in result) {
        navigation.replace('CohortSelect');
      } else {
        navigation.replace('ApprovalStatus');
      }
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [completeKakaoLogin, isLoading, navigation, redirectUri]);

  useEffect(() => {
    if (isAuthenticated && user?.cohortId) {
      navigation.replace('CohortSelect');
      return;
    }

    if (approval) {
      navigation.replace('ApprovalStatus');
    }
  }, [approval, isAuthenticated, navigation, user?.cohortId]);

  useEffect(() => {
    const webLocation = getWebLocation();

    if (Platform.OS === 'web' && webLocation?.href) {
      void handleKakaoCallbackUrl(webLocation.href);
    }

    const subscription = Linking.addEventListener('url', (event) => {
      void handleKakaoCallbackUrl(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) void handleKakaoCallbackUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleKakaoCallbackUrl]);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const authorizationUrl = await getKakaoLoginUrl(redirectUri);

      if (Platform.OS === 'web') {
        const webLocation = getWebLocation();
        if (webLocation) {
          webLocation.href = authorizationUrl;
          return;
        }
      }

      await Linking.openURL(authorizationUrl);
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>문</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.kicker}>NURSING ACADEMY</Text>
          <Text style={styles.title}>간호문제</Text>
          <Text style={styles.description}>카카오 로그인 후 강사 승인이 완료되면 문제집을 풀이할 수 있습니다.</Text>
        </View>

        <View style={styles.form}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <PrimaryButton disabled={isLoading} onPress={handleKakaoLogin}>
            {isLoading ? '카카오 로그인 중...' : '카카오로 로그인'}
          </PrimaryButton>
          <Text style={styles.helperText}>
            처음 로그인한 학생은 승인대기 상태로 등록됩니다.
          </Text>
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
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    borderRadius: 22,
    backgroundColor: '#FEE500',
  },
  logoText: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '900',
  },
  header: {
    marginBottom: 32,
  },
  kicker: {
    marginBottom: 8,
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#172554',
    fontSize: 36,
    fontWeight: '900',
  },
  description: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  errorText: {
    marginBottom: 8,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
