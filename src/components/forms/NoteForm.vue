<template>
  <div
    v-if="inputData && !inputList && !noteIdToDelete"
    class="modal-card note-form"
  >
    <header class="is-uppercase is-size-2 mb-5">
      <h1>{{ $attrs.header }} : {{ inputData && inputData.note ? "éditer la note" : "nouvelle note" }}</h1>
    </header>
    <div class="editor">
      <rich-text-editor
        v-model="form.content"
        :formats="[
          ['bold', 'italic', 'superscript', 'underline', 'del'],
          ['link', 'person', 'location', 'cite'],
        ]"
        @add-place="addPlace($event, 'note')"
        @add-person="addPerson($event, 'note')"
      />
    </div>
    <div class="buttons">
      <b-button
        type="is-primary"
        size="is-medium"
        @click="submitAction"
      >
        Sauvegarder
      </b-button>
      <b-button
        :title="inputData.note ? 'Revenir au document' : 'Revenir à l\'éditeur'"
        type="is-primary"
        size="is-medium"
        @click="cancelAction"
      >
        Annuler
      </b-button>
    </div>
  </div>
  <div
    v-else-if="noteIdToDelete"
    class="modal-card note-form"
  >
    <modal-confirm-note-delete
      v-if="noteIdToDelete"
      :note-id="noteIdToDelete ? noteIdToDelete : null"
      :cancel="cancelNoteDelete"
      :submit="confirmNoteDelete"
    />
  </div>
  <div
    v-else
    class="modal-card note-form"
  >
    <header class="is-uppercase is-size-2 mb-5">
      <h1>{{ $attrs.header }} : {{ existingNote ? "lier cet appel à une autre note" : "lier cet appel à une note"}}</h1>
    </header>
    <div
      v-if="!existingNote"
      class="editor"
    >
      <b-table
        ref="multiSortTable"
        :data="notesList"
        :narrowed="true"
        :mobile-cards="true"
        :selected.sync="selected"
        class="note-table"
      >
        <!-- for admins debugging  : show NoteID
        <b-table-column v-slot="props" field="id" label="ID">
          <div class="id">
            {{ props.row.id }}
          </div>
        </b-table-column>
        -->
        <b-table-column v-slot="props" field="description" label="Note">
          <div
            class="description"
            v-html="props.row.content"
          />
        </b-table-column>
        <template #empty>
          <div class="has-text-centered">Aucun résultat</div>
        </template>
      </b-table>
    </div>
    <div
      v-else
      class="editor"
    >
      <b-table
        ref="multiSortTable"
        :data="[existingNote]"
        :narrowed="true"
        :mobile-cards="true"
        :selected.sync="selected"
        class="note-table"
      >
        <!-- for admins debugging  : show NoteID
        <b-table-column v-slot="props" field="id" label="ID">
          <div class="id">
            {{ props.row.id }}
          </div>
        </b-table-column>
        -->
        <b-table-column v-slot="props" field="description" label="L'appel renvoie actuellement à la note :">
          <div
            class="description"
            v-html="props.row.content"
          />
        </b-table-column>
        <!--<template #empty>
          <div class="has-text-centered">Aucun résultat</div>
        </template>-->
      </b-table>
      <b-table
        ref="multiSortTable"
        :data="notesList.filter(n => n.id !== existingNote.id)"
        :narrowed="true"
        :mobile-cards="true"
        :selected.sync="selected"
        class="note-table"
      >
        <!-- for admins debugging  : show NoteID
        <b-table-column v-slot="props" field="id" label="ID">
          <div class="id">
            {{ props.row.id }}
          </div>
        </b-table-column>
        -->
        <b-table-column v-slot="props" field="description" label="Associer cet appel de note à une autre note :">
          <div
            class="description"
            v-html="props.row.content"
          />
        </b-table-column>
        <template #empty>
          <div class="has-text-centered">Aucun résultat</div>
        </template>
      </b-table>

    </div>
    <div class="buttons">
      <b-button
        :title="!selected ? 'Sélectionner une note' : existingNote && existingNote.id === selected.id ? 'Choisir une autre note pour cet appel' : ''"
        :disabled="!selected || existingNote && existingNote.id === selected.id"
        type="is-primary"
        size="is-medium"
        @click="linkAction"
      >
        Associer à cette note
      </b-button>
      <b-button
        title="Revenir à l'éditeur"
        type="is-primary"
        size="is-medium"
        @click="cancelAction"
      >
        Annuler
      </b-button>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ModalConfirmNoteDelete from "@/components/forms/ModalConfirmNoteDelete.vue";
