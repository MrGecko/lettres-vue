<template>
  <div class="note-list-parent">
    <ol
      v-if="notes.length"
      class="note-list notes"
    >
      <li
        v-for="note in notes"
        :id="note.id"
        :key="note.id"
      >
        <div
          class="note-item"
          :class="noteItemClass"
        >
          <div
            class="note-item__text"
            v-html="note.content"
          />
          <a
            v-if="editable"
            class="note-item__edit"
            @click="openNoteEdit(note)"
          >
            <icon-pen-edit />
          </a>
          <a
            v-if="editable"
            class="note-item__delete"
            @click="noteId = note.id"
          >
            <icon-bin />
          </a>
        </div>
      </li>
    </ol>

    <modal-confirm-note-delete
      v-if="noteId"
      :note-id="noteId"
      :cancel="cancelNoteDelete"
      :submit="confirmNoteDelete"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";
import {
  removeContentEditableAttributesFromString,
  removeContentEditableAttributesFromObject,
} from "../../modules/document-helpers";
import IconBin from "../ui/icons/IconBin";
import IconPenEdit from "../ui/icons/IconPenEdit";
import ModalConfirmNoteDelete from "../forms/ModalConfirmNoteDelete";

export default {
  name: "DocumentNotes",
  components: { ModalConfirmNoteDelete, IconPenEdit, IconBin },
  props: {
    editable: {
      type: Boolean,
      default: false,
    },
    transcriptionEditor: {
      type: String,
      default: "",
    },
    addressEditor: {
      type: String,
      default: "",
    },
    titleEditor: {
      type: String,
      default: "",
    },
    argumentEditor: {
      type: String,
      default: "",
    },
  },
  emits: ["add-note", "refresh-title", "refresh-argument", "refresh-transcription", "refresh-address"],
  data() {
    return {
      noteId: null,
      noteWithMode: false,
      titleContent:"",
      argumentContent:"",
      transcriptionContent: "",
      addressContent: "",
    };
  },
  watch: {
     titleEditor: function() {
       this.titleContent = this.titleEditor;
     },
     argumentEditor: function() {
       this.argumentContent = this.argumentEditor;
     },
     transcriptionEditor: function(val) {
       console.log("DocumentNotes / watch / transcriptionEditor props", val)
       this.transcriptionContent = this.transcriptionEditor;
     },
     addressEditor: function() {
       this.addressContent = this.addressEditor;
     },
  },
  mounted() {
    this.titleContent = this.$props.titleEditor;
    console.log("DocumentNotes / mounted / this.$props.titleEditor", this.$props.titleEditor)
    console.log("DocumentNotes / mounted / this.titleContent", this.titleContent)
    this.argumentContent = this.$props.argumentEditor;
    console.log("DocumentNotes / mounted / this.$props.argumentEditor", this.$props.argumentEditor);
    this.transcriptionContent = this.$props.transcriptionEditor;
    console.log("DocumentNotes / mounted / this.transcriptionContent", this.transcriptionContent)
    this.addressContent = this.$props.addressEditor;
    console.log("DocumentNotes / mounted / this.addressContent", this.addressContent)
  },
  computed: {
    ...mapState("document", ["document", "notes", "witnesses"]),
    noteItemClass() {
      return this.editable ? "note-item--editable" : false;
    },
  },
  methods: {
    confirmNoteDelete(noteIdToDelete) {
      console.log("confirmNoteDelete(noteId)", noteIdToDelete)
      let noteToDeleteIndex = this.$store.state.document.notes.findIndex(n => n.id === noteIdToDelete);
      let notesToRenumber = this.$store.state.document.notes.filter((_, index) => index > noteToDeleteIndex);
      if (notesToRenumber.length === 0) {
        this.$store.dispatch("document/removeNote", noteIdToDelete).then((noteIdToDelete) => {
            this.removeNoteFromDocument(noteIdToDelete, notesToRenumber);
        this.cancelNoteDelete();
        });
      } else {
          this.$store.dispatch("document/removeNote", noteIdToDelete).then((noteIdToDelete) => {
            this.removeNoteFromDocument(noteIdToDelete, notesToRenumber);
            this.cancelNoteDelete();
        });
      }
    },
    cancelNoteDelete() {
      this.noteId = false;
    },
    openNoteEdit(note) {
      console.log("DocumentNotes / openNoteEdit / note", note)
      this.noteWithMode = {note: note};
      this.noteWithMode.action = "update";
      this.$emit("add-note", this.noteWithMode);
    },
      removeNoteFromSection(sectionContent, noteId, notesToRenumber) {
        const sectionWithoutContentEditable = removeContentEditableAttributesFromString(
            sectionContent
          );
          const sectionDOM = new DOMParser().parseFromString(sectionWithoutContentEditable, "text/html")
          const toRemove = sectionDOM.querySelectorAll(`.note[href="#${noteId}"]`)
          let changed = false;
          if (toRemove.length > 0) {
            changed = true
            toRemove.forEach(element => element.remove())
          }
          if (notesToRenumber) {
            notesToRenumber.forEach(n => {
                const foundNotes = sectionDOM.querySelectorAll(`.note[href="#${n.id}"]`)
                if (foundNotes.length > 0) {
                  changed = true
                  let newNoteIndex = this.$store.state.document.notes.findIndex(note => note.id === n.id) + 1;
                  foundNotes.forEach(noteElement => {
                    noteElement.innerHTML = `[${newNoteIndex}]`
                  })
                }
            })
          }

          if (changed) {
            return sectionDOM.body.outerHTML
          }
          return 

      },
      removeNoteFromDocument(noteId, notesToRenumber) {
        const attributes = {};
        let changed = false;
        if (this.transcriptionContent) {
          const newTranscription = this.removeNoteFromSection(this.transcriptionContent, noteId, notesToRenumber);
          if (newTranscription) {
            attributes.transcription = newTranscription;
            this.$emit("refresh-transcription", newTranscription);
            changed = true
          }
        }
        if (this.addressContent) {
          const newAddressContent = this.removeNoteFromSection(this.addressContent, noteId, notesToRenumber);
          if (newAddressContent) {
            attributes.address = newAddressContent;
            this.$emit("refresh-address", newAddressContent);
            changed = true
          }
        }
        if (this.titleContent) {
          const newTitleContent = this.removeNoteFromSection(this.titleContent, noteId, notesToRenumber);
          if (newTitleContent) {
            attributes.title = newTitleContent;
            this.$emit("refresh-title", newTitleContent);
            changed = true
          }
        }
        if (this.document["creation-label"]) {
          const newCreationLabel = this.removeNoteFromSection(this.document["creation-label"], noteId, notesToRenumber);
          if (newCreationLabel) {
            attributes['creation-label'] = newCreationLabel;
            changed = true
          }
        }
        if (this.argumentContent) {
          const newArgumentContent = this.removeNoteFromSection(this.argumentContent, noteId, notesToRenumber);
          if (newArgumentContent) {
            attributes.argument = newArgumentContent;
            this.$emit("refresh-argument", newArgumentContent);
            changed = true
          }
        }
        if (changed) {
          const data = { id: this.document.id, attributes };
          this.$store
            .dispatch("document/save", data)
            .then((response) => {
              if (attributes.transcription) {
                this.transcriptionContent = attributes.transcription;
              }
              if (attributes.address) {
                this.addressContent = attributes.address;
                console.log("attributes.address changed")
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }
      },
    removeNoteFromWitnesses(noteId) {
      const pattern = new RegExp(
        '<a class="note" href="#' + noteId + '">\\[\\d+]<\\/a>',
        "gi"
      );//<a class="note" href="#' + noteId + '">\\[note\\]<\\/a>'
      this.witnesses.forEach((wit, index) => {
        const w = { ...wit };
        removeContentEditableAttributesFromObject(w);
        const inContent = pattern.test(w.content);
        const inClassification = pattern.test(w["classification-mark"]);
        let changed = false;
        if (inContent) {
          w.content = w.content.replace(pattern, "");
          changed = true;
        }
        if (inClassification) {
          w["classification-mark"] = w["classification-mark"].replace(pattern, "");
          changed = true;
        }
        if (changed) {
          this.$store
            .dispatch("document/updateWitness", w)
            .then((response) => {})
            .catch((err) => {
              console.error(err);
            });
        }
      });
    },
  },
};
</script>

<style scoped>

.note-list-parent {
  /* border-top: solid 1px #ccc; */
}

</style>
