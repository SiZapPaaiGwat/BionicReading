chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id as number, { type: "start" }, (res) => {
    console.log(res.message);
  });
});