//import IconPenEdit from "@/components/ui/icons/IconPenEdit.vue";
//import IconBin from "@/components/ui/icons/IconBin.vue";
export default {
  name: "NoteForm",
  components: {ModalConfirmNoteDelete},
  props: {
      inputData: {
        type: Object,
        default: () => {
          return null;
        },
      },
      inputList: {
        type: Array,
        default: null,
      },
  },
  emits: ["add-place", "add-person", "close"],
  data() {
    let notesList = []
    let selected = []
    let form = {}
    let existingNote;
    // check if triggered from notes list (this.inputData.note) or existing note in editor (this.inputData.formats.note) :
    if (this.inputData && !this.inputList) {
      if (this.inputData.note) {
          console.log("NoteForm mounted inputData (existing note) : ", this.inputData)
          // retrieve note if from inputData
          form.id = parseInt(this.inputData.note.id);
          // retrieve note content from store
          console.log("mounted this.form.id : ", form.id)
          let existingNote = this.$store.state.document.notes.filter((note) => parseInt(note.id) === parseInt(form.id))[0];
          console.log("existingNote : ", existingNote);
          form.content = existingNote.content;
      }
    } else {
      if (this.inputList.length) {
        console.log("NoteForm mounted inputList : ", this.inputList)
        notesList = this.inputList
        if (this.inputData && this.inputData.selected) {
          existingNote = this.inputData.selected;
          selected = this.inputData.selected
        }
      }
    }
    return {
      form,
      notesList,
      selected,
      existingNote,
      loading: false,
      noteIdToDelete: null,
      dynamicTitle: null
    };
  },
  computed: {
    isValid() {
      console.log("isValid", !!this.form && !!this.form.content && this.form.content.length > 1)
      return !!this.form && !!this.form.content && this.form.content.length > 1;
    },
  },
  beforeCreate: function () {
    this.$options.components.RichTextEditor = require("./fields/RichTextEditor").default;
  },
  mounted() {
  },
  watch: {
    async selected() {
      if (this.selected) {
        console.log("this.selected", this.selected)
      }
      if (this.selected.item) {
        console.log("this.selected.item", this.selected.item)
      }
      this.selectedNote = null;
    }
  },
  methods: {
    ...mapState("document", ["document"]),
    selectionChanged(evt) {
      this.noteId = evt.item;
      this.selectedNote = evt.index;
      this.selected = null;
      console.log("selectionChanged", evt, this.noteId, this.selectedNote)
    },
    submitAction() {
      this.loading = true;
      const action = this.form && this.form.id ? "document/updateNote" : "document/addNote";
      console.log("submitAction : action / this.form", action, this.form)
      //this.$store.dispatch(action, this.form).then((storeNote) => {
        if (action === "document/addNote") {
          this.$store.dispatch(action, this.form).then((storeNote) => {
            console.log("NoteForm / submitAction / addNote / response", storeNote);
            let noteIndex = this.$store.state.document.notes.findIndex(n => n.id === storeNote.id) + 1;
            console.log("NoteForm / submitAction / addNote / noteIndex", noteIndex)
            this.inputData.insertTagCallback({id: storeNote.id, index: noteIndex});
          })
        } else if (action === "document/updateNote") {
          this.$store.dispatch(action, this.form).then((storeNote) => {
            console.log("NoteForm / submitAction / Updated Note / response", storeNote);
            let existingNote = storeNote;
            this.form.content = existingNote.content;
          })
        }
        this.$emit("close");
      //});
    },
    linkAction() {
      this.loading = true;
      if (this.existingNote && this.selected && this.existingNote !== this.selected) {
        let storeNoteToUpdate = this.$store.state.document.notes.filter(n => n.id === this.existingNote.id)[0];
        if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences > 1) {
          storeNoteToUpdate.occurences -= 1;
          console.log("Link change Action : storeNoteToUpdate decrement", storeNoteToUpdate)
          this.$store.dispatch("document/updateNote", storeNoteToUpdate).then((storeNote) => {
          console.log("NoteForm / Link change / Updated Note", storeNote);
          })
          //this.inputData.removeTagCallback();
          this.cancelAction();
        } else if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences === 1) {
          console.log("WARNING, last occurrence of Note", storeNoteToUpdate.id)
          this.noteIdToDelete = storeNoteToUpdate.id;
        }
      }
      if (this.selected && this.selected.id) {
        console.log("linkAction : this.selected", this.selected)
        this.selected.occurences += 1
        console.log("linkAction : this.selected incremented occurrence", this.selected)
        this.$store.dispatch("document/updateNote", this.selected).then((storeNote) => {
          console.log("NoteForm / linkAction / Update Note", storeNote);
          let noteIndex = this.$store.state.document.notes.findIndex(n => n.id === storeNote.id) +1;
          console.log("NoteForm / linkAction / addNote / noteIndex", noteIndex)
          this.inputData.insertTagCallback({id: storeNote.id, index: noteIndex});
          let existingNote = storeNote.content;
        }),
      this.$emit("close")
      }
    },
    cancelAction() {
      this.$emit("close");
    },
    deleteAction(noteId) {
      console.log("deleteAction : noteId", noteId)
      let storeNoteToUpdate = this.$store.state.document.notes.filter(n => n.id === noteId)[0];
      console.log("deleteAction : found storeNoteToUpdate", storeNoteToUpdate)
      if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences > 1) {
        storeNoteToUpdate.occurences -= 1;
        console.log("deleteAction : storeNoteToUpdate decrement", storeNoteToUpdate)
        this.$store.dispatch("document/updateNote", storeNoteToUpdate).then((storeNote) => {
        console.log("NoteForm / deleteAction / Updated Note", storeNote);
        })
        this.inputData.removeTagCallback();
        this.cancelAction();
      } else if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences === 1) {
        console.log("WARNING, last occurrence of Note", storeNoteToUpdate.id)
        this.noteIdToDelete = storeNoteToUpdate.id;
      }
    },
    confirmNoteDelete(noteIdToDelete) {
      console.log("confirmNoteDelete(noteId)", noteIdToDelete)
      this.$store.dispatch("document/removeNote", noteIdToDelete).then((noteIdToDelete) => {
        this.inputData.removeTagCallback();
        this.cancelNoteDelete();
        this.cancelAction();
      });
    },
    cancelNoteDelete() {
      this.noteIdToDelete = null;
    },
    addPlace(evt, source) {
      this.$emit("add-place", { ...evt, source });
    },
    addPerson(evt, source) {
      this.$emit("add-person", { ...evt, source });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/assets/sass/main.scss";

.note-form {
  overflow: visible;
  padding-bottom: 20px;

  header {
    background-color: #CB2158;
    border: none;
    border-radius: 5px;
    padding: 3px 20px;
    margin-bottom: 10px !important;

    h1 {
      padding: 0;
      font-family: $family-apptitle;
      font-size: 30px;
      color: #FFFFFF;
      font-weight: 200;
      letter-spacing: 0;
      text-transform: none;
    }
  }

  .editor {
    background-color: #FFFFFF;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    padding: 20px;
  }

  .buttons {
    display: flex;
    justify-content: end;
    background-color: #FFFFFF;
    padding: 20px;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;

    .button {
      background-color: #CB2158;
    }
  }
}
</style>
