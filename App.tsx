// App.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  AppState,
  Platform,
} from 'react-native';
import PushNotification, {PushNotificationObject} from 'react-native-push-notification';
import {VictoryChart, VictoryLine, VictoryAxis, VictoryTheme} from 'victory-native';
import Svg from 'react-native-svg';

type DataPoint = {
  nem: number;
  ppm: number;
  sicaklik: number;
  zaman: string; // ISO string
};

type AnomalyMsg = {type: 'anomaly'; message: string; at: string; metric?: string};

const WS_URL = 'ws://YOUR_RASPI_IP:PORT/stream'; // Raspberry Pi websocket endpoint
const HISTORY_LIMIT = 100;

export default function App() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [notifications, setNotifications] = useState<AnomalyMsg[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Baglaniyor...');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const hasValidWsUrl = useMemo(() => {
    const trimmed = WS_URL.trim();
    const usesPlaceholder = trimmed.includes('YOUR_RASPI_IP') || trimmed.includes('PORT');
    const looksLikeWs = /^wss?:\/\/.+/i.test(trimmed);
    return looksLikeWs && !usesPlaceholder;
  }, []);

  // Local notification config
  useEffect(() => {
    PushNotification.configure({
      onNotification: (n: PushNotificationObject) => console.log('Notif:', n),
      // Android does not need runtime permission for local notifications.
      // Keeping this true on Android triggers Firebase without an initialized app.
      requestPermissions: Platform.OS === 'ios',
    });
    PushNotification.createChannel(
      {channelId: 'anomaly-channel', channelName: 'Anomaly Alerts'},
      created => console.log('Notification channel ready?', created),
    );
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current || !isMounted.current) {
      return;
    }

    if (!hasValidWsUrl) {
      setConnectionStatus('WS_URL tanimlanmadi - ornek veri gosteriliyor');
      return;
    }

    let ws: WebSocket;
    try {
      setConnectionStatus('Baglaniyor...');
      ws = new WebSocket(WS_URL);
    } catch (err) {
      console.warn('WS init failed', err);
      setConnectionStatus('WS_URL gecersiz veya baglanilamadi');
      return;
    }

    wsRef.current = ws;
    ws.onopen = () => {
      setConnectionStatus('Baglandi');
      console.log('WS connected');
    };
    ws.onerror = e => {
      setConnectionStatus('Baglanti hatasi');
      console.warn('WS error', e);
    };
    ws.onclose = () => {
      wsRef.current = null;
      setConnectionStatus('Baglanti koptu, yeniden denenecek...');
      if (isMounted.current) {
        reconnectTimer.current = setTimeout(() => connect(), 2000); // retry
      }
    };
    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'anomaly') {
          handleAnomaly(msg as AnomalyMsg);
        } else if (msg.nem !== undefined) {
          pushData(msg as DataPoint);
        }
      } catch (err) {
        console.warn('Bad msg', err);
      }
    };
  }, []);

  // WebSocket connect
  useEffect(() => {
    connect();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && !wsRef.current) connect();
      if (state !== 'active') {
        wsRef.current?.close();
        wsRef.current = null;
      }
    });
    return () => {
      isMounted.current = false;
      sub.remove();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, hasValidWsUrl]);

  const pushData = (d: DataPoint) => {
    setData(prev => {
      const next = [...prev, d].slice(-HISTORY_LIMIT);
      return next;
    });
  };

  // When WS_URL is not configured, keep the UI alive with sample values
  useEffect(() => {
    if (hasValidWsUrl) {
      return;
    }
    const timer = setInterval(() => {
      const now = new Date();
      pushData({
        nem: 35 + Math.random() * 15,
        ppm: 450 + Math.random() * 80,
        sicaklik: 21 + Math.random() * 6,
        zaman: now.toISOString(),
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [hasValidWsUrl]);

  const handleAnomaly = (a: AnomalyMsg) => {
    setNotifications(prev => [a, ...prev].slice(0, 20));
    PushNotification.localNotification({
      channelId: 'anomaly-channel',
      title: 'Anomali Tespit Edildi',
      message: a.message ?? 'Sensor anomali bildirdi',
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });
  };

  // Prepare chart data
  const chartData = useMemo(
    () => ({
      ppm: data.map((d, i) => ({x: i, y: d.ppm})),
      nem: data.map((d, i) => ({x: i, y: d.nem})),
      sicaklik: data.map((d, i) => ({x: i, y: d.sicaklik})),
    }),
    [data],
  );

  const last = data[data.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Cevrim Ici Sensor Takibi</Text>
      <Text style={styles.status}>{connectionStatus}</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Son Olcum</Text>
        {last ? (
          <Text style={styles.value}>
            Nem: {last.nem}% | PPM: {last.ppm.toFixed(2)} | Sicaklik: {last.sicaklik}C
          </Text>
        ) : (
          <Text style={styles.muted}>Veri bekleniyor...</Text>
        )}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.title}>Zamana Gore Degerler (son {HISTORY_LIMIT})</Text>
        <Svg height={240} width="100%">
          <VictoryChart
            standalone={false}
            width={350}
            height={240}
            theme={VictoryTheme.material}
            padding={{top: 20, left: 50, right: 30, bottom: 40}}>
            <VictoryAxis />
            <VictoryAxis dependentAxis tickFormat={(t: number) => `${t}`} />
            <VictoryLine data={chartData.ppm} style={{data: {stroke: '#ff6b6b'}}} />
            <VictoryLine data={chartData.nem} style={{data: {stroke: '#1e90ff'}}} />
            <VictoryLine data={chartData.sicaklik} style={{data: {stroke: '#2ecc71'}}} />
          </VictoryChart>
        </Svg>
        <Text style={styles.legend}>Kirmizi: PPM | Mavi: Nem | Yesil: Sicaklik</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bildirim Paneli</Text>
        <FlatList
          data={notifications}
          keyExtractor={(_, i) => String(i)}
          ListEmptyComponent={<Text style={styles.muted}>Henuz anomali yok.</Text>}
          renderItem={({item}) => (
            <View style={styles.notifItem}>
              <Text style={styles.notifText}>{item.message || 'Anomali'}</Text>
              <Text style={styles.notifSub}>
                {item.metric ? `Metrik: ${item.metric} | ` : ''}
                {new Date(item.at).toLocaleTimeString()}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f172a', padding: 12},
  header: {fontSize: 20, fontWeight: '700', color: '#e2e8f0', marginBottom: 10},
  status: {color: '#94a3b8', marginBottom: 8, fontSize: 12},
  card: {backgroundColor: '#111827', borderRadius: 10, padding: 12, marginBottom: 10},
  chartCard: {backgroundColor: '#111827', borderRadius: 10, padding: 12, marginBottom: 10},
  title: {color: '#cbd5e1', fontWeight: '700', marginBottom: 6},
  value: {color: '#e2e8f0'},
  muted: {color: '#94a3b8'},
  legend: {color: '#94a3b8', marginTop: 6, fontSize: 12},
  notifItem: {paddingVertical: 6, borderBottomColor: '#1f2937', borderBottomWidth: 1},
  notifText: {color: '#e2e8f0', fontWeight: '600'},
  notifSub: {color: '#94a3b8', fontSize: 12},
});
