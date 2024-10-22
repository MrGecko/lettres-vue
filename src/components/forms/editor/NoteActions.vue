<template>
  <div
    v-if="!noteIdToDelete"
    class="modal-card note-form"
  >
    <header class="is-uppercase is-size-2 mb-5">
      <h1
        :title="existingNote ? 'Choisir \'Editer :\' pour modifier le contenu de la note \nChoisir \'Supprimer :\' pour supprimer l\'appel de note' : ''"
      >{{ $attrs.header }} : {{ existingNote ? 'édition de la sélection' : 'nouvel appel de note' }}</h1>
    </header>
    <div class="note-actions__container">
      <div
        v-if="existingNote"
        class="editor">
        <b-table
          ref="multiSortTable"
          :data="[existingNote]"
          :narrowed="true"
          :mobile-cards="true"
          class="note-table"
        >
          <!-- for admins debugging  : show NoteID
          <b-table-column
            v-slot="props"
            field="id"
            label="ID"
          >
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
      <div class="buttons">
        <b-button
          :disabled="existingNote"
          :title="existingNote ? 'Une note est en cours de sélection' : 'Créer une nouvelle note pour cet appel'"
          type="is-primary"
          size="is-medium"
          @click="newAction"
        >
          <span>Créer</span>
        </b-button>
        <b-button
          :disabled="existingNote ? docNotesCount <= 1 : docNotesCount === 0"
          :title="existingNote ? docNotesCount <= 1 ? 'Cette note est l\'unique note existante' : 'Lier cet appel à une autre note' : 'Lier cet appel à une note existante'"
          type="is-primary"
          size="is-medium"
          @click="updateLinkAction"
        >
          <span>Lier</span>
        </b-button>
        <b-button
          :disabled="!existingNote"
          :title="!existingNote ? 'Aucune note sélectionnée' : 'Modifier le contenu de la note'"
          type="is-primary"
          size="is-medium"
          @click="editAction"
        >
          <span>Éditer</span>
        </b-button>
      </div>
      <div>
        <div
          v-if="existingNote"
          class="note-actions__danger"
        >
          <span class="note-actions__danger_icon">
            <i class="fas fa-exclamation-triangle" />
          </span>
          <span
            v-if="existingNote.occurences === 1"
            class="note-actions__danger_txt"
          >
            Dernier appel vers cette note :<br/>la note sera également supprimée du document.
          </span>
          <span
            v-else
            class="note-actions__danger_txt"
          >
            Seul l'appel de note sélectionné sera supprimé<br/>car d'autres appels pointent vers la note.<br/>
            Pour supprimer la note :<br/>
            - supprimer tous les appels de la note ou<br/>
            - supprimer la note dans la section Notes
          </span>
        </div>
        <div class="buttons">
          <b-button
            :disabled="!existingNote"
            :title="!existingNote ? 'Aucune note sélectionnée' : ''"
            type="is-primary"
            size="is-medium"
            @click="showDeleteConfirmModal(parseInt(inputData.note.id))"
          >
            <span>Supprimer</span>
          </b-button>
          <b-button
            title="Revenir à l'éditeur"
            type="is-primary"
            size="is-medium"
            @click="cancelNoteAction"
          >
            <span>Annuler</span>
          </b-button>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else-if="noteIdToDelete"
    class="modal-card note-form"
  >
    <modal-confirm-note-delete
      :note-id="noteIdToDelete ? noteIdToDelete : null"
      :cancel="cancelNoteDelete"
      :submit="confirmNoteDelete"
    />
  </div>
</template>

