import { requireNativeModule, EventEmitter, Subscription } from 'expo-modules-core';

const C72Rfid = requireNativeModule('C72Rfid');

const emitter = new EventEmitter(C72Rfid);

export type TagEvent = {
  epc: string;
  rssi: string;
  tid?: string;
};

export function init(): boolean {
  return C72Rfid.init();
}

export function startScanning(): boolean {
  return C72Rfid.startScanning();
}

export function stopScanning() {
  C72Rfid.stopScanning();
}

export function free() {
  C72Rfid.free();
}

export function getPower(): number {
  return C72Rfid.getPower();
}

export function setPower(power: number): boolean {
  return C72Rfid.setPower(power);
}

export function addTagListener(listener: (event: TagEvent) => void): Subscription {
  return emitter.addListener('onTagRead', listener);
}
