import {
  EXT_NAME,
  EN_WORD_MATCH_REG,
  MIN_NODE_TEXT_LENGTH,
  MIN_WORDS_NUM,
  Tag,
} from "./constants";

export function log(...args: unknown[]) {
  console.log(`[${EXT_NAME}]`, ...args);
}

export function findRoot(): HTMLElement {
  // document.querySelector('article,main,[role="main"]') is not working for some websites like reddit etc.
  return document.body;
}

export function checkWords(textContent: string | null): boolean {
  const words = textContent?.match(EN_WORD_MATCH_REG) || [];
  if (
    words.length < MIN_WORDS_NUM &&
    words.join("").replace(/\s+/g, "").length < MIN_NODE_TEXT_LENGTH
  ) {
    return false;
  }

  return true;
}

export function sanitize() {
  document
    .querySelectorAll(Tag.Word)
    .forEach((el) => (el.outerHTML = el.textContent || ""));
  log("All bionic tags have been removed.");
}

export function escapeHTML(text: string) {
  // We only care start angle brackets
  return text.replace("<", "&lt;");
}
