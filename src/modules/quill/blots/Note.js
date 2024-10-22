/*
 Lien
 Blot : inline
 Utilisation : Appel de note
*/

import Quill from "quill";

const ATTRIBUTES = ["href"];
const getNoteId = (domNode) => {
  console.log("getNoteId :", domNode.getAttribute("href").substring(1));
  return domNode.getAttribute("href").substring(1);
};

const getIndex = (domNode) => {
  console.log("getIndex :", domNode.innerText.match(/\d/g).join(""));
  return domNode.innerText.match(/\d/g).join("");
};

const Embed = Quill.import("blots/embed");

class NoteBlot extends Embed {
  /**
   *
   * @param {{id: number, index: number}} value
   * @returns {HTMLElement}
   */
  static create(value) {
    const { id, index } = value;
    let node = super.create();
    node.setAttribute("href", "#" + id);
    node.innerText = `[${index}]`;
    return node;
  }

  static value(domNode) {
    return {
      id: getNoteId(domNode),
      index: getIndex(domNode),
    };
  }

  //deleteAt() {
  //  // prevent removal. Notes can only be removed from note modal.
  //  return false;
  //}
}

NoteBlot.blotName = "note";
NoteBlot.tagName = "a";
NoteBlot.className = "note";

export default NoteBlot;
