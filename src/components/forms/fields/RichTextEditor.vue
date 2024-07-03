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
import Vue from "vue";
import ClickOutside from "vue-click-outside";
import EditorButton from "./EditorButton.vue";
import TextfieldForm from "../TextfieldForm";
import FieldLabel from "./FieldLabel";
import EditorMixins from "@/components/forms/editor/EditorMixins";

import Quill, { getNewQuill } from "../../../modules/quill/LettresQuill";
import { getNewDelta } from "../../../modules/quill/DeltaUtils";
import _isEmpty from "lodash/isEmpty";
import PersonBlot from "@/modules/quill/blots/Person";

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
      editorHasFocus: false,
      currentSelection: null,
      formTextfield: null,
      actionsPositions: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      editorInited: false,
      delta: null,
      customSubmitTextfieldForm: null,
      buttons: {},
      showNoteActionForm: false,
      requireSave: false,
    };
  },

  computed: {
    formatCallbacks() {
      return {
        note: { cb: this.displayNoteActionForm, active: this.editorHasFocus },
        page: { cb: this.displayPageBreakForm, active: this.editorHasFocus },
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
  },

  watch: {
    value(val) {
      console.log("watch", val)
      const range = this.editor.getSelection();
      this.editorContentElement.innerHTML = this.sanitize(val);
      if (this.requireSave) {
        this.$emit("save");
        this.requireSave = false;
      }
      Vue.nextTick(() => {
        if (range) {
          //console.log('setSelection', range.index)
          this.editor.setSelection(range.index, range.length, Quill.sources.SILENT);
        }
      });
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
      /*if (!this.multiline) {
        this.editorElement.addEventListener("keydown", this.onSingleKeyup, true);
      }*/
      this.editorElement.addEventListener("keydown", this.onSingleKeyup, true);
      this.editor.on("selection-change", this.onSelection);
      this.editor.on("selection-change", this.onFocus);
      this.editor.on("text-change", this.onTextChange);
      this.editor.on("text-change", this.updateValue);
    },
    deactivateEvents() {
      //console.log("EditorMixins.deactivateEvents")
      this.editorElement.removeEventListener("keydown", this.onSingleKeyup, true);
      this.editor.off("selection-change", this.onSelection);
      this.editor.off("selection-change", this.onFocus);
      this.editor.off("text-change", this.onTextChange);
      this.editor.off("text-change", this.updateValue);
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

    preventLineBreaks(delta) {
      const ops = delta.ops;
      const l = ops.length;
      return;
      /*
        if (ops[l-1].insert && ops[l-1].insert === '\n') {
          const updateDelta = getNewDelta();
          if (l === 1) {
             updateDelta.delete(1)
          } else {
            const retain = ops[l-2].retain;
            updateDelta.retain(retain).delete(1)
          }
          this.editor.updateContents(updateDelta, 'silent')
        }
         */
    },

    /**************
     *
     * EDITOR EVENT HANDLERS
     */

    onTextChange(delta, oldDelta, source) {
      if (!this.multiline) {
        this.preventLineBreaks(delta);
      }
      console.log("RTE onTextChange", delta, oldDelta, source)
      if (delta.ops.length > 1 && delta.ops[1].delete) {
        const diff = this.editor.getContents().diff(oldDelta).ops
        console.log(' diff_del', diff)
        diff.forEach(child => {
          if (child.attributes && child.attributes.note) {
            console.log("a note was deleted")
          }

        })
      } else {
              console.log("addition delta ops / oldDelta", delta.ops)
              if (delta.ops.length > 1 && delta.ops[1].insert) {
                const diff = oldDelta.diff(this.editor.getContents()).ops
                console.log(' diff_add', diff)
                diff.forEach(child => {
                  if (child.attributes && child.attributes.note) {
                    console.log("a note was added")
                  }

                })
              }

      }

      return;
      /*
        if (delta.ops.length > 1 && delta.ops[1].delete) {
          const diff = this.editor.getContents().diff(oldDelta).ops
          console.log(' diff', diff, diff.length > 1 && diff[1].insert && diff[1].insert.note)
        }
        */
    },
    async onSelection(range) {
      console.log("RTE onSelection range", range)
      console.log("RTE onSelection blots", this.editor.getContents(range.index, range.length).ops)
      if (range) {
        this.setRangeBound(range);
        let formats = this.editor.getFormat(range.index, range.length);
        /*if (formats.person && !formats.person.label) {
          await this.$store.dispatch("persons/getPersonById", formats.person.id).then(
              (response) => {
                formats.person.label = response.attributes.label
              });
          this.expandSelection(range)
          this.editor.format("person", formats.person);

        }*/

        console.log("onSelection / formats", formats);
        if (["bold"].includes(Object.keys(formats)[0])) {
          if (range.length === 0) {
            let [node, Offset] = this.editor.getLeaf(range.index)
            console.log("node : ", node)
            let start = range.index - Offset;
            console.log(node.text)
            let length = node.text.length
            console.log("length : ", length)
            let end = start + length;
            console.log("start : ", start)
            console.log("end : ", end)
            console.log("node.parent.domNode.nodeName", node.parent.domNode.nodeName.toLowerCase())
            this.editor.setSelection(start, length, Quill.sources.SILENT)
          }
        } else if (["page", "note"].includes(Object.keys(formats)[0])) {
          if (range.length === 0) {
            let [node, Offset] = this.editor.getLeaf(range.index)
            console.log("node : ", node)
            console.log("Offset : ", Offset)
            let start = range.index - Offset;
            console.log("start : ", start)
            let length = node.parent.domNode.text.length
            console.log("node.contentNode.textContent", node.parent.domNode.text.length)
            let end = start + length;
            console.log("end : ", end)
            console.log("node.contentNode.textContent.length", node.parent.domNode.text.length)
            this.editor.setSelection(start, length, Quill.sources.SILENT)
          }
        }/* else if (["note"].includes(Object.keys(formats)[0])) {
          if (range.length === 0) {
            let [node, Offset] = this.editor.getLeaf(range.index)
            console.log("node : ", node)
            console.log("Offset : ", Offset)
            let start = range.index - Offset;
            console.log("start : ", start)
            let length = node.contentNode.textContent.length
            console.log("node.contentNode.textContent", node.contentNode.textContent)
            let end = start + length;
            console.log("end : ", end)
            console.log("node.contentNode.textContent.length", node.contentNode.textContent.length)
            this.editor.setSelection(start, length, Quill.sources.SILENT)
          }
        }*/
        this.updateButtons(formats);
        /* if (formats.note) {
          console.log("onSelection / formats.note", formats.note)
        }*/
      } else {
        /*let test = this.editor.getContents().ops
        console.log("content test : ", test)*/
        this.updateButtons({});
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
    onFocus() {
      this.editorHasFocus = this.editor.hasFocus();
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
      console.log("RichTextEditor simpleFormat this.editor.format(formatName, value)", formatName, value)
      this.editor.format(formatName, value);
      let formats = this.editor.getFormat(selection.index, selection.length);
      this.updateButtons(formats);
    },

    insertPageBreak(pageNum) {
      this.insertEmbed("page", pageNum);
    },
    insertEmbed(formatName, value) {
      console.log("RTE insertEmbed(formatName, value)", formatName, value)
      console.log("insertEmbed", formatName, value);
      let format = {};
      format[formatName] = value;
      let range = this.editor.getSelection(true);
      this.editor.insertEmbed(range.index, formatName, value, Quill.sources.API);
      this.editor.setSelection(range.index + 2, Quill.sources.SILENT);
    },

    updateButtons(formats) {
      console.log('update buttons', formats)
      /*2023 07 7 changed logic to refresh child props (undetected attribute updates per code below :
      if (_isEmpty(formats)) formats = { paragraph: true };
      for (let key in this.buttons) {
        this.buttons[key] = !!formats[key];
      }*/
      let keys = Object.keys(formats);
      console.log('update buttons keys', keys)


      //resetting all buttons to false
      Object.keys(this.buttons).forEach(v => this.buttons[v] = false);
      //using spread op to recreate object to trigger child props update
      for (let index in keys) {
        console.log('update buttons key', keys[index])
        let updatedFormat = !!formats[keys[index]];
        console.log('update buttons updatedFormat', updatedFormat)
        this.buttons = {...this.buttons, [keys[index]]: updatedFormat};
      }
      console.log("this.buttons", this.buttons)
    },

    setRangeBound(range) {
      let rangeBounds = this.editor.getBounds(range);
      this.actionsPositions.left = rangeBounds.left;
      this.actionsPositions.right = rangeBounds.right;
      this.actionsPositions.bottom = rangeBounds.bottom;
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
    NoteActionPreparation() {
      const pattern = /\[note]/gmi
      let testEditor = this.editor.getText(0,)
      console.log("testEditor", testEditor)
      let inTranscription = pattern.test(testEditor);
        console.log("inTranscription", inTranscription)
      if (inTranscription) {
        this.$emit("add-note", "test")
      } else {
        this.displayNoteActionForm()
      }
    },
    displayNoteActionForm() {
      const range = this.editor.getSelection();
      const selection = this.editor.getText(range.index, range.length);
      const formats = this.editor.getFormat();
      console.log("displayNoteActionForm range, selection, formats", range, selection, formats)

      if (formats.note) {
        this.selectedNoteId = formats.note.id;
      } else {
        console.log("displayNoteActionForm New Note")
      }
      console.log("displayNoteActionForm range, selection, formats", range, selection, formats)

      const _editor = this.editor;

      let restoreRangeCallback = function() {
        _editor.setSelection(range.index, range.length, Quill.sources.SILENT);
      }

      this.$emit("add-note", {
        role: "inlined",
        selection,
        formats,
        restoreRangeCallback,
        insertTagCallback: this.submitNoteActionForm,
        removeTagCallback: this.removeNoteActionForm,
      });
    },
    submitNoteActionForm(note) {
      this.requireSave = true;
      console.log("RTE / submitNoteActionForm : note ", note)
      this.editor.format("note", {note: note});
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
      this.editor.setSelection(0, 0)
    },
    removeNoteActionForm() {
      this.requireSave = true;
      this.editor.format("note", false);
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
    },

    addNote(evt) {
      console.log("transcription RTE addNote(evt)", evt, {...evt})
      this.$emit("add-note", evt);
    },

    /**************
     *
     * TEXTFIELD FORM METHODS
     */

    displayTextfieldForm(formData) {
      let format = this.editor.getFormat();
      console.log("displayTextfieldForm format : ", format)
      if (format.href) {
        formData.value = format.pageNum;
        formData.url = format.href;
      } else {
        console.log("new page break")
      }
      console.log("displayTextfieldForm formData : ", formData)
      /*if (formData.format === 'page') {
        formData.href ===
      }*/
      this.formTextfield = formData;
      console.log("displayTextfieldForm this.formTextfield : ", this.formTextfield)
    },
    closeTextfieldForm() {
      this.formTextfield = null;
      this.customSubmitTextfieldForm = null;
    },
    removeTextfieldForm() {
      this.editor.format(this.formTextfield.format, false);
      console.log("removeTextfieldForm this.formTextfield.format", this.formTextfield.format)
      /*if (this.formTextfield.format === "page") {
        this.removeFormat()
      }*/
      this.formTextfield = null;
    },
    submitTextfieldForm(data) {
      console.log("submitTextfieldForm(data)", data)
      this.editor.format(this.formTextfield.format, data);
      this.closeTextfieldForm();
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
    },
    removeFormat() {
      //console.log("removeFormat", this.formTextfield.format)
      const formatName = this.formTextfield.format;
      const selection = this.editor.getSelection();
      this.editor.format(formatName, "");
      this.closeTextfieldForm();
      let formats = this.editor.getFormat(selection.index, selection.length);
      this.updateButtons(formats);
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
      // console.log("displayLocationForm range, selection, formats", range, selection, formats);

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
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
    },
    removeLocationForm() {
      this.editor.format("location", false);
      let formats = this.editor.getFormat();
      console.log("removeLocationForm", formats);
      this.updateButtons(formats);
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
      const range = this.editor.getSelection();
      const selection = this.editor.getText(range.index, range.length);
      const formats = this.editor.getFormat();
      console.log("displayPageBreakForm range", range)
      console.log("displayPageBreakForm formats", formats)
      this.updateButtons(formats);
      //this.customSubmitTextfieldForm = this.submitPageBreakForm;
      if (formats.page && formats.page.href && formats.page.pageNum) {
        this.displayTextfieldForm({
          format: "page",
          title: '<i class="fas fa-page"></i> Insérer un saut de page',
          label: "Numéro de page",
          url: formats.page.href,
          value: formats.page.pageNum,
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

    submitPageBreakForm(pageNum) {
      console.log("submitPageBreakForm", pageNum);
      this.insertEmbed("page", pageNum);
      this.closeTextfieldForm();
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
    },
    removePageBreakForm() {
      this.editor.format("page", false);
      let formats = this.editor.getFormat();
      console.log("removePageBreakForm", formats);
      this.updateButtons(formats);
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
      console.log("submitPersonForm / person", person)
      this.editor.format("person", person);
      let formats = this.editor.getFormat();
      this.updateButtons(formats);
    },
    removePersonForm() {
      this.editor.format("person", false);
      let formats = this.editor.getFormat();
      console.log("removePersonForm", formats)
      this.updateButtons(formats);
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
