import { Platform } from 'react-native';
import DashboardWeb from './DashboardScreen.web';
import DashboardNative from './DashboardScreen.native';

const DashboardScreen = Platform.OS === 'web' ? DashboardWeb : DashboardNative;

export default DashboardScreen;
