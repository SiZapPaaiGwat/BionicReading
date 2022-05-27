type UserOptions = {
  autouse: boolean;
};

let userOptions: UserOptions | null = null;

export const defaultOptions: UserOptions = {
  autouse: true,
};

export async function getUserOptions() {
  if (!userOptions) {
    userOptions = (await chrome.storage.local.get(null)) as UserOptions;
  }
  return userOptions || { ...defaultOptions };
}

export async function setUserOptions(options: UserOptions) {
  await chrome.storage.local.set(options);
  userOptions = options;
}
