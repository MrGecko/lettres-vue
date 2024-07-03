<template>
  <div
    class="field rich-text-editor"
    style="width: 100%"
  >
    <div class="editor-area">
      <div
        ref="controls"
        class="editor-controls"
      >
        <div
          v-for="(group, gindex) in formats"
          :key="gindex"
          class="editor-controls-group field has-addons"
        >
          <editor-button
            v-for="format in group"
            :key="format"
            :active="formatCallbacks[format].active"
            :callback="formatCallbacks[format].cb"
            :selected="buttons[format]"
            :format="format"
          />
        </div>
        <div
          class="editor-controls-group field has-addons"
        >
          <editor-button
            :active="editorHasFocus"
            :callback="clearFormat"
            :selected="false"
            format="remove"
          />
        </div>

        <div
          v-if="slotNotEmpty"
          class="editor-controls-group is-additional"
        >
          <slot />
        </div>
      </div>

      <div class="editor-container">
        <div
          ref="editor"
          class="quill-editor"
          :class="{ 'single-line': !multiline }"
          spellcheck="false"
        />
      </div>
      <textfield-form
        v-if="formTextfield"
        :title="formTextfield.title"
        :label="formTextfield.label"
        :format="formTextfield.format"
        :value="formTextfield.value"
        :url="formTextfield.url ? formTextfield.url : ''"
        :submit="formTextfield.format === 'page' ? submitTextfieldForm : submitTextfieldForm"
        :cancel="closeTextfieldForm"
        :remove="removeTextfieldForm"
      />
      <pre
        v-if="debug"
        style="white-space: normal"
      >{{ value }}</pre>
    </div>
  </div>
</template>

<script>
import ClickOutside from "vue-click-outside";
import EditorButton from "./EditorButton.vue";
import TextfieldForm from "../TextfieldForm";

import Quill, { Embed, getNewQuill } from "../../../modules/quill/LettresQuill";
import { getNewDelta } from "../../../modules/quill/DeltaUtils";
import _isEmpty from "lodash/isEmpty";
import NoteBlot from "@/modules/quill/blots/Note";
import PageBlot from "@/modules/quill/blots/Page";

const Parchment = Quill.import("parchment");

const wrapPattern = /^<p>(.*)<\/p>$/im;

