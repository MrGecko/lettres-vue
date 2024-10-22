import Quill from "quill";
import Delta from "quill-delta";
import _isEmpty from "lodash/isEmpty"

import PlainClipboard from "./PlainClipboard";

import BoldBlot from "./blots/Bold";
import CiteBlot from "./blots/Cite";
import DelBlot from "./blots/Del";
import ItalicBlot from "./blots/Italic";
import LineBreak from "./blots/LineBreak";
import LinkBlot from "./blots/Link";
import LocationBlot from "./blots/Location";
import NoteBlot from "./blots/Note";
import PageBlot from "./blots/Page";
import ParagraphBlot from "./blots/Paragraph";
import PersonBlot from "./blots/Person";
import SuperscriptBlot from "./blots/Superscript";

let Inline = Quill.import("blots/inline");
let Embed = Quill.import("blots/embed");

// Lower index means deeper in the DOM tree, since not found (-1) is for embeds
Inline.order = [
  "cursor",
  "inline", // Must be lower
  "underline",
  "strike",
  "italic",
  "bold",
  "script",
  "del",
  "link",
  "code",
  "person",
  "location", // Must be higher
];

Quill.register("modules/clipboard", PlainClipboard, true);

Quill.register(BoldBlot, true);
Quill.register(CiteBlot, true);
Quill.register(DelBlot, true);
Quill.register(ItalicBlot, true);
Quill.register(LineBreak, true);
Quill.register(LinkBlot, true);
Quill.register(LocationBlot, true);
Quill.register(NoteBlot, true);
Quill.register(PageBlot, true);
Quill.register(ParagraphBlot, true);
Quill.register(PersonBlot, true);
Quill.register(SuperscriptBlot, true);

function lineBreakMatcher() {
  var newDelta = new Delta();
  newDelta.insert({ linebreak: "" });
  return newDelta;
}
function escape() {
  if (!this.open) return true;
  this.close();
}

const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

const options = {
  modules: {
    history: {
      userOnly: true,
    },

    clipboard: {
      matchers: [["lb", lineBreakMatcher]],
    },
    keyboard: {
      bindings: {
        linebreak: {
          key: 13,
          shiftKey: true,
          handler: function (range) {
            this.quill.insertEmbed(range.index, "linebreak", true, "user");
            console.log("LettresQuill linebreak handler");
            this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
          },
        },
        escape: {
          key: 27, // escape
          handler: function (evt) {
            console.log("evt", evt);
            this.quill.cancelInput(evt);
          },
        },
        "list autofill": {
          //resolving https://github.com/chartes/lettres-vue/issues/63
          prefix: /^\s*()$/,
        },
        "embed left": makeEmbedArrowHandler(LEFT_ARROW, false),
        "embed left shift": makeEmbedArrowHandler(LEFT_ARROW, true),
        "embed right": makeEmbedArrowHandler(RIGHT_ARROW, false),
        "embed right shift": makeEmbedArrowHandler(RIGHT_ARROW, true),
      },
    },
  },
  placeholder: null,
};

function getBlotRange(quill, blot) {
  return {index: blot.offset(quill.scroll), length: blot.length()}

}

/**
 * Creates handlers for LeftArrow (37) and RightArrow (39)
 */
function makeEmbedArrowHandler(key, shiftKey) {
  const where = key === LEFT_ARROW ? "prefix" : "suffix";
  return {
    key,
    shiftKey,
    altKey: null,
    collapsed: true,
    [where]: /^$/,
    handler(initialRange) {
      let { index } = initialRange;
      if (key === RIGHT_ARROW) {
        index += initialRange.length + 1;
      }
      const [leaf, _] = this.quill.getLeaf(index);
      if (leaf instanceof Embed) {
        const blotRange = getBlotRange(this.quill, leaf) 
        this.quill.setSelection(
          blotRange.index,
          blotRange.length,
          Quill.sources.USER
        );
        return false;
      }
      return true;
    },
  };
}

const Parchment = Quill.import("parchment");

function getNewQuill(elt, opt = null) {
  const opts = { ...options, ...opt };
  console.log("quill options:", elt, opts);

  let quill = new Quill(elt, opts);
  var length = quill.getLength();
  var text = quill.getText(length - 2, 2);
  // Remove extraneous new lines

  if (text === "\n\n") {
    quill.deleteText(quill.getLength() - 2, 2);
  }

  // fix placeholder not showing
  if (quill.getLength() === 4) {
    quill.setText("");
  }

  elt.addEventListener("click", (event) => {
    const blot = Parchment.find(event.target, true);
    if (blot instanceof PageBlot || blot instanceof NoteBlot) {
      quill.setSelection(blot.offset(quill.scroll), 1, Quill.sources.USER);
    }
  });

  return quill;
}

export { getNewQuill, Inline, Embed, options, Quill as default };
