import debounce from "lodash.debounce";

import { getUserOptions, setUserOptions } from "./options";
import { getStore, setStore } from "./store";
import {
  IGNORED_PARENT_TAGS,
  MIN_CHARATERS_NUM,
  INLINE_DECORATOR,
  VERTICAL_OFFSET,
  EN_WORD_REPLACE_REG,
  MAX_BOLD_LETTERS,
  EXT_NAME,
  Tag,
} from "./constants";
import { log, checkWords, findRoot, sanitize, escapeHTML } from "./utils";
import { ActionModule, Store } from "./types";

function acceptNode(node: Node) {
  const parent = node.parentElement;
  if (!parent) {
    return NodeFilter.FILTER_REJECT;
  }

  const tag = parent.tagName.toLowerCase();
  /**
   * Reject node if it is a bionic tag or in the ignored parent list
   */
  if (
    tag === Tag.Word ||
    tag === Tag.Font ||
    IGNORED_PARENT_TAGS.includes(tag)
  ) {
    return NodeFilter.FILTER_REJECT;
  }

  const textContent = node.textContent?.trim() || "";
  if (textContent.length < MIN_CHARATERS_NUM) {
    return NodeFilter.FILTER_REJECT;
  }

  /**
   * Reject node if no words found or text total length is less than min node text length
   */
  if (!checkWords(textContent)) {
    return NodeFilter.FILTER_REJECT;
  }

  if (INLINE_DECORATOR.includes(tag)) {
    if (!checkWords(parent.textContent)) {
      return NodeFilter.FILTER_REJECT;
    }
  }

  const { top, bottom } = parent.getBoundingClientRect();
  if (
    bottom < -VERTICAL_OFFSET ||
    top > document.documentElement.clientHeight + VERTICAL_OFFSET
  ) {
    return NodeFilter.FILTER_REJECT;
  }

  return NodeFilter.FILTER_ACCEPT;
}

function bionic(node: Text) {
  const text = node.data;
  const el = document.createElement(Tag.Word);
  const html = text.replace(EN_WORD_REPLACE_REG, (word) => {
    const midIndex = Math.min(MAX_BOLD_LETTERS, Math.ceil(word.length / 2));
    return `<${Tag.Font}>${word.slice(0, midIndex)}</${Tag.Font}>${word.slice(
      midIndex
    )}`;
  });
  if (html.trim()) {
    el.innerHTML = escapeHTML(html);
    node.after(el);
    node.remove();
  }
}

function iter() {
  if (!getStore("bionicInjected")) {
    return;
  }

  console.time(`[${EXT_NAME}]`);
  const treeWalker = document.createTreeWalker(
    findRoot(),
    NodeFilter.SHOW_TEXT,
    {
      acceptNode,
    }
  );
  const list: Text[] = [];
  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;
    list.push(node as Text);
  }
  list.forEach(bionic);
  console.timeEnd(`[${EXT_NAME}]`);
  if (list.length === 0) {
    log("No text nodes found.");
  }
}

function createStyleNode(fontColor: string): void {
  let styleEl = document.querySelector("#" + EXT_NAME);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.setAttribute("id", EXT_NAME);
    document.head.appendChild(styleEl);
  }

  const html = `${Tag.Word}>${Tag.Font}{font-weight:bold;color:${fontColor}}`;
  if (html !== styleEl.innerHTML) {
    styleEl.innerHTML = html;
  }
}

const startBionic: () => void = debounce(iter, 180);

export function initialize() {
  createStyleNode("inherit");
  setStore("bionicInjected", true);
  document.addEventListener("scroll", startBionic);
  document.addEventListener("wheel", startBionic);
  window.addEventListener("resize", startBionic);
}

export function destroy() {
  setStore("bionicInjected", false);
  document.removeEventListener("scroll", startBionic);
  document.removeEventListener("wheel", startBionic);
  window.removeEventListener("resize", startBionic);
  sanitize();
}

const actions: ActionModule = {
  startBionic,
  toggleAutouse: async function toggleAutouse() {
    const options = await getUserOptions();
    const injected = getStore("bionicInjected");
    // Enable autouse
    if (!options.autouse) {
      // auto init if not injected
      if (!injected) {
        initialize();
      }
      startBionic();
    } else {
      // auto destroy
      destroy();
    }
    await setUserOptions({
      ...options,
      autouse: !options.autouse,
    });
  },
  toggleFontColor: function toggleFontColor() {
    const { fontColor, bionicInjected } = getStore() as Store;
    if (bionicInjected) {
      const newColor =
        !fontColor || fontColor === "inherit" ? "#FFF" : "inherit";
      setStore("fontColor", newColor);
      createStyleNode(newColor);
    } else {
      log("Please turn bionic reading mode on.");
    }
  },
};

export default actions;
