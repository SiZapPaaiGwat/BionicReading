const EXT_NAME = "Bionic Reading";
const MIN_WORDS = 3;
const MAX_BOLD_LETTERS = 6;
const EN_WORD_REG = /[a-zA-Z][a-z0-9]+/g;
const INLINE_DECORATOR = "a,em,strong,time".split(",");
const IGNORED_PARENT_TAGS =
  "script,style,pre,code,iframe,select,input,button,textarea,form,svg".split(
    ","
  );
let bionicInjected = false;

enum Tag {
  Word = "bionic-word",
  Font = "bionic-font",
}

function log(...args) {
  console.log(`[${EXT_NAME}]`, ...args);
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing. The function also has a property 'clear'
 * that is a function which will clear the timer to prevent previously scheduled executions.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */
function debounce(func, wait, immediate) {
  let timeout, args, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func(...args);
        args = null;
      }
    }
  }

  const debounced = function (...params) {
    args = params;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func(...args);
      args = null;
    }

    return result;
  };

  debounced.clear = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = function () {
    if (timeout) {
      result = func(...args);
      args = null;

      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

function acceptNode(node: Node) {
  const parent = node.parentElement;
  const tag = parent.tagName.toLowerCase();
  if (
    tag === Tag.Word ||
    tag === Tag.Font ||
    IGNORED_PARENT_TAGS.includes(tag)
  ) {
    return NodeFilter.FILTER_REJECT;
  }

  if (
    !INLINE_DECORATOR.includes(tag) &&
    parent.textContent.split(/\s/).length < MIN_WORDS
  ) {
    return NodeFilter.FILTER_REJECT;
  }

  const { top, bottom } = parent.getBoundingClientRect();
  const h = document.documentElement.clientHeight;
  if (bottom < -100 || top > h + 100) {
    return NodeFilter.FILTER_REJECT;
  }

  return NodeFilter.FILTER_ACCEPT;
}

function bionic(node: Text) {
  const text = node.data;
  const el = document.createElement(Tag.Word);
  const html = text.replace(EN_WORD_REG, (word) => {
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
    document.body,
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
  list.forEach(bionic);
  console.timeEnd(`[${EXT_NAME}]`);
}

function sanitize() {
  document
    .querySelectorAll(Tag.Word)
    .forEach((el) => (el.outerHTML = el.textContent));
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
