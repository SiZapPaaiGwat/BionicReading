import { Store, StateFields, StateValues } from "./types";

const store: Store = {
  bionicInjected: false,
  fontColor: "inherit",
};

export function getStore(key?: StateFields): Store | StateValues {
  return key ? store[key] : store;
}

export function setStore(key: StateFields, value: StateValues): void {
  store[key] = value as never;
}
