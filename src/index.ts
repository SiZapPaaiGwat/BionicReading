import debounce from "lodash.debounce";

const EXT_NAME = "Bionic_Reading";
const MIN_CHARATERS_NUM = 3;
const MIN_WORDS_NUM = 4;
const MAX_BOLD_LETTERS = 6;
const MIN_NODE_TEXT_LENGTH = (MIN_WORDS_NUM - 1) * MAX_BOLD_LETTERS;
const EN_WORD_REPLACE_REG = /[a-zA-Z][a-z]+/g;
const EN_WORD_MATCH_REG = /[a-z]+([\s]+|$)/gi;
const INLINE_DECORATOR = "a,em".split(",");
const VERTICAL_OFFSET = 100;
// most heading tags are bold
const IGNORED_PARENT_TAGS =
  "abbr,aside,audio,b,bdi,bdo,button,canvas,code,datalist,footer,form,h1,h2,h3,h4,h5,h6,header,input,kbd,menu,nav,noscript,pre,script,strong,style,svg,template,textarea,th,time,title,var,video".split(
    ","
  );
let bionicInjected = false;

enum Tag {
  Word = "bionic-word",
  Font = "bionic-font",
}

export function log(...args: unknown[]) {
  console.log(`[${EXT_NAME}]`, ...args);
}

function findRoot(): HTMLElement {
  return document.querySelector('article,main,[role="main"]') || document.body;
}

function checkWords(textContent: string | null): boolean {
  const words = textContent?.match(EN_WORD_MATCH_REG) || [];
  if (
    words.length < MIN_WORDS_NUM ||
    words.join("").replace(/\s+/g, "").length < MIN_NODE_TEXT_LENGTH
  ) {
    return false;
  }

  return true;
}

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
  const h = document.documentElement.clientHeight;
  if (bottom < -VERTICAL_OFFSET || top > h + VERTICAL_OFFSET) {
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
    el.innerHTML = html;
    node.after(el);
    node.remove();
  }
}

function iter() {
  if (!bionicInjected) {
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
  // Need to update color since user may change the theme without refreshing
  createStyleNode();
  list.forEach(bionic);
  console.timeEnd(`[${EXT_NAME}]`);
}

function sanitize() {
  document
    .querySelectorAll(Tag.Word)
    .forEach((el) => (el.outerHTML = el.textContent || ""));
  log("All bionic tags have been removed.");
}

export function createStyleNode(): void {
  let styleEl = document.querySelector("#" + EXT_NAME);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.setAttribute("id", EXT_NAME);
    document.head.appendChild(styleEl);
  }

  /**
   * TODO font styles should be configurable
   * 1) dark mode font color
   * 2) opacity for word and font
   */
  const fontColor = "inherit";
  const html = `${Tag.Word}>${Tag.Font}{font-weight:bold;color:${fontColor}}`;
  if (html !== styleEl.innerHTML) {
    styleEl.innerHTML = html;
  }
}

export const startBionic: () => void = debounce(iter, 180);

export function toggle() {
  if (!bionicInjected) {
    bionicInjected = true;
    document.addEventListener("scroll", startBionic);
    document.addEventListener("wheel", startBionic);
    window.addEventListener("resize", startBionic);
    startBionic();
  } else {
    bionicInjected = false;
    document.removeEventListener("scroll", startBionic);
    document.removeEventListener("wheel", startBionic);
    window.removeEventListener("resize", startBionic);
    sanitize();
  }
}
