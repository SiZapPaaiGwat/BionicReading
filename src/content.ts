import actions, { initialize } from "./index";
import { log } from "./utils";
import { getUserOptions } from "./options";
import { Actions } from "./types";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const method = message.type as Actions;
  if (method in actions) {
    actions[method]();
  } else {
    log("Unknow operation: ", message);
  }

  sendResponse({ message: "DONE" });
});

getUserOptions()
  .then((options) => {
    if (options.autouse === false) {
      log("Autouse is disabled.");
    } else {
      initialize();
      actions.startBionic();
    }
  })
  .catch((err) => {
    console.log(err);
  });
