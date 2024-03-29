<template>
  <div v-if="!isLoading && !authorised">
    <section>
      Le document n'est pas publié. Veuillez-vous connecter pour pouvoir le visualiser.
    </section>
  </div>
  <div
    v-else-if="!isLoading"
    class="document"
    :class="documentCssClass"
  >
    <!-- Not preview mode -->
    <div
      v-if="!preview"
      class="is-justify-content-left"
    >
      <nav
        v-if="current_user && lastDocId"
        class="mb-3 previous-next-navigation"
      >
        <!-- User connected, navigation is docId +/- 1 and range bounds are 1 to last doc in database -->
        <router-link
          :to="{ name: 'document', params: {docId: docId - 1 } }"
          aria-label="Previous page"
          class="pagination-link pagination-previous"
          :disabled="docId === 1"
        />
        <router-link
          :to="{ name: 'document', params: {docId: docId + 1 } }"
          aria-label="Next page"
          class="pagination-link pagination-next"
          :disabled="docId === lastDocId"
        />
      </nav>
      <nav
        v-if="!current_user && firstDocId && previousDocId && nextDocId && lastDocId && docIdList"
        class="mb-3 previous-next-navigation"
      >
        <router-link
          :to="{ name: 'document', params: {docId: previousDocId } }"
          aria-label="Previous page"
          class="pagination-link pagination-previous"
          :disabled="docId === firstDocId"
        />
        <router-link
          :to="{ name: 'document', params: {docId: nextDocId } }"
          aria-label="Next page"
          class="pagination-link pagination-next"
          :disabled="docId === lastDocId"
        />
      </nav>
      <div
        class="document"
        :class="documentCssClass"
      >
        <div class="columns">
          <document-tag-bar
            v-if="!isLoading && current_user"
            class="column"
            :doc-id="docId"
            :with-status="true"
            :preview="preview"
          />
          <document-deletion
            v-if="!isLoading && current_user && current_user.isAdmin"
            class="column delete-button"
            :doc-id="docId"
          />
        </div>
        <div class="is-flex is-justify-content-center is-align-content-center">
          <ul
            v-if="displayedManifestUrl"
            class="controls is-flex"
          >
            <li>
              <a
                :class="type === 'text-mode' ? 'text-btn text-mode' : 'text-btn'"
                aria-label="texte seul"
                @click="changeViewMode($event, 'text-mode')"
              />
            </li>
            <li>
              <a
                :class="type === 'text-and-images-mode' ? 'text-images-btn text-and-images-mode' : 'text-images-btn'"
                aria-label="texte et images"
                @click="changeViewMode($event, 'text-and-images-mode')"
              />
            </li>
            <li>
              <a
                :class="type === 'images-mode' ? 'images-btn images-mode' : 'images-btn'"
                aria-label="images seules"
                @click="changeViewMode($event, 'images-mode')"
              />
            </li>
          </ul>
        </div>
        <div class="document__display is-flex">
          <div
            v-if="document && !isLoading"
            id="document-text-view"
            class="document__content"
            :class="viewerMode"
          >
            <div id="document-text-view__contents">
              <!-- titre et langue -->
              <section class="document-section document-section-for-title">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Titre</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isTitleOpen"
                    aria-controls="titleSection"
                    @click="isTitleOpen = !isTitleOpen"
                  >
                    <i :class="isTitleOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                </div>
                <b-collapse
                  :class="!canEdit? '' : isTitleOpen? '' : 'hiddendiv'"
                  aria-id="titleSection"
                >
                  <template #default>
                    <div>
                      <document-title
                        v-if="!preview"
                        :editable="canEdit"
                        :preview="preview"
                        :title-editor="titleEditor ? titleEditor : titleContent"
                        class="column"
                        @add-note="addNote($event)"
                        @refresh-title="refreshTitle($event)"
                        @save-title="saveField('title', 'titleEditor')"
                      />
                      <document-languages
                        :editable="canEdit"
                        class="column"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- correspondants -->
              <section class="document-section">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Correspondants</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isPersonsOpen"
                    aria-controls="personsSection"
                    @click="isPersonsOpen = !isPersonsOpen"
                  >
                    <i :class="isPersonsOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isPersonsOpen? '' : 'hiddendiv'"
                  aria-id="personsSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-persons
                        :editable="canEdit"
                        @add-person="addPerson"
                        @unlink-person="unlinkPerson"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- dates de temps -->
              <section class="document-section document-section-for-dates">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Dates</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isDatesOpen"
                    aria-controls="datesSection"
                    @click="isDatesOpen = !isDatesOpen"
                  >
                    <i :class="isDatesOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isDatesOpen? '' : 'hiddendiv'"
                  aria-id="datesSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-date-attributes :editable="canEdit" name="datename" label="datelabel"/>
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- dates de lieux -->
              <section class="document-section dates-section">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Lieux</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isPlacesOpen"
                    aria-controls="placesSection"
                    @click="isPlacesOpen = !isPlacesOpen"
                  >
                    <i :class="isPlacesOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isPlacesOpen? '' : 'hiddendiv'"
                  aria-id="placesSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-placenames
                        :editable="canEdit"
                        @add-place="addPlace"
                        @unlink-place="unlinkPlace($event)"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- analyse -->
              <section class="document-section document-section-for-analyse">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Analyse</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isAnalyseOpen"
                    aria-controls="analyseSection"
                    @click="isAnalyseOpen = !isAnalyseOpen"
                  >
                    <i :class="isAnalyseOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isAnalyseOpen? '' : 'hiddendiv'"
                  aria-id="analyseSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-argument
                        :editable="canEdit"
                        :preview="preview"
                        :argument-editor="argumentEditor ? argumentEditor : argumentContent"
                        @add-place="addPlace"
                        @add-person="addPerson"
                        @add-note="addNote"
                        @refresh-argument="refreshArgument($event)"
                        @save-argument="saveField('argument', 'argumentEditor')"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- transcription -->
              <section class="document-section document-section-for-transcription">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Édition</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isTranscriptionOpen"
                    aria-controls="transcriptionSection"
                    @click="isTranscriptionOpen = !isTranscriptionOpen"
                  >
                    <i :class="isTranscriptionOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isTranscriptionOpen? '' : 'hiddendiv'"
                  aria-id="transcriptionSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-transcription
                        :editable="canEdit"
                        :preview="preview"
                        :transcription-editor="transcriptionEditor ? transcriptionEditor : transcriptionContent"
                        :address-editor="addressEditor ? addressEditor : addressContent"
                        @add-place="addPlace"
                        @add-person="addPerson"
                        @add-note="addNote"
                        @refresh-transcription="refreshTranscription($event)"
                        @refresh-address="refreshAddress($event)"
                        @save-transcription="saveField('transcription', 'transcriptionEditor')"
                        @save-address="saveField('address', 'addressEditor')"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- notes -->
              <section class="document-section">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Notes</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isNotesOpen"
                    aria-controls="notesSection"
                    @click="isNotesOpen = !isNotesOpen"
                  >
                    <i :class="isNotesOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isNotesOpen? '' : 'hiddendiv'"
                  aria-id="notesSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-notes
                        :editable="canEdit"
                        :preview="preview"
                        :title-editor="titleEditor ? titleEditor : titleContent"
                        :argument-editor="argumentEditor ? argumentEditor : argumentContent"
                        :transcription-editor="transcriptionEditor ? transcriptionEditor : transcriptionContent"
                        :address-editor="addressEditor ? addressEditor : addressContent"
                        @add-place="addPlace"
                        @add-person="addPerson"
                        @add-note="addNote"
                        @refresh-title="refreshTitle($event)"
                        @refresh-argument="refreshArgument($event)"
                        @refresh-transcription="refreshTranscription($event)"
                        @refresh-address="refreshAddress($event)"
                      />
                    </div>
                  </template>
                </b-collapse>
              </section>


              <!-- témoins
              <document-witnesses :editable="canEdit" :list="witnesses" />
               -->
              <section class="document-section">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <div class="has-add-btn is-flex is-align-items-center is-justify-content-center">
                    <span class="heading-content">Témoins</span>
                  </div>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isWitnessOpen"
                    aria-controls="witnessSection"
                    @click="isWitnessOpen = !isWitnessOpen"
                  >
                    <i :class="isWitnessOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                  <!--<div class="slope-container">
                    <span class="slope tier-1" />
                    <span class="slope tier-2" />
                    <span class="slope tier-3" />
                    <span class="slope tier-4" />
                  </div>-->
                </div>
                <b-collapse
                  :class="!canEdit? '' : isWitnessOpen? '' : 'hiddendiv'"
                  aria-id="witnessSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <witness-list
                        :editable="canEdit"
                        :open-modal="openWitnessModal"
                        @add-note="addNote"
                        @close-witness-modal="openWitnessModal = false"
                      />
                      <b-button
                        v-if="canEdit"
                        value="+"
                        class="open-modal-button "
                        @click="openWitnessModal = true"
                      >
                        <icon-add />
                      </b-button>
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- collections -->
              <section class="document-section collections-document-section">
                <div class="heading is-uppercase is-flex is-justify-content-space-between">
                  <span class="heading-content">Collections</span>
                  <span
                    v-if="canEdit"
                    class="icon"
                    :aria-expanded="isCollectionsOpen"
                    aria-controls="collectionsSection"
                    @click="isCollectionsOpen = !isCollectionsOpen"
                  >
                    <i :class="isCollectionsOpen ? 'fas fa-angle-up' : 'fas fa-angle-down'" />
                  </span>
                </div>
                <b-collapse
                  :class="!canEdit? '' : isCollectionsOpen? '' : 'hiddendiv'"
                  aria-id="collectionsSection"
                >
                  <template #default>
                    <div class="document-section-content">
                      <document-collections :editable="canEdit" />
                    </div>
                  </template>
                </b-collapse>
              </section>

              <!-- historique des modifications -->
              <div
                v-if="current_user"
                class=""
                style="margin-left: 0; margin-top: 50px"
              >
                <header class="subtitle mb-3">
                  Historique des modifications
                </header>
                <changelog
                  :doc-id="docId"
                  :per-page="10"
                />
              </div>
            </div>
          </div>
          <div
            v-show="type === 'text-and-images-mode' || type === 'images-mode'"
            class="column_mirador"
            :class="viewerMode"
            :style="miradorViewCssStyle"
          >
            <mirador-viewer
              v-if="document && displayedManifestUrl"
              class="mirador-container"
              :manifest-url="displayedManifestUrl"
            />
          </div>
        </div>
        <document-skeleton
          v-if="isLoading"
          class="mt-5"
        />

        <!-- modals -->
        <b-modal
          v-if="canEdit && isNewNoteFormModalActive"
          v-model="isNewNoteFormModalActive"
          trap-focus
          has-modal-card
          :can-cancel="['escape', 'x']"
          scroll="clip"
          width="80%"
          :destroy-on-hide="true"
          aria-role="dialog"
          aria-label="Note"
          aria-modal
        >
          <template #default="props">
            <note-form
              header="Actions de notes"
              :input-data="noteInputData"
              @add-place="addPlace($event)"
              @add-person="addPerson($event)"
              @close="
                () => {
                  props.close();
                }
              "
            />
          </template>
        </b-modal>
        <!--new-->
        <b-modal
          v-if="canEdit && isNoteFormModalActive"
          v-model="isNoteFormModalActive"
          trap-focus
          has-modal-card
          :can-cancel="['escape', 'x']"
          scroll="clip"
          width="80%"
          :destroy-on-hide="true"
          aria-role="dialog"
          aria-label="Note"
          aria-modal
        >
          <template #default="props">
            <note-actions
              header="Actions de notes"
              :input-data="noteInputData"
              :title-editor="titleEditor ? titleEditor : titleContent"
              :argument-editor="argumentEditor ? argumentEditor : argumentContent"
              :transcription-editor="transcriptionEditor ? transcriptionEditor : transcriptionContent"
              :address-editor="addressEditor ? addressEditor : addressContent"
              @add-note="addNote($event)"
              @refresh-title="refreshTitle($event)"
              @refresh-argument="refreshArgument($event)"
              @refresh-transcription="refreshTranscription($event)"
              @refresh-address="refreshAddress($event)"
              @close="
                () => {
                  props.close();
                }
              "
            />
          </template>
        </b-modal>
        <b-modal
          v-if="canEdit && isNoteListFormModalActive"
          v-model="isNoteListFormModalActive"
          trap-focus
          has-modal-card
          :can-cancel="['escape', 'x']"
          scroll="clip"
          width="80%"
          :destroy-on-hide="true"
          aria-role="dialog"
          aria-label="Note"
          aria-modal
        >
          <template #default="props">
            <note-form
              header="Actions de notes"
              :input-data="noteInputData"
              :input-list="notesListData"
              @add-note="addNote($event)"
              @close="
                () => {
                  props.close();
                }
              "
            />
          </template>
        </b-modal>
        <!--end new-->

        <b-modal
          v-if="canEdit"
          v-model="isPlaceWizardFormModalActive"
          trap-focus
          has-modal-card
          :can-cancel="['escape', 'x']"
          scroll="clip"
          width="80%"
          :destroy-on-hide="true"
          aria-role="dialog"
          aria-label="Date de lieu"
          aria-modal
        >
          <template #default="props">
            <place-wizard-form
              subtitle=""
              :input-data="placeInputData"
              @close="
                () => {
                  props.close();
                }
              "
            />
          </template>
        </b-modal>

        <b-modal
          v-if="canEdit"
          v-model="isPersonWizardFormModalActive"
          trap-focus
          has-modal-card
          :can-cancel="['escape', 'x']"
          scroll="clip"
          width="80%"
          :destroy-on-hide="true"
          aria-role="dialog"
          aria-label="Expéditeur et destinataire"
          aria-modal
        >
          <template #default="props">
            <person-wizard-form
              subtitle=""
              :input-data="personInputData"
              @close="
                () => {
                  props.close();
                }
              "
            />
          </template>
        </b-modal>
      </div>
    </div>

    <!-- preview mode -->
    <div v-else>
      <div
        v-if="document && !isLoading"
        class="document__content"
      >
        <!-- transcription en mode preview -->
        <section
          v-if="transcriptionContent && searchTerm && searchTerm.length > 0 && searchType === 'isFullTextSearch'"
          class="document-section">
          <div class="document-section-content">
            <document-transcription
              :editable="canEdit"
              :preview="preview"
            />
          </div>
        </section>
        <!-- analyse en mode preview -->
        <section
          v-if="argumentContent && searchType === 'isParatextSearch'"
          class="document-section"
        ><!-- && highlight(argumentContent).includes('mark') -->
          <div class="heading is-uppercase">
            <span class="heading-content">Analyse</span>
          </div>
          <div class="document-section-content">
            <document-argument
              :editable="canEdit"
              :preview="preview"
            />
          </div>
        </section>
        <!-- témoins en mode preview -->
        <section
          v-if="witnessTmpList.filter(doc => doc.id === docId)[0].witnesses.length > 0 && searchType === 'isParatextSearch'"
          class="document-section">
          <div class="heading is-uppercase">
            <span class="heading-content ">Témoins</span>
          </div>
          <div class="document-section-content">
            <witness-list
              :row-doc-id="docId"
              :editable="canEdit"
            />
          </div>
        </section>
        <mirador-viewer
            v-if="displayedManifestUrl"
            class="mirador-container"
            :manifest-url="witnessTmpList.filter(doc => doc.id === docId)[0].witnesses[0]['manifest_url']"
            :window-id="docId.toString()"
        />

        <!-- collections
        <section class="document-section collections-document-section">
          <div class="heading is-uppercase">
            <span class="heading-content">Collections</span>
          </div>
          <div class="document-section-content">
            <document-collections :editable="canEdit" />
          </div>
        </section> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import Changelog from "@/components/sections/Changelog";
