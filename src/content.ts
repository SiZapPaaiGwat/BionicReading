const EXT_NAME = "Bionic Reading";
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
console.log(1);
let bionicInjected = false;

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */
function debounce(
  func: (...rest: unknown[]) => void,
  wait: number,
  immediate?: boolean
) {
  let timeout: number | null = null,
    args: unknown[],
    timestamp = 0,
    result: unknown;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func(...args);
        args = [];
      }
    }
  }

  return function (...params: unknown[]) {
    args = params;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func(...args);
      args = [];
    }

    return result;
  };
}

enum Tag {
  Word = "bionic-word",
  Font = "bionic-font",
}

function log(...args: unknown[]) {
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
  console.time(`[${EXT_NAME}]`);
  const treeWalker = document.createTreeWalker(
    findRoot(),
    NodeFilter.SHOW_TEXT,
    {
      acceptNode,
    }
  );
  const list = [];
  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;
    list.push(node);
  }
  list.forEach((node) => bionic(node as Text));
  console.timeEnd(`[${EXT_NAME}]`);
}

function sanitize() {
  document
    .querySelectorAll(Tag.Word)
    .forEach((el) => (el.outerHTML = el.textContent || ""));
  log("All bionic tags have been removed.");
}

const styleEl = document.createElement("style");
styleEl.innerHTML = `
  ${Tag.Word} > ${Tag.Font} {
    font-weight:bold;
  }
`;
document.head.appendChild(styleEl);

const main = debounce(iter, 180);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!bionicInjected) {
    document.addEventListener("scroll", main);
    document.addEventListener("wheel", main);
    window.addEventListener("resize", main);
    main();
  } else {
    document.removeEventListener("scroll", main);
    document.removeEventListener("wheel", main);
    window.removeEventListener("resize", main);
    sanitize();
  }

  bionicInjected = !bionicInjected;

  sendResponse({ message: "DONE" });
});
