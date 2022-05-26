import { toggle, createStyleNode, log, startBionic } from "./index";

createStyleNode();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle") {
    toggle();
  } else if (message.type === "bionic") {
    startBionic();
  } else {
    log("Unknow operation: ", message);
  }

  sendResponse({ message: "DONE" });
});
