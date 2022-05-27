export type ActionModule = {
  startBionic: () => void;
  toggleAutouse: () => void;
  toggleFontColor: () => void;
};

export type Actions = keyof ActionModule;

export type Store = {
  bionicInjected: boolean;
  fontColor: string;
};

export type StateFields = keyof Store;

export type StateValues = Store[StateFields];
