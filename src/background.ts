function sendMsg(id: number, msg: { type: string; message?: string }) {
  chrome.tabs.sendMessage(id, msg, (res) => {
    console.log(res);
  });
}

chrome.webNavigation.onHistoryStateUpdated.addListener((e) => {
  sendMsg(e.tabId, { type: "startBionic" });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (tab.id && tab.id > 0) {
    sendMsg(tab.id as number, { type: command });
  }
});
