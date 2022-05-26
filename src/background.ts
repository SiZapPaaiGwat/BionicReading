function sendMsg(id: number, msg: { type: string; message?: string }) {
  chrome.tabs.sendMessage(id, msg, (res) => {
    console.log(res);
  });
}

chrome.action.onClicked.addListener((tab) => {
  sendMsg(tab.id as number, {
    type: "toggle",
  });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((e) => {
  sendMsg(e.tabId, { type: "bionic" });
});
