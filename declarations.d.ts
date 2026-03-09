declare module '@react-native-async-storage/async-storage';
declare module 'paho-mqtt';
declare module 'react-native-push-notification' {
  export type PushNotificationObject = {
    channelId?: string;
    title?: string;
    message: string;
    playSound?: boolean;
    soundName?: string;
    vibrate?: boolean;
  };
  export type ConfigureOptions = {
    onNotification?: (notification: PushNotificationObject) => void;
    requestPermissions?: boolean;
  };
  export function configure(options: ConfigureOptions): void;
  export function localNotification(notification: PushNotificationObject): void;
  export function createChannel(
    channel: {channelId: string; channelName: string; channelDescription?: string},
    cb?: (created: boolean) => void,
  ): void;
  const PushNotification: {
    configure: typeof configure;
    localNotification: typeof localNotification;
    createChannel: typeof createChannel;
  };
  export default PushNotification;
}

declare module 'victory-native' {
  export const VictoryChart: any;
  export const VictoryLine: any;
  export const VictoryAxis: any;
  export const VictoryTheme: any;
}