<script>
  import {mapState, mapActions} from "vuex";
  import ModalConfirmNoteDelete from "@/components/forms/ModalConfirmNoteDelete.vue";
  import {removeContentEditableAttributesFromString} from "@/modules/document-helpers";

  export default {
    name: "NoteActions",
    components: {ModalConfirmNoteDelete},
    props: {
      inputData: {
        type: Object,
        default: () => {
          return null;
        }
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
      }
    },
    emits: ["add-note", "close", "refresh-title", "refresh-argument", "refresh-transcription", "refresh-address"],
    data() {
      return {
        NoteMode: "",
        docNotesCount: 0,
        existingNote: null,
        noteIdToDelete: null,
        noteWithMode: false,
        documentNotes: [],
        titleContent:"",
        argumentContent:"",
        transcriptionContent: "",
        addressContent: ""
      };
    },
    computed: {
    ...mapState("notes", ["notes"]),
    ...mapState("document", ["document"]),
    ...mapState("user", ["current_user"])
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
      this.argumentContent = this.$props.argumentEditor;
      this.transcriptionContent = this.$props.transcriptionEditor;
      this.addressContent = this.$props.addressEditor;

      console.log("NoteActions mounted inputData", this.inputData)
      this.docNotesCount = this.$store.state.document.notes.length;
      //console.log("NoteActions mounted newNote", this.newNote)
      if (this.inputData.note) {
        console.log("NoteActions mounted inputData (existing note) : ", this.inputData)
        // retrieve note if from inputData
        let existingNoteId = parseInt(this.inputData.note.id);
        console.log("NoteActions mounted existingNoteId : ", existingNoteId)
        // retrieve note content from store
        this.existingNote = this.$store.state.document.notes.filter((note) => parseInt(note.id) === existingNoteId)[0];
        console.log("NoteActions existingNote : ", this.existingNote);
      }
    },
    methods: {
      newAction() {
        console.log("NoteActions newAction this.inputData : ", this.inputData)
        this.noteWithMode = this.inputData;
        this.noteWithMode.action = "new";
        this.$emit("add-note", this.noteWithMode);
        this.$emit("close");
      },
      showDeleteConfirmModal(noteId) {
        let storeNoteToUpdate = this.$store.state.document.notes.filter(n => n.id === noteId)[0];
        if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences > 1) {
          storeNoteToUpdate.occurences -= 1;
          this.$store.dispatch("document/updateNote", storeNoteToUpdate).then((storeNote) => {
          })
          this.inputData.removeTagCallback();
          this.$emit("close");
        } else if (storeNoteToUpdate.occurences && storeNoteToUpdate.occurences === 1) {
          console.log("WARNING, last occurrence of Note", storeNoteToUpdate.id)
          this.noteIdToDelete = storeNoteToUpdate.id;
        }
      },
      confirmNoteDelete(noteIdToDelete) {
        console.log("confirmNoteDelete(noteId)", noteIdToDelete)
        let noteToDeleteIndex = this.$store.state.document.notes.findIndex(n => n.id === noteIdToDelete);
        let notesToRenumber = this.$store.state.document.notes.filter((_, index) => index > noteToDeleteIndex);
        if (notesToRenumber.length === 0) {
          this.$store.dispatch("document/removeNote", noteIdToDelete).then((noteIdToDelete) => {
          this.inputData.removeTagCallback();
          this.cancelNoteDelete();
          this.$emit("close");
          });
        } else {
            this.$store.dispatch("document/removeNote", noteIdToDelete).then((noteIdToDelete) => {
              this.removeNoteFromDocument(noteIdToDelete, notesToRenumber);
              this.cancelNoteDelete();
              this.$emit("close");
          });
        }
      },
      cancelNoteDelete() {
        this.noteIdToDelete = null;
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

      editAction() {
        console.log("NoteActions / editAction / this.inputData", this.inputData)
        this.noteWithMode = this.inputData;
        this.noteWithMode.action = "update";
        this.$emit("add-note", this.noteWithMode);
        this.$emit("close");
      },
      updateLinkAction() {
        this.documentNotes = this.$store.state.document.notes
        console.log("NoteActions / updateLinkAction / this.documentNotes is a list ?", Array.isArray(this.documentNotes))
        let inputNotesData= this.inputData
        inputNotesData.list = this.documentNotes
        if (this.existingNote) {
          inputNotesData.selected = this.existingNote
        }
        this.$emit("add-note", inputNotesData);
        console.log("NoteActions / updateLinkAction / this.inputNotesData", inputNotesData)
        this.$emit("close");
      },
      cancelNoteAction() {
        this.$emit("close");
      }
    }
  }
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
  .note-actions__container {
    background-color: #FFFFFF;
    border-radius: 5px;
    padding: 5px;

    .note-actions__danger {
      display: table;
      padding: 5px;
      .note-actions__danger_icon {
        display: table-cell;
        vertical-align: middle;
        padding: 5px;
      }
      .note-actions__danger_txt {
        display: table-cell;
        vertical-align: middle;
        padding: 5px;
      }
    }
  }
  .note-form-item__text {
    background-color: #FFFFFF;
    padding: 20px;
  }
  .editor {
    background-color: #FFFFFF;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    padding: 20px;
  }

  .buttons {
    display: flex;
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
