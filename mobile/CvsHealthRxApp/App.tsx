import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import HomeScreen from './src/screens/HomeScreen';
import PrescriptionsScreen from './src/screens/PrescriptionsScreen';
import PharmacyLocatorScreen from './src/screens/PharmacyLocatorScreen';
import TelehealthScreen from './src/screens/TelehealthScreen';
import EhrScreen from './src/screens/EhrScreen';

export type RootStackParamList = {
  Home: undefined;
  Prescriptions: undefined;
  Pharmacies: undefined;
  Telehealth: undefined;
  Ehr: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerStyle: { backgroundColor: '#CC0000' }, headerTintColor: '#fff' }}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CVS Health Rx' }} />
          <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
          <Stack.Screen name="Pharmacies" component={PharmacyLocatorScreen} options={{ title: 'Find a Pharmacy' }} />
          <Stack.Screen name="Telehealth" component={TelehealthScreen} options={{ title: 'Virtual Visits' }} />
          <Stack.Screen name="Ehr" component={EhrScreen} options={{ title: 'Health Records' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
