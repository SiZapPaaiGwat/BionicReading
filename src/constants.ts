export const EXT_NAME = "Bionic_Reading";
export const MIN_CHARATERS_NUM = 3;
export const MIN_WORDS_NUM = 4;
export const MAX_BOLD_LETTERS = 6;
export const MIN_NODE_TEXT_LENGTH = (MIN_WORDS_NUM - 1) * 5;
export const EN_WORD_REPLACE_REG = /[a-zA-Z][a-z]+/g;
export const EN_WORD_MATCH_REG = /[a-z]+([\s]+|$)/gi;
export const INLINE_DECORATOR = "a,em".split(",");
export const VERTICAL_OFFSET = 100;
// most heading tags are bold
export const IGNORED_PARENT_TAGS =
  "abbr,aside,audio,b,bdi,bdo,button,canvas,code,datalist,footer,form,h1,h2,h3,h4,h5,h6,header,input,kbd,menu,nav,noscript,pre,script,strong,style,svg,template,textarea,th,time,title,var,video".split(
    ","
  );
export enum Tag {
  Word = "bionic-word",
  Font = "bionic-font",
}
