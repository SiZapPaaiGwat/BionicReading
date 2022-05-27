const store = {
  bionicInjected: false,
  fontColor: "inherit",
};

export function getStore(key?: string) {
  return key ? store[key] : store;
}

export function setStore(key: string, value: string | boolean) {
  store[key] = value;
}
