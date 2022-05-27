import actions, { initialize } from "./index";
import { log } from "./utils";
import { getUserOptions } from "./options";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type in actions) {
    actions[message.type]();
  } else {
    log("Unknow operation: ", message);
  }

  sendResponse({ message: "DONE" });
});

getUserOptions()
  .then((options) => {
    if (options.autouse) {
      initialize();
      actions.startBionic();
    } else {
      log("Autouse is disabled.");
    }
  })
  .catch((err) => {
    console.log(err);
  });
