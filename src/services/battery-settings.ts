import { Capacitor, registerPlugin } from '@capacitor/core';

export type BatteryStatus = { available: boolean; exempt: boolean };
type BatteryPlugin = {
  status(): Promise<BatteryStatus>;
  requestExemption(): Promise<void>;
  requestOnce(): Promise<{requested:boolean;exempt:boolean}>;
  openSettings(): Promise<void>;
};
const nativeBattery = registerPlugin<BatteryPlugin>('THBatterySettings');
export async function batteryStatus(): Promise<BatteryStatus> {
  return Capacitor.isNativePlatform()?nativeBattery.status():{available:false,exempt:false};
}
export async function requestBatteryExemptionOnce():Promise<{requested:boolean;exempt:boolean}> {
  if(!Capacitor.isNativePlatform())return {requested:false,exempt:false};
  return nativeBattery.requestOnce();
}
export async function requestBatteryExemption():Promise<void> {
  if(!Capacitor.isNativePlatform())throw new Error('Disponible únicamente en Android');
  await nativeBattery.requestExemption();
}
export async function openBatterySettings():Promise<void> {
  if(!Capacitor.isNativePlatform())throw new Error('Disponible únicamente en Android');
  await nativeBattery.openSettings();
}
