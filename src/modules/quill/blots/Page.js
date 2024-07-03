/*
 Lien
 Blot : inline
 TEI : ref[@target]
 HTML5 : a[@href]
 Utilisation : commentaire
*/

// TODO

import Quill from "quill";

const getPageNum = (txt) => {
  const re = /\[p\. (.*)\]/.exec(txt);
  if (re[1]) return re[1];
  return "";
};

const Embed = Quill.import("blots/embed");

class PageBlot extends Embed {
  /**
   *
   * @param {{href: string, pageNum: string}} value
   * @returns
   */
  static create(value) {
    console.log("PageBlot create value : ", value);
    let node = super.create();
    node.setAttribute("target", "_blank");
    node.setAttribute("href", value.href);
    node.setAttribute("title", value.href);
    if (value.pageNum) {
      node.innerText = `[p. ${value.pageNum}]`;
    }
    console.log("PageBlot create node : ", node);
    return node;
  }

  static value(domNode) {
    console.log("static value : ", domNode);
    console.log("static value return: ", {
      href: domNode.getAttribute("href"),
      pageNum: getPageNum(domNode.innerText),
    });
    return {
      href: domNode.getAttribute("href"),
      pageNum: getPageNum(domNode.innerText),
    };
  }
}
PageBlot.blotName = "page";
PageBlot.tagName = "a";
PageBlot.className = "pb";

export default PageBlot;
