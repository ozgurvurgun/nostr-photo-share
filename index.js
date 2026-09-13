/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'text-encoding-polyfill';
import 'react-native-url-polyfill/auto';

import {AppRegistry} from 'react-native';
import {enableFreeze, enableScreens} from 'react-native-screens';
import App from './App';
import {name as appName} from './app.json';

enableScreens();
enableFreeze(true);

AppRegistry.registerComponent(appName, () => App);