import DocumentPersons from "../document/DocumentPersons";
import DocumentTranscription from "../document/DocumentTranscription";
import DocumentTagBar from "../document/DocumentTagBar";
import DocumentDeletion from "../document/DocumentDeletion";
import DocumentCollections from "../document/DocumentCollections";
import DocumentPlacenames from "../document/DocumentPlacenames";
//import { baseApiURL } from "@/modules/http-common";
import DocumentArgument from "../document/DocumentArgument";
import DocumentTitle from "../document/DocumentTitle";
import DocumentLanguages from "../document/DocumentLanguages";
import NoteForm from "@/components/forms/NoteForm";

import DocumentDateAttributes from "../document/DocumentDateAttributes";
import DocumentSkeleton from "@/components/ui/DocumentSkeleton";
import WitnessList from "@/components/document/WitnessList.vue";

import PlaceWizardForm from "@/components/forms/wizards/PlaceWizardForm.vue";
import PersonWizardForm from "@/components/forms/wizards/PersonWizardForm.vue";
import IconAdd from "@/components/ui/icons/IconAdd";
import NoteActions from "@/components/forms/editor/NoteActions.vue";
//import NewNoteActions from "@/components/forms/editor/NewNoteActions.vue";
import DocumentNotes from "@/components/document/DocumentNotes.vue";
import escapeRegExp from "lodash/escapeRegExp";
import MiradorViewer from "@/components/MiradorViewer.vue";
export default {
  name: "Document",
  //emit: ["open-witness-modal"],
  components: {
    DocumentNotes,
    IconAdd,
    Changelog,
    DocumentSkeleton,
    DocumentPersons,
    DocumentPlacenames,
    DocumentArgument,
    DocumentCollections,
    DocumentTranscription,
    DocumentTagBar,
    DocumentDeletion,
    DocumentLanguages,
    WitnessList,
    DocumentTitle,
    DocumentDateAttributes,
    PlaceWizardForm,
    PersonWizardForm,
    NoteForm,
    NoteActions,
    MiradorViewer
  },
  props: {
    docId: { required: true, type: Number },
    preview: { type: Boolean, default: false },
  },
  data() {
    return {
      isTitleOpen: true,
      isPersonsOpen: true,
      isDatesOpen: true,
      isPlacesOpen: true,
      isAnalyseOpen: true,
      isTranscriptionOpen: true,
      isNotesOpen: true,
      isWitnessOpen: true,
      isCollectionsOpen: true,
      type: null,

      firstDocId: 0,
      lastDocId: 0,
      previousDocId: 0,
      nextDocId: 0,
      currentIndex: 0,
      docIdList: [],
      witnessTmpList: [],

      miradorViewBoundingTop: 0,

      isLoading: true,
      authorised: true,

      openWitnessModal: false,

      placeInputData: null,
      isPlaceWizardFormModalActive: false,

      personInputData: null,
      isPersonWizardFormModalActive: false,

      noteInputData: null,
      notesListData: [],
      isNoteFormModalActive: false,
      isNewNoteFormModalActive: false,
      isNoteListFormModalActive: false,
      titleContent: null,
      titleEditor: null,
      argumentContent: null,
      argumentEditor: null,
      transcriptionContent: null,
      transcriptionEditor: null,
      addressContent: null,
      addressEditor: null,
      newNoteFunction: null
    };
  },
  computed: {
    documentCssClass: function(){
      if (this.canEdit && !this.preview) {
        return 'can-edit';
      }
      return this.preview ? "is-preview" : "";
    },
    miradorViewCssStyle: function(){
      return 'margin-top:' +  this.miradorViewBoundingTop + 'px';
    },
    ...mapState("document", ["document", "documentLoading", "collections", "witnesses", "currentLock"]),
    ...mapState("search", ["documents", "searchTerm", "searchType"]),
    ...mapState("user", ["current_user", "jwt"]),
    ...mapState("locks", ["lockOwner"]),
    ...mapState("layout", ["displayedManifestUrl", "viewerMode"]),
    ...mapActions("search", ["getDocumentsTotal"]),
    ...mapGetters("document", ["locationDateFrom", "locationDateTo"]),
    ...mapGetters("placenames", ["getRoleByLabel"]),
    ...mapGetters("persons", ["getRoleByLabel"]),
    /*collectionURL() {
      const baseUrl = window.location.origin
        ? window.location.origin + "/"
        : window.location.protocol + "/" + window.location.host;
      return `${baseUrl}${baseApiURL.substr(1)}/iiif/documents/${
        this.docId
      }/collection/default`;
    },*/
    canEdit() {
      //console.log("recalculating canEdit", this.isLoading, this.preview, this.current_user, this.lockOwner)
      if (this.isLoading === false) {

        if (this.preview) {
          //console.log("canEdit false if preview", this.preview)
          return false;
        }
        /*
         * Can edit if 1) You are connected 2) There is no active lock or the active lock is yours
         * */
        if (!this.current_user || !this.jwt) {
          //console.log("canEdit false not connected", !this.current_user || !this.jwt)
          return false;
        }
        /* old rule
        if (this.current_user.isAdmin) {
          console.log("canEdit false not admin", this.current_user.isAdmin)
          return true;
        }*/
        if (!this.currentLock || this.currentLock.id === null) {
          //console.log("this.currentLock", this.currentLock)
          //console.log("this.currentLock.id", this.currentLock.id)
          //console.log("canEdit true because no lock", !this.currentLock || this.currentLock.id === null)
          return true
        }
        if (this.lockOwner && this.lockOwner[this.docId]) {
          console.log("canEdit lockOwner test", this.lockOwner[this.docId] &&
                  this.lockOwner[this.docId].id === this.current_user.id)
          return (
              (this.lockOwner[this.docId] &&
                  this.lockOwner[this.docId].id === this.current_user.id)
          )

          /*old rule outdated and not working (this.preview should be this.status ???)
          console.log("canEdit based on locks", (this.preview && this.currentLock.id === null) ||
          (this.lockOwner[this.docId] &&
            this.lockOwner[this.docId].id === this.current_user.id))
          return (
          (this.preview && this.preview.currentLock.id === null) ||
          (this.lockOwner[this.docId] &&
            this.lockOwner[this.docId].id === this.current_user.id))
        );*/
        }
        //console.log("canEdit default1 True")
        return true
      }
      //console.log("canEdit default2 null")
      return null
    },
  },
  watch: {
    titleEditor: function (val) {
      console.log("DocumentVue / watch / titleEditor : ", val)
    },
    argumentEditor : function (val) {
      console.log("DocumentVue / watch / argumentEditor : ", val)
    },
    transcriptionEditor : function (val) {
      console.log("DocumentVue / watch / transcriptionEditor : ", val)
    },
    addressEditor : function (val) {
      console.log("DocumentVue / watch / addressEditor : ", val)
    },
    displayedManifestUrl : function (val, oldVal)  {
      if (!this.displayedManifestUrl || val === oldVal) {
        this.type = "text-mode";
        this.setDisplayedManifestUrl(null);
        this.setViewerMode(null);
      } else if (val !== oldVal) {
        if (!this.preview) {
          this.type = "text-and-images-mode"
          window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
          // Mode Preview : on conserve les marges
          this.type = "images-mode"
          this.setViewerMode(null);
        }
        //this.$emit("refresh-viewer");
      }
    },
    type: function () {
      if (!this.preview) {
        console.log("watch type", this.type)
      }
    },
    viewerMode() {
      this.type = this.viewerMode
      if (this.type === "text-mode") {
        this.setDisplayedManifestUrl(null);
        this.setViewerMode(null);
      }
    },
    docId: async function () {
      if (!this.preview) {
        this.type = null;
        this.setDisplayedManifestUrl(null);
        this.setViewerMode(null);
      }
        await this.load(this.docId);
    },
    canEdit: function () {
      console.log("watch canEdit", this.canEdit)
    },
  },
  beforeDestroy() {
    this.setViewerMode(null);
    this.setDisplayedManifestUrl(null);
    window.removeEventListener('scroll', this.updateMiradorTopPosition);
  },
  async mounted() {
    window.addEventListener('scroll', this.updateMiradorTopPosition);
    await this.load(this.docId);
    /*console.log("mounted this.currentLock", this.currentLock)
    if (this.currentLock && this.currentLock.id) {
      console.log("created this.currentLock.id", this.currentLock.id)
      this.fetchLockOwner(this.docId, this.currentLock.id);
    }*/
  },
  methods: {
    ...mapActions("locks", ["fetchLockOwner"]),
    ...mapActions("layout", ["setLastSeen", "setDisplayedManifestUrl", "setViewerMode"]),
    async load(docId) {
      this.isLoading = true;
      try {
        if (!this.$store.state.search.docIdList || this.$store.state.search.docIdList.length === 0) {
          await this.getDocumentsTotal
        }
        this.docIdList = this.$store.state.search.docIdList;

        if (!this.current_user && this.docIdList.filter(d => d.id === this.docId).length === 0) {
          this.authorised = false;
        } else {
          if (!this.$props.preview) {
            console.log("Document.vue this.$props.preview: ", this.$props.preview)
            let documentsTotal = this.$store.state.search.documents_total
            //console.log('documentsTotal : ', documentsTotal)
            this.lastDocId = this.$store.state.search.lastDocId;
            this.firstDocId = this.$store.state.search.firstDocId;

            this.currentIndex = this.docIdList.findIndex(doc => doc.id === this.docId);
            console.log("currentIndex", this.currentIndex);
            if (this.currentIndex > 0) {
              this.previousDocId = this.docIdList[this.currentIndex - 1].id
            } else {
              this.previousDocId = this.firstDocId;
            }
            if (this.currentIndex < this.docIdList.length - 1) {
              this.nextDocId = this.docIdList[this.currentIndex + 1].id;
            } else {
              this.nextDocId = this.lastDocId;
            }
            console.log("firstDocId : ", this.firstDocId, "\npreviousDocId : ", this.previousDocId, "\nthis.docId : ", this.docId, "\nthis.nextDocId : ", this.nextDocId, "\nthis.lastDocId : ", this.lastDocId);
            console.log('docIdList : ', this.docIdList);
          }
          await this.$store.dispatch("document/fetch", this.docId);
          this.setLastSeen(this.docId);
        }
      } catch (e) {
        console.log("e : ", e)
        await this.$router.push({name: "home"});
      }
      if (this.$store.state.document.document) {
        console.log("note dict : ", this.$store.state.document.notes);
        /*let title = this.$store.state.document.document.title
        let argument = this.$store.state.document.document.argument
        let transcription = this.$store.state.document.document.transcription
        let addresss = this.$store.state.document.document.address
        const personRegexp = /(?:class="persName" (?:target="_blank" href="[^>]*".)?id=")(\d+)/gmi;
        let persNameArgumentList = [...argument.matchAll(personRegexp)].map(m => parseInt(m[1]));
        let persNameTranscriptionList = [...transcription.matchAll(personRegexp)].map(m => parseInt(m[1]));
        let persNameAddressList = [...addresss.matchAll(personRegexp)].map(m => parseInt(m[1]));

        let persNameList = persNameArgumentList.concat(persNameTranscriptionList, persNameAddressList)
        let persNameTranscriptionDict = {}
        for (let i = 0; i < persNameList.length; i++) {
        persNameTranscriptionDict[persNameList[i]] = 1 + (persNameTranscriptionDict[persNameList[i]] || 0);
        }
        console.log("persName dict: ", persNameTranscriptionDict)*/
        this.titleContent = this.$store.state.document.document.title;
        this.transcriptionContent = this.$store.state.document.document.transcription;
        this.addressContent = this.$store.state.document.document.address;
        this.argumentContent = this.$store.state.document.document.argument;
      }
      this.witnessTmpList = this.documents.map(({id, witnesses}) => ({id: id, witnesses: witnesses}))
      console.log("created search witnessTmpList", this.witnessTmpList)

      console.log("created type", this.type)

      this.isLoading = false
    },
    changeViewMode($event, type) {
      if (type === "text-mode") {
        this.type = type
        this.$store.dispatch('layout/setViewerMode', type);
      } else if (this.displayedManifestUrl && type === "text-and-images-mode") {
        this.type = type
        this.$store.dispatch('layout/setViewerMode', type);
      } else if (this.displayedManifestUrl && type === "images-mode") {
        this.type = type
        this.$store.dispatch('layout/setViewerMode', type);
      }
    },
    highlight(text) {
      // function called only if this.searchTerm && this.searchTerm.length > 0
      // split search terms (by space) if multiple
      // if (/^"".*""$/.test(text)) {TODO Victor : implement enclosed in quotes ?
      // previous rule : const terms = this.searchTerm.split(new RegExp("\\s+")).map(escapeRegExp).filter(term => term !== "")
      const terms = this.searchTerm.replaceAll(/^"|"$/g, "").split(new RegExp("[,;:.\\s+]+")).map(escapeRegExp).filter(term => term !== "")
      //let terms = this.searchTerm.replaceAll(/^"|"$/g, "").match(/\p{L}+|\d+/gu);  // TODO Victor : does match "i568" works with .match(/\p{L}{2,}|\p{L}+\d+/gu)
      if (terms && terms.length > 0) {
        // Create regex with list of search terms and ensuring they are not searched within attributes (eg do not match/replace "a" in <a class=""...>
        const re = new RegExp(`(${terms.join("|")})`);
        //const re = new RegExp(`(?:(?!\\w)|\\b(?=\\w))(${terms.join("|")})(?:(?<=\\w)\\b|(?<!\\w))(?=[^<>]*<)`);
        /*let regexTerms = [];
        for (let i = 0, len = terms.length; i < len; i++) {
          regexTerms.push("\\b" + terms[i] + "\\b");
        }
        const re = new RegExp(`(${regexTerms.join("|")})(?=[^<>]*<)`);*/
        //const re = new RegExp(`(${terms.join("|")})(?=[^<>]*<)`)
        //console.log("transcription match re :", re)
        /*return text.replace(new RegExp(re, 'gi'), (match => `<mark>${match}</mark>`))*/

        // if argument, parse pseudo HTML if required
        if (text.includes('<p>')) {
          // if source is pseudo HTML (has tags)
          let div = document.createElement("div");
          div.innerHTML = text;
          let textWithoutHTML = div.textContent || div.innerText || "";
          text = textWithoutHTML;
          console.log("list highlight doc id cleanhtml text", text)
          return text.replace(new RegExp(re, 'gi'), (match => `<mark>${match}</mark>`))
        } else {
          return text.replace(new RegExp(re, 'gi'), (match => `<mark>${match}</mark>`))
        }

      } else {
        return text
      }
    },
    addPlace(evt) {
      this.placeInputData = evt;
      this.isPlaceWizardFormModalActive = true;
    },
    unlinkPlace({ label, id, relationId, roleId }) {
      console.log("Document.vue unlinkPlace { id, relationId, roleId }", label, id, relationId, roleId)
      this.$store.dispatch("placenames/unlinkFromDocument", {
        label,
        id,
        relationId,
        roleId,
      });
    },
    addPerson(evt) {
      this.personInputData = evt;
      this.isPersonWizardFormModalActive = true;
      console.log("this.personInputData(=evt) / this.isPersonWizardFormModalActive", this.personInputData, this.isPersonWizardFormModalActive)
    },
    unlinkPerson({ label, id, relationId, roleId }) {
      this.$store.dispatch("persons/unlinkFromDocument", {
        label,
        id,
        relationId,
        roleId,
      });
    },
    addNote(evt) {
      console.log("Document.vue / addNote : ", evt)
      this.noteInputData = null;
      this.noteInputData = evt;
      this.isNoteListFormModalActive = false;
      this.isNoteFormModalActive = false;
      if (evt.list) {
        // open NoteForm with list of existing Notes
        console.log("Document.vue / addNote is a list of Notes, evt, noteInputData", evt, this.noteInputData);
        this.noteInputData = evt;
        this.notesListData = evt.list;
        this.isNoteListFormModalActive = true;
      } else if (evt.action === "new") {
          // open NoteForm for new note
          console.log("Document.vue / addNote has evt with NEW flag", evt, this.noteInputData);
          this.noteInputData = evt;
          this.isNewNoteFormModalActive = true
      } else if (evt.action === "update") {
          // open NoteActions
          console.log("Document.vue / addNote has evt with UPDATE flag, evt, noteInputData", evt, this.noteInputData);
          this.noteInputData = evt;
          this.isNewNoteFormModalActive = true;
        } else {
          console.log("Document.vue / addNote has evt with NO flag, evt, noteInputData", evt, this.noteInputData);
          this.noteInputData = evt;
          this.isNoteFormModalActive = true;
      }
    },
    refreshTitle(evt) {
      console.log("DocumentVue / refreshTitle(evt) or titleEditor", evt)
      this.titleEditor = evt
    },
    refreshArgument(evt) {
      console.log("DocumentVue / refreshArgument(evt) or argumentEditor", evt)
      this.argumentEditor = evt
      this.argumentContent = evt;
    },
    refreshTranscription(evt) {
      console.log("DocumentVue / refreshTranscription(evt) or transcriptionEditor", evt)
      this.transcriptionEditor = evt;
      this.transcriptionContent = evt;
    },
    refreshAddress(evt) {
      console.log("DocumentVue / refreshAddress(evt) or addressEditor", evt)
      this.addressEditor = evt
      this.addressContent = evt;
    },
    saveField(fieldName, attributeName) {
        const attributes = {};
        attributes[fieldName] = this[attributeName];
        const data = { id: this.docId, type: "document", attributes };
        this.$store.dispatch('document/save', data);
    },
    updateMiradorTopPosition() {
      const textView = document.getElementById("document-text-view");
      if (textView) {
        const top = textView.getBoundingClientRect().top;
        const textViewContents = document.getElementById("document-text-view__contents");
        const topMax = textViewContents.getBoundingClientRect().height;
        this.miradorViewBoundingTop = top < 0 ? Math.min(topMax, -Math.floor(top)) : 0;
      }
    }
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";

.document {
  width: 100%;
  margin-top: 30px;

  & > .columns {
    align-items: center;
    margin-left: 0 !important;
    margin-right: 0 !important;

    .tags {
      padding: 0;
      margin: 0;
    }
  }

  & > .document__content {
    margin-bottom: 20px;
  }

  // Mode lecture
  &:not(.can-edit) {

    /* Ajout par Victor */
    & > .document__display > .document__content {
      width: 100%;
    }

    & > .document__display > .document__content.images-mode {
      margin-top: 20px;
      display: none !important;
    }

    & > .document__display > .document__content.text-mode {
      margin-top: 20px; /* margin not working ?? */
    }

    & > .document__display > .document__content.text-and-images-mode {
      margin-top: 20px;
      width: 50% !important;

      @include on-mobile {
        width: 100% !important;
      }
    }

    /* Fin ajout par Victor */

    .document-section {
      margin-bottom: 40px;

      @include on-mobile {
        margin-bottom: 20px;
      }

      .heading span.icon {
        display: none !important;
      }

      // Cas particulier du Titre du document
      &.document-section-for-title {

        .heading {
          display: none !important;
        }

        & > .collapse {
          ::v-deep {
            .collapse-content {
              padding: 0;

              .column {
                padding: 10px 0;

                @include on-tablet {
                  padding: 10px 0;
                }
              }

            }
          }
        }
      }

      & > .collapse {
        ::v-deep {
          .collapse-content {
            display: block !important;
            padding: 0 20px;

            @include on-mobile {
              padding: 0;
            }

            .panel-block {
              padding-left: 0;
              padding-right: 0;
            }
          }
        }
      }
    }
  }

  // Mode preview
  &.is-preview {
    margin-top: 0;

    & > .document__content {
      margin-top: 0;
      margin-bottom: 0;

      & > .document-section:first-child {
        margin-top: 0;
      }
    }

    & .document-section-content {
      margin-top: 10px;
      margin-left: 0;

      ::v-deep {

        .edit-btn {
          display: none !important;
        }

        .breadcrumb.is-small a {
          font-family: $family-primary !important;
        }

        .breadcrumb.is-small,
        .witness-list ul li span.columns,
        .tags.are-medium .tag:not(.is-normal):not(.is-large),
        .control {
          font-size: $font-size-text !important;
          line-height: 1.2;
          font-weight: 400;

          @include on-tablet {
            font-size: $font-size-text-tablet !important;
          }

          @include on-mobile {
            font-size: $font-size-text-mobile !important;
          }
        }
      }
    }

  }

  &:not(.is-preview) {
    ::v-deep {

      .document__transcription--tr-content .document__transcription--content {
        padding-top: 0;
        padding-left: 0;
        background: none;
      }

      .witness-list {
        .list-group-item .column {
          padding-left: 0;
          padding-right: 0;
        }
      }

      & > .document__display {
        gap: 20px;

        @include on-mobile {
          flex-direction: column-reverse;
        }

        & > .document__display > .document__content.text-and-images-mode {
          width: calc( 50% - 10px ) !important;

          @include on-mobile {
            width: 100% !important;
          }
        }
      }

    }
  }

  // Mode édition
  &.can-edit {

    nav.previous-next-navigation {
      padding-bottom: 10px;
      border-bottom: #FDB3CC solid 1px;
      margin-bottom: 30px;
    }

    & > .document__display {
      gap: 20px;
      margin-top: 20px;

      @include on-mobile {
        flex-direction: column-reverse;
      }
    }

    & > .document__display > .document__content,
    & > .document__display > .document__content.text-mode {
      display: block !important;
      width: 100%;
    }

    & > .document__display > .document__content.images-mode {
      display: none !important;
    }

    & > .document__display > .document__content.text-and-images-mode {
      width: calc( 50% - 10px ) !important;

      @include on-mobile {
        width: 100% !important;
      }
    }

    /* Fin ajout par Victor */

    & > .columns {
      display: flex !important;
    }

    .document-section {
      border: 1px solid #FF0052;
      border-radius: 5px;
      padding: 30px;
      margin-bottom: 30px;

      @include on-tablet {
        padding: 20px;
      }

      @include on-mobile {
        padding: 15px;
      }

      &.columns {
        margin: 30px 0 40px !important;
      }

      .column {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      .document-section-content {
        margin-bottom: 0;

        @include on-tablet {
          margin-left: 40px !important;
        }

        @include on-mobile {
          margin-left: 0 !important;
        }

        ::v-deep {

          .has-add-btn {
            display: flex !important;
            align-items: center;
            gap: 8px;
            line-height: 20px;

            a.tag .icon {
              width: 20px !important;
              height: 20px !important;
              margin: 0 !important;
              padding: 0 !important;

              .icon__line {
                stroke: #FFFFFF;
              }
            }

            a.tag:hover .icon circle {
              fill: #C00055;
            }
          }
        }
      }

      &.document-section-for-title {
        ::v-deep {
          .editable-field .control {
            align-items:center;

            @include on-mobile {
              align-items:flex-start;
            }
          }
        }
      }

      &.document-section-for-title,
      &.document-section-for-dates .document-section-content,
      &.document-section-for-transcription .document-section-content,
      &.document-section-for-analyse .document-section-content {
        ::v-deep {

          .edit-btn,
          .close-btn {
            flex: 40px 0 0;
            @include on-mobile {
              flex: 30px 0 0;
            }
          }

          .edit-btn {
            @include on-mobile {
              background-position: left top 5px !important;
            }
          }

        }
      }

      &.document-section-for-analyse .document-section-content {
        ::v-deep {
          .panel-block {
            align-items: flex-start;
          }
        }
      }

      &.document-section-for-transcription .document-section-content,
      &.document-section-for-analyse .document-section-content,
      &.document-section-for-dates .document-section-content {
        margin-left: 0 !important;
      }

      &.document-section-for-title,
      &.document-section-for-analyse .document-section-content,
      &.document-section-for-transcription .document-section-content {
        ::v-deep {
          h3 {
            margin-left: 40px;
          }

          .rich-text-editor {
            margin-left: 40px;
          }

          .ql-editor {
            background-color: #F8F8F8;
            font-family: $family-primary;
            font-size: $font-size-text;

            @include on-tablet {
              font-size: $font-size-text-tablet;
            }

            @include on-mobile {
              font-size: $font-size-text-mobile;
            }

            p {
              margin: 10px 0;

              &:first-child {
                margin-top: 0;
              }
              &:last-child {
                margin-bottom: 0;
              }
            }
          }
        }
      }

      &.document-section-for-title {
        ::v-deep {
          .rich-text-editor {
            padding-right: 40px;

            @include on-tablet {
              padding-right: 20px;
            }

            @include on-mobile {
              padding-right: 0;
            }
          }
        }
      }

      &.collections-document-section .document-section-content {
        ::v-deep {

          & > div > ul {
            display: flex;
            gap: 12px;
            flex-wrap: wrap !important;
            align-items: flex-start;

            & > li {
              line-height: 1;
            }
          }

          span.tag {
            margin: 5px 10px 10px 0;
            white-space: break-spaces;
          }

          .tags.has-addons {
            padding: 5px 32px 7px 7px !important;
            margin-bottom: 5px !important;

            a.tag.is-delete {
              top: 5px !important;
            }
          }
        }
      }

      & > .heading {

        span.icon {
          display: inline-block;
          cursor: pointer;
          width: 24px;
          height: 24px;
          background: url(../../assets/images/icons/open_text.svg) center / 24px auto no-repeat;
          order: 3;

          i {
            display: none;
          }

          &[aria-expanded=true] {
            background: url(../../assets/images/icons/close_text.svg) center / 18px auto no-repeat;
          }
        }

        span {
          font-size: $font-size-text;

          @include on-tablet {
            font-size: $font-size-text-tablet;
          }

          @include on-mobile {
            font-size: $font-size-text-mobile;
          }

        }

        &::after {
          display: none;
        }
      }

      ::v-deep {

        .document-date__attributes {
          display: flex;
          align-items: center;

          @include on-tablet {
            align-items: flex-start;
          }

          .field {
            margin-bottom: 0;

            @include on-tablet {
              margin-bottom: 15px;
            }
          }
        }

        .panel-block {
          display: flex !important;
        }

        .document__transcription {
          margin-left: 0;
        }

        .document__transcription .panel-block {
          display: block !important;
        }

        .document-correspondents .panel-block {
          flex-direction: column;
          align-items: flex-start;
        }

        /* Etiquettes */
        .tags.has-addons {
          position: relative;
          margin: 0 0 5px !important;
          padding: 5px 32px 7px 7px !important;
          background-color: #F0F0F0 !important;
          display: inline-block !important;
          border-radius: 5px;
          font-size: 16px !important;
          line-height: 1 !important;

          span.tag {
            display: inline-flex;
            height: auto !important;
            margin: 0;
            vertical-align: top;
            line-height: 1;

            a {
              padding: 0 3px;
              font-size: 16px;
              color: #6D7278;
            }
          }

          a.tag.is-delete {
            position: absolute;
            right: 7px;
            top: 7px;
            display: inline-flex;
            width: 18px;
            height: 18px;
            background-color: #8C8C8C;
            border-radius: 50%;

            &::before,
            &::after {
              background-color: #F0F0F0;
            }
          }
        }

        /* Etiquettes témoins */
        .witness-list {
          .tags.has-addons {
            padding: 5px 10px 4px !important;

            @include on-mobile {
              padding: 5px 7px 3px !important;
            }

            &:after {
              content: "" !important;
              margin-right: 0 !important;
            }
          }
        }


      }

    }
  }
}

nav.previous-next-navigation {
  display: flex;
  gap: 12px;

  @include on-mobile {
    gap: 6px;
  }

  a.pagination-link {
    border: none;
    padding: 0 !important;
    margin: 0;
    min-width: unset !important;
    height: 30px;

    @include on-mobile {
      transform: scale(0.9,0.9);
    }

    &::after {
      content: "";
      display: inline-block;
      width: 30px;
      height: 30px;
      background: url(../../assets/images/icons/lettre_nav_precedent.svg) center / 30px auto no-repeat !important;

      @include on-mobile {
      }
    }

    &.pagination-next,
    &.pagination-previous {
      flex-grow: 0;
    }

    &.pagination-next::after {
      transform: rotate(180deg);
      transform-origin:50% 50%;
    }

    .icon {
      display: none;
    }
  }

  router-link.pagination-link {
    border: none;
    padding: 0 !important;
    margin: 0;
    min-width: unset !important;
    height: 30px;

    @include on-mobile {
      transform: scale(0.9,0.9);
    }

    &::after {
      content: "";
      display: inline-block;
      width: 30px;
      height: 30px;
      background: url(../../assets/images/icons/lettre_nav_precedent.svg) center / 30px auto no-repeat !important;

      @include on-mobile {
      }
    }

    &.pagination-next,
    &.pagination-previous {
      flex-grow: 0;
    }

    &.pagination-next::after {
      transform: rotate(180deg);
      transform-origin:50% 50%;
    }

    .icon {
      display: none;
    }
  }
}

.document-tag-bar {
  display: flex !important;
  gap: 50px;

  @include on-mobile {
    gap: 20px;
  }

}

.document-section {
  flex-direction: column;
  align-items: flex-start;

  font-family: $family-primary;
  font-size: $font-size-text;
  line-height: 1.3;

  @include on-tablet {
    font-size: $font-size-text-tablet;
  }

  @include on-mobile {
    font-size: $font-size-text-mobile;
  }

  // Section : Titre du document et langues
  &.columns {
    margin: 20px 0 50px;

    .column {
      padding: 0 !important;
      border: none;

      &.component {
        align-self: flex-start !important;
      }

      &:first-child {
        width: 100%;
      }
    }
  }

  .document-title__component {
    margin-right: 40px;
  }

  .document-languages__component {
    ::v-deep {

      .field {
        gap: 10px;
      }

      .label {
        line-height: 40px;
      }

      .tag:not(body).is-light {
        background: none;
        padding-left: 0;
        font-family: $family-primary;
        font-size: 16px;
        line-height: 1.2;
        color: #6D7278;
        font-weight: 400;

        @include on-mobile {
          font-size: 14px;
        }
      }
    }
  }


  // Sections : Termes et contenus des metadonnées

  & > .heading {
    display: flex;
    gap: 2px;
    margin-bottom: 20px;

    font-size: 16px;
    line-height: 1;
    font-weight: 500;
    color: #FF0052;
    letter-spacing: 0;
    text-transform: uppercase;

    @include on-mobile {
      margin-bottom: 10px;
      font-size: 13px;
    }

    .heading-content {
      display: inline-block;
    }

    &::after {
      display: block;
      content: '';
      width: 100%;
      border-bottom: 1px solid #FF0052;
      transform: translateY(-3px);
    }
  }

  .document-section-content {
    margin-left: 40px;
    margin-right: 40px;
    margin-bottom: 20px;

    @include on-tablet {
      margin-left: 20px;
      margin-right: 20px;
      margin-bottom: 10px;
    }

    @include on-mobile {
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 0;
    }

    ::v-deep {

      a {
        color: #000000;

        &:hover {
          color: #C00055;
          text-decoration: underline;
        }
      }

      .label,
      .heading {
        font-size: 16px;
        color: #000000;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0;

        @include on-mobile {
          font-size: 13px;
        }
      }

      .tags.are-medium .tag:not(.is-normal):not(.is-large),
      .control {
        font-size: $font-size-text;
        line-height: 1.2;
        height: auto;

        @include on-tablet {
          font-size: $font-size-text-tablet;
        }

        @include on-mobile {
          font-size: $font-size-text-mobile;
        }
      }

      .panel {
        -webkit-box-shadow: none;
        box-shadow: none;

        font-size: $font-size-text;
        font-family: $family-primary;

        @include on-tablet {
          font-size: $font-size-text-tablet;
        }

        @include on-mobile {
          font-size: $font-size-text-mobile;
        }

        .panel-block {
          border: none;
          padding: 0;
          margin-bottom: 20px;

          & > .argument__content,
          & > :nth-child(2) {
            font-size: $font-size-text;
            color: #585858;
            font-weight: 400;
            letter-spacing: 0;

            @include on-tablet {
              font-size: $font-size-text-tablet;
            }

            @include on-mobile {
              font-size: $font-size-text-mobile;
            }
          }
        }
      }

      .tag {
        background: none;
        padding: 0;
        margin:0;

        .breadcrumb.is-small {
          font-size: $font-size-text;
          font-weight: 400;

          @include on-tablet {
            font-size: $font-size-text-tablet;
          }

          @include on-mobile {
            font-size: $font-size-text-mobile;
          }

          a {
            color: #000000;

            &:hover {
              color: #C00055;
              text-decoration: underline;
            }
          }
        }
      }

      .document-placenames .columns {
        flex-direction: column;
      }

      .document__transcription--tr-content .document__transcription--content {
        font-size: $font-size-text;

        @include on-tablet {
          font-size: $font-size-text-tablet;
        }

        @include on-mobile {
          font-size: $font-size-text-mobile;
        }
      }


    }

  }

  &.collections-document-section {

    ::v-deep {

      .document-section-content {

        .control.autocomplete .control {
          position: relative;

          input {
            padding-right: 40px;
            box-shadow: none !important;

            &:focus {
              outline: none !important;
              border-color: #6D7278 !important;
            }
          }

          &::after {
            content: "";

            position: absolute;
            top:0;
            right: 0;

            display: inline-block;
            width: 40px !important;
            height: 40px !important;
            background: url(../../assets/images/icons/loupe_collec.svg) center / 25px auto no-repeat;

            @include on-mobile {
              width: 20px;
              height: 20px;
            }
          }
        }

        .tags.has-addons {
          position: relative;
          margin: 0 !important;
          padding: 0 30px 0 0;

          span.tag {
            display: inline-flex;
            height: auto !important;
            margin: 0;
            vertical-align: top;

            .breadcrumb li {
              line-height: 1;
            }

            a {
              padding: 0 3px;
              font-size: 16px;
              color: #6D7278;
            }

            nav > ul {
              line-height: 1.25;
            }
          }
        }

      }
    }

  }
}

.delete-button {
  flex: 38px 0 0;
  padding: 0;

  ::v-deep {

    & > a.tag {
      display: inline-block;
      width: 38px;
      max-width: unset;
      max-height: unset;
      height: 38px;
      background: url(../../assets/images/icons/bouton_supprimer.svg) center / 38px auto no-repeat !important;
      border-radius: 0!important;
      border: none !important;
      margin: 0;
      text-indent: -9999px;

      .icon {
        display: none;
      }
    }
  }
}


.slope-container {
  height: 3px;
  //width: 227px;
  display: flex;
}

.slope {
  transform: skewX(45deg);
  display: none;
}
.tier-1 {
  width: 120px;
  background-color: #557174;
}
.tier-2 {
  width: 14px;
  background-color: #96bb7c;
}
.tier-3 {
  width: 7px;
  background-color: #c6ebc9;
}
.tier-4 {
  width: 160px;
  background-color: #baaf92;
}

.has-add-btn.is-flex {
  gap: 5px;
}

::v-deep {
  .modal.is-active {
    .animation-content {
      width: 90% !important;
      max-width: 100% !important;
      margin: 20px auto !important;

      @include on-tablet {
        width: 100% !important;
        margin: 0 !important;
      }

      .modal-close {
        @include on-tablet {
          right: 30px !important;
          top: 20px !important;
        }

        @include on-mobile {
          right: 10px !important;
          top: 20px !important;
        }
      }
    }
  }
}

.button.open-modal-button {
  display: flex !important;
  align-items: center;
  line-height: 20px;

  height: 20px !important;
  background-color: transparent !important;
  border: none;
  padding: 0;

  ::v-deep {

    span {
      display: inline-block;
      width: 20px;
      height: 20px;

      .icon {
        width: 20px !important;
        height: 20px !important;
        margin: 0 0 0 8px !important;
        padding: 0 !important;

        .icon__line {
          stroke: #FFFFFF;
        }
      }
    }
  }

  &:hover {
    ::v-deep {
      .icon circle {
        fill: #C00055;
      }
    }
  }

}
.hiddendiv {
  display: none;
}

/* Ajout par Victor */
.controls {
  width: 100%;
  border-top: 1px dashed #b9192f;
  border-bottom: 1px solid #b8b8b8;
  padding: 12px 0 5px;
  margin-bottom: 30px;
  justify-content: center;
  align-items: center;
  gap: 20px;

  @include on-mobile {
    gap: 10px;
  }

  & > li {

    @include on-mobile {
      &:nth-child(2) {
        /* display: none; */
      }
    }

    & > a {
      display: inline-block;
      height: 42px;
      max-width: unset;
      max-height: unset;
      border-radius: 0!important;
      border: none !important;
      margin: 0;
      text-indent: -9999px;
    }
  }
}


.controls a.text-btn {
  width: 42px;
  &:not(.text-mode) {
    background: url(../../assets/images/icons/b_text_off.svg) center / auto 42px no-repeat !important;
  }
  &.text-mode {
    background: url(../../assets/images/icons/b_text_on.svg) center / auto 42px no-repeat !important;
  }
}

.controls a.text-images-btn {
  width: 80px;
  &:not(.text-and-images-mode) {
    background: url(../../assets/images/icons/b_text-image_off.svg) center / auto 42px no-repeat !important;
  }
  &.text-and-images-mode {
    background: url(../../assets/images/icons/b_text-image_on.svg) center / auto 42px no-repeat !important;
  }
}

.controls a.images-btn {
  width: 42px;
  &:not(.images-mode) {
    background: url(../../assets/images/icons/b_image_off.svg) center / auto 42px no-repeat !important;
  }
  &.images-mode {
    background: url(../../assets/images/icons/b_image_on.svg) center / auto 42px no-repeat !important;
  }
}

/*.text-mode-only .controls a.text-btn {
  pointer-events: none;
}
.text-mode-only .controls a.text-images-btn,
.text-mode-only .controls a.images-btn {
  pointer-events: none;
  opacity: 0.2;
}*/

.column_mirador.text-mode {
  display: none;
}
.column_mirador.text-and-images-mode {
  width: 50%;
  @include on-mobile {
    width: 100%;
  }
}
.column_mirador.images-mode {
  display: inline-block;
  width: 100%;
}

.mirador-container {
  display: inline-block;
  box-shadow: 0px 0px 1px 1px #00000040;
}
/* Fin ajout par Victor */
</style>