export default {
  name: "RichTextEditor",
  components: {
    TextfieldForm,
    EditorButton,
  },
  directives: {
    ClickOutside,
  },
  props: {
    label: { type: String, default: null },
    value: { type: String, default: "" }, // v-model support
    multiline: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    formats: {
      type: Array,
      default: () => [
        ["note", "page", "link"],
        ["bold", "italic", "superscript", "underline", "del"],
        ["person", "location", "cite"],
      ],
    },
    options: { type: Object, default: () => {} },
  },
  emits: ["add-place", "add-person", "add-note", "on-keyup-escape", "refresh-title", "refresh-transcription", "refresh-address", "refresh-argument", "save"],
  data() {
    return {
      debug: false,
      editor: null,
      editorElement: null,
      editorContentElement: null,
      currentSelection: null,
      formTextfield: null,
      editorInited: false,
      delta: null,
      showNoteActionForm: false,
      requireSave: false,
    };
  },

  computed: {
    formatCallbacks() {
      return {
        note: { cb: this.displayNoteActionForm, active: this.editorHasFocus && (!this.selectedEmbed  || this.selectedEmbed instanceof NoteBlot)},
        page: { cb: this.displayPageBreakForm, active: this.editorHasFocus && (!this.selectedEmbed || this.selectedEmbed instanceof PageBlot)},
        link: { cb: this.displayLinkForm, active: this.editorHasFocus },
        bold: { cb: this.simpleFormat, active: this.editorHasFocus },
        italic: { cb: this.simpleFormat, active: this.editorHasFocus },
        superscript: { cb: this.simpleFormat, active: this.editorHasFocus },
        underline: { cb: this.simpleFormat, active: this.editorHasFocus },
        del: { cb: this.simpleFormat, active: this.editorHasFocus },
        person: { cb: this.displayPersonForm, active: this.editorHasFocus },
        location: { cb: this.displayLocationForm, active: this.editorHasFocus },
        cite: { cb: this.simpleFormat, active: this.editorHasFocus },
        close: { cb: this.onClose, active: true }
      };
    },
    isNoteButtonActive() {
      if (!this.editor) return;
      const selection = this.editor.getSelection();
      const cond =
        this.editorHasFocus &&
        //&& this.buttons.note
        !selection.length;
      return cond;
    },
    slotNotEmpty() {
      return !!this.$slots.default;
    },
    editorHasFocus() {
      return this.currentSelection !== null;
    },
    selectedEmbed() {
      if (this.currentSelection && this.currentSelection.length === 1) {
        const [node, _] = this.editor.getLeaf(this.currentSelection.index+1)

        if (node instanceof Embed) {
          return node;
        }
      }
      return null
    },
    selectedFormats() {
      const range = this.currentSelection;
      if (range === null) {
        return {}
      }
      const formats = this.editor.getFormat(this.currentSelection)
      const embed = this.selectedEmbed;
      if (embed) {
          const blotName = embed.statics.blotName;
          formats[blotName] = embed.value()[blotName];
      }
      return formats
    },
    buttons() {
      return Object.fromEntries(Object.entries(this.selectedFormats).map(([key, value]) => [key, !!value]))
     }
  },

  watch: {
    value(val) {
      if (this.requireSave) {
        this.editorContentElement.innerHTML = this.sanitize(val);
        this.$emit("save");
        this.requireSave = false;
      }
    },
    enabled(val) {
      this.editor.enable(val);
    },
  },
  mounted() {
    console.log("mounted value: ", this.$props.value)
    console.log("mounted editor, props.value, buttons", this.$refs.editor, this.$props.value, this.buttons)
    this.initEditor(this.$refs.editor, this.$props.value);

    let flattenFormats = [];
    this.$props.formats.forEach((group) => {
      flattenFormats.push(...group);
    });
    flattenFormats.forEach((format) => {
      this.buttons[format] = false;
    });
  },
  beforeDestroy() {
    this.deactivateEvents();
  },
  methods: {
    initEditor(editorElement, initialContent) {
      console.log("initEditor1", editorElement, initialContent);
      editorElement.innerHTML = this.sanitize(initialContent);
      console.log("initEditor2", editorElement, editorElement.innerHTML);
      this.editor = getNewQuill(editorElement, this.$props.options);
      console.log("RTE initEditor getNewQuill", this.editor)

      this.editorElement = editorElement;
      this.editorContentElement = editorElement.children[0];
      console.log("init editor3", this.editorContentElement)
      this.activateEvents();
      console.log("RTE initEditor activateEvents")
      this.editor.updateContents(getNewDelta().retain(this.editor.getLength(), "silent"));
      console.log("RTE initEditor updateContents", this.editor.innerHTML)
      this.editorInited = true;
    },

    activateEvents() {
      this.editorElement.addEventListener("keydown", this.onSingleKeyup, true);
      this.editor.on("editor-change", this.onEditorChange);
      this.editor.on("text-change", this.updateValue);
    },

    deactivateEvents() {
      this.editorElement.removeEventListener("keydown", this.onSingleKeyup, true);
      this.editor.off("editor-change", this.onEditorChange);
      this.editor.off("text-change", this.updateValue);
    },

    clearFormat() {
      const format = this.editor.getFormat();
      if (!_isEmpty(format)) {
        for (const formatName of Object.keys(format)) {
          this.editor.format(formatName, false)
        }
      }
    },

    getEditorHTML() {
      return this.editorContentElement.innerHTML;
    },

    /**************
     *
     * V-MODEL SUPPORT
     */

    updateValue() {
      console.log("RTE updateValue")
      const content = this.getEditorHTML();
      content.replace(' contenteditable="false"', "");
      if (this.multiline) {
        console.log("RTE updateValue multiline")
        console.log("RTE updateValue content", content.replace(/<p><br><\/p>$/, ""))
        return this.$emit("input", content.replace(/<p><br><\/p>$/, ""));
              }
      let inputValue = content.replace(/<(\/)*p>/gi, "");
      inputValue = inputValue === "<br>" ? "" : inputValue;
      this.$emit("input", inputValue);
    },

    updateContent() {
      console.log("RTE updateContent", this.delta)
      this.delta = this.editor.getContents().ops;
    },

    /**************
     *
     * SANITIZE
     */

    sanitize(val) {
      let newValue = val || "";
      console.log("sanitize", val)
      newValue = newValue.replace(/\n/gim, "");
      if (!this.multiline) {
        newValue = newValue.replace(/<(br)?(\/)?(p)?>/gi, "");
      }
      if (newValue.length) {
        const test = wrapPattern.test(newValue);
        newValue = test ? newValue : `<p>${newValue}</p>`;
      }
      //30 08 2023 remove below logic to prevent adding <p><br></p> to database when empty content is saved in editor
      //newValue = newValue === "" ? "<br>" : newValue;
      //const test = wrapPattern.test(newValue);
      //newValue = test ? newValue : `<p>${newValue}</p>`;
      // console.log("RTE sanitize : ", val, newValue)
      console.log("sanitize", newValue)
      if (this.$props.label === "title") {
        this.$emit("refresh-title",  newValue)
      } else if (this.$props.label === "transcription") {
        console.log("this.$props.label === \"transcription\"")
        this.$emit("refresh-transcription", newValue)
      } else if (this.$props.label === "address") {
        this.$emit("refresh-address", newValue)
      } else if (this.$props.label === "argument") {
        console.log("this.$props.label === \"argument\"")
        this.$emit("refresh-argument", newValue)
      }
      return newValue;
    },

    /**************
     *
     * EDITOR EVENT HANDLERS
     */
    async onEditorChange(eventName, range) {
      if (eventName !== "selection-change") {
        return
      }
      if (!this.formTextfield) {
        this.currentSelection = range;
      }
    },
    onSingleKeyup(evt) {
      if (evt.code === "Escape") {
        console.log("RTE on-keyup-escape", evt)
        this.$emit("on-keyup-escape", evt);
      }
      /* deactivating @on-keyup-enter="clickSave", since there is a save button, as it prevented key stroke on some editors
      else if (evt.code === "Enter") {
        console.log("onSingleKeyup Enter", evt)

        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        this.$emit("on-keyup-enter");
      }*/
    },
    onClose() {
      this.$emit("on-keyup-escape");
    },

    simpleFormat(formatName) {
      let selection = this.editor.getSelection();
      let format = this.editor.getFormat(selection.index, selection.length);
      // expand range selection to whole Blot if preexisting Blot
      if (["italic", "superscript"].includes(Object.keys(format)[0])) {
        this.expandSelection({ index: selection.index + 1, length: selection.length -1});
      }

      let value = !format[formatName];
      this.editor.format(formatName, value);
    },

    insertPageBreak(pageNum) {
      this.insertEmbed("page", pageNum);
    },
    insertEmbed(formatName, value) {
      let format = {};
      format[formatName] = value;
      let range = this.editor.getSelection(true);
      this.editor.insertEmbed(range.index, formatName, value, Quill.sources.API);
      this.editor.setSelection(range.index + 2, Quill.sources.SILENT);
    },

    // expand range selection to whole Blot if preexisting Blot ("person", "location", "italic", "superscript", "link")
    expandSelection(range) {
      console.log("expandSelection original range : ", range)
      let [node, Offset] = this.editor.getLeaf(range.index)
      console.log("node : ", node)
      // check if user selected range differ from preexisting Blot
      if (range !== node.text.length) {
        let start = range.index - Offset;
        let length = node.text.length;
        let end = start + length;
        console.log("expandSelection Blot name, class, start, end, length : ", node.parent.domNode.nodeName.toLowerCase(), node.parent.domNode.getAttribute("class"), start, end, length);
        this.editor.setSelection(start, length)
      }
    },

    /**************
     *
     * NOTES METHODS
     */
    displayNoteActionForm() {
      const {note} = this.selectedFormats
      if (note) {
        this.selectedNoteId = note.id;
      } else {
        console.log("displayNoteActionForm New Note")
      }

      const _editor = this.editor;

      let restoreRangeCallback = function() {
        _editor.setSelection(this.currentSelection.index, this.currentSelection.length, Quill.sources.SILENT);
      }

      this.$emit("add-note", {
        role: "inlined",
        selection: this.currentSelection,
        note: note || null,
        restoreRangeCallback,
        insertTagCallback: this.submitNoteActionForm,
        removeTagCallback: this.removeNoteActionForm,
      });
    },
    submitNoteActionForm(note) {
      this.requireSave = true;
      console.log("RTE / submitNoteActionForm : note ", note)
      this.editor.format("note", note);
      let formats = this.editor.getFormat();
      this.editor.setSelection(0, 0)
    },
    removeNoteActionForm() {
      this.requireSave = true;
      this.selectedEmbed.remove()
    },

    /**************
     *
     * TEXTFIELD FORM METHODS
     */

    displayTextfieldForm(formData) {
      this.formTextfield = formData;
    },
    closeTextfieldForm() {
      this.formTextfield = null;
    },
    removeTextfieldForm() {
      if (["page"].includes(this.formTextfield.format)) {
        if (this.selectedEmbed) {
          this.selectedEmbed.remove()
        }
      } else {
        this.editor.format(this.formTextfield.format, false);
      }
      this.closeTextfieldForm()
    },
    submitTextfieldForm(data) {
      if (["page"].includes(this.formTextfield.format)) {
        // Embed blots (excluding notes which have their)
        if (this.selectedEmbed) {
          this.selectedEmbed.replaceWith(Parchment.create(this.formTextfield.format, data));
        } else {
          this.insertEmbed(this.formTextfield.format, data);
        }
      } else {
        // Inline blots
        this.editor.format(this.formTextfield.format, data);
      }
      this.closeTextfieldForm();
    },

    /**************
     *
     * LOCATION METHODS
     */

    displayLocationForm() {
      let range = this.editor.getSelection();
      let selection = this.editor.getText(range.index, range.length);
      const formats = this.editor.getFormat();
      // expand range selection to whole Blot if preexisting Blot
      if (formats.location) {
        this.expandSelection(range);
      }
      // update range, selection with expanded Blot if preexisting Blot
      range = this.editor.getSelection();
      selection = this.editor.getText(range.index, range.length);

      const _editor = this.editor;

      function restoreRangeCallback() {
        _editor.setSelection(range.index, range.length, Quill.sources.SILENT);
      }

      this.$emit("add-place", {
        role: "inlined",
        selection,
        formats,
        restoreRangeCallback,
        insertTagCallback: this.submitLocationForm,
        removeTagCallback: this.removeLocationForm,
      });
    },
    submitLocationForm(place) {
      this.editor.format("location", place);
    },
    removeLocationForm() {
      this.editor.format("location", false);
    },

    /**************
     *
     * LINK METHODS
     */

    displayLinkForm() {
      const range = this.editor.getSelection();
      const selection = this.editor.getText(range.index, range.length);
      const formats = this.editor.getFormat();
      // expand range selection to whole Blot if preexisting Blot
      if (formats.link) {
        this.expandSelection(range);
      }
      if (formats.link) {
        this.displayTextfieldForm({
          format: "link",
          title: '<i class="fas fa-link"></i> Insérer un lien',
          label: "URL du lien",
          value: formats.link,
          url: ""
        });
      } else {
      this.displayTextfieldForm({
        format: "link",
        title: '<i class="fas fa-link"></i> Insérer un lien',
        label: "URL du lien",
        value : "",
        url: ""
      });
      }


      /*this.displayTextfieldForm({
        format: "link",
        title: '<i class="fas fa-link"></i> Insérer un lien',
        label: "URL du lien",
        url: formats.link.href,
      });*/
    },

    /**************
     *
     * PAGE BREAK METHODS
     */

    displayPageBreakForm() {
      const {page} = this.selectedFormats;
      if (page) {
        this.displayTextfieldForm({
          format: "page",
          title: '<i class="fas fa-page"></i> Insérer un saut de page',
          label: "Numéro de page",
          url: page.href,
          value: page.pageNum,
        });
      } else {
      this.displayTextfieldForm({
        format: "page",
        title: '<i class="fas fa-page"></i> Insérer un saut de page',
        label: "Numéro de page",
        url : ""
      });
      }
    },

    /**************
     *
     * PERSON METHODS
     */

    async displayPersonForm() {
      let range = this.editor.getSelection();
      let selection = this.editor.getText(range.index, range.length);
      const formats = this.editor.getFormat();
      console.log("displayPersonForm formats", formats)
      // expand range selection to whole Blot if preexisting Blot
      if (formats.person) {
        this.expandSelection(range);
      }
      // update range, selection with expanded Blot if preexisting Blot
      range = this.editor.getSelection();
      selection = this.editor.getText(range.index, range.length);
      //console.log("displayPersonForm range, selection, formats", range, selection, formats)

      const _editor = this.editor;

      function restoreRangeCallback() {
        _editor.setSelection(range.index, range.length, Quill.sources.SILENT);
      }

      this.$emit("add-person", {
        role: "inlined",
        selection,
        formats,
        restoreRangeCallback,
        insertTagCallback: this.submitPersonForm,
        removeTagCallback: this.removePersonForm,
      });
    },
    submitPersonForm(person) {
      this.editor.format("person", person);
      this.editor.setSelection()
    },
    removePersonForm() {
      this.editor.format("person", false);
    },

    /**************
     *
     * CITE METHODS
     */

    displayCiteForm() {
      this.displayTextfieldForm({
        format: "cite",
        title: '<i class="fas fa-book"></i> Ajouter une mention bibliographique',
        label: "Référence",
      });
    },
  },
};
</script>


<style lang="scss" scoped>
@import "@/assets/sass/main.scss";

::v-deep {

  header.modal-card-head {
    background-color: #CB2158;
    border: none;
    border-radius: 5px;
    padding: 3px 20px;
    margin-bottom: 10px !important;

    p.modal-card-title {
      display: block;
      padding: 10px 0;
      font-family: $family-apptitle;
      font-size: 30px;
      color: #FFFFFF;
      font-weight: 200;
      letter-spacing: 0;
      text-transform: none;
    }
  }

  .modal-card-body {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }

  footer.modal-card-foot {
    background-color: #FFFFFF;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
}
/* RTE close button on right
.editor-controls {
  display: flex !important;
  flex-direction: row;
  .is-additional {
    flex: 1 !important;
    .close__button {
      display: inline-block;
      cursor: pointer;
      float: right;
      margin-left: 0;
      width: 40px;
      height: 40px;
      background: url(../../../assets/images/icons/close_text.svg) center / 18px auto no-repeat;
     i {
      display: none;
     }
    }
  }
} */
</style>
