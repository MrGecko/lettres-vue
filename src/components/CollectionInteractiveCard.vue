<template>
  <div v-if="!isLoading && collection">
    <div class="collection-interactive-card">
      <div class="collection-card-header row is-flex">
        <div class="parent-collection-title">
          <!--<span v-if="!editMode">-->
          <router-link
            :to="{ name: 'collection', params: { collectionId: findRoot(collectionId).id } }"
          >
            <!--{{ collection.title }}-->
            {{ findRoot(collectionId).title }}
          </router-link>
        </div>

        <!--</span>
        <span v-else>
          <div class="field has-addons">
            <div class="control">
              <input
                v-model="collection.title"
                class="input collection-card__title-input"
                type="text"
                placeholder="Titre de la collection"
              >
            </div>
            <div class="control">
              <a
                class="button is-primary"
                :class="saving === 'loading' ? 'is-loading' : ''"
                @click.stop="save"
              >
                <save-button-icon />
              </a>
            </div>
            <router-link
              tag="button"
              class="button control ml-2 is-primary"
              :to="{ name: 'collection', params: { collectionId: collection.id } }"
            ><i class="fas fa-arrow-right" /></router-link>
=======
  <div class="collection-card card">
    <div class="card-content">
      <div class="container">
        <div class="row is-flex is-justify-content-space-between mb-4">
          <div class="col-5">
            <span class="title">
              <router-link
                :to="{ name: 'collection', params: { collectionId: findRoot(collectionId).id } }"
                class="collection_title mt-3 mb-5"
              >
<<<<<<< HEAD
                {{ findRoot(collectionId).title }}
              </router-link>
            </span>
          </div>
          <div class="col-5">
            <b-button
              class="TOC-button ml-auto is-small"
              @click="showHierarchy = !showHierarchy"
            >
              SOMMAIRE
            </b-button>
            <b-sidebar
              v-model="showHierarchy"
              position="fixed"
              :right="true"
              :fullheight="true"
              class="m-3"
              style="width: 500px"
            >
              <div class="m-3">
                <p class="menu-label">
                  SOMMAIRE
                </p>
                <collection-hierarchy
                  :collection-id="collectionId"
=======
                <router-link
                  :to="{ name: 'collection', params: { collectionId: collection.id } }"
                  class="mt-3 mb-5 collection_title"
                >
                  {{ collection.title }}
                </router-link>
              </span>
              <span v-else>
                <div class="field has-addons">
                  <div class="control">
                    <input
                      v-model="collection.title"
                      class="input collection-card__title-input"
                      :class="{'input--error':!collection.title}"
                      type="text"
                      :initial-value="collection.title"
                      required
                    >
                  </div>
                  <div class="control">
                    <a
                      type="submit"
                      :disabled="!collection.title"
                      class="button is-primary"
                      :class="saving === 'loading' ? 'is-loading' : ''"
                      @click.stop="save"
                    >
                      <save-button-icon />
                    </a>
                  </div>
                  <div>
                    <collection-deletion
                      v-if="current_user && current_user.isAdmin"
                      :collection-id="collectionId"
                    />
                  </div>
                </div>
              </span>
              <p
                v-if="!editMode || collection.title === 'Non triées'"
                class="mt-3"
              >
                <span
                  v-html="collection.description"
                />
                <span>({{ collection.documentCount }} documents)</span>
              </p>
              <p
                v-else
                class="mt-3"
              >
                <title-field-in-place
                  :tabulation-index="0"
                  label="Titre"
                  name="title"
                  not-set="Non renseigné"
                  :initial-value="collection.description"
                  :editable="true"
                  :formats="descriptionFormats"
                  @changed="saveDescription"
>>>>>>> upstream/dev
                />
              </div>
            </b-sidebar>
>>>>>>> upstream/dev
          </div>
        </span>-->

        <div class="collection-actions central-column is-flex">
          <!-- Nouvelle sous-collection -->
          <router-link
            v-if="current_user && current_user.isAdmin"
            v-slot="{ navigate }"
            to="create"
            custom
            append
          >
            <create-button
              label="Créer une sous-collection"
              @click="navigate"
            />
          </router-link>
          <!-- RTE-type save button
          <button
            v-if="editModeEnabled"
            class="argument__save button is-small"
            :class="saveButtonClass"
            :disabled="status === 'disabled'"
            @click="save"
          >
            <component :is="saveButtonIcon" />
          </button>-->
          <div class="is-flex">
            <div
              v-if="editModeEnabled"
              class="control"
            >
              <a
                type="submit"
                :disabled="!collection.title"
                class="button is-primary"
                :class="saving === 'loading' ? 'is-loading' : ''"
                @click.stop="save"
              >
                <save-button-icon
                  :status="status"
                />
              </a>
            </div>
            <div
              v-if="current_user && current_user.isAdmin"
              :class="editModeEnabled ? 'edit-btn-closed' : 'edit-btn'"
              @click="enterEditMode"
            />
            <!-- Supprimer la collection -->
            <collection-deletion
              v-if="current_user && current_user.isAdmin"
              :collection-id="collectionId"
              :collection-title="collection.title"
            />
          </div>
        </div>
      </div>

      <div
        class="collection-card-body row is-flex"
        style="vertical-align: center"
      >
        <!-- Colonne 1 : vignette -->
        <div class="column thumbnail-column">
          <div class="collection-thumbnail">
            <img
              id="card_image"
              :src="getImgUrl(collectionId)"
              alt="Card image cap"
            >
          </div>
          <div class="collection-thumbnail-caption">
            Légende (TEST)
          </div>
        </div>

        <!-- Colonne 2 : metadonnées de la collections -->
        <div class="column central-column metadata-column">
          <!-- Titre de la collection -->
          <span
            v-if="!editMode || collection.title === 'Non triées'"
          >
            <router-link
              :to="{ name: 'collection', params: { collectionId: collection.id } }"
              class="collection-title"
            >
              {{ collection.title }}
            </router-link>
          </span>
          <div v-else>
            <!-- Button left to title
            <span
              :class="editModeEnabled ? 'edit-btn-closed' : 'edit-btn'"
              @click="enterEditMode"
            />-->
            <div
              v-if="!editModeEnabled"
            >
              <router-link
                :to="{ name: 'collection', params: { collectionId: collection.id } }"
                class="collection-title"
              >
                {{ collection.title }}
              </router-link>
            </div>
            <div
              v-else
              class="field has-addons"
            >
              <input
                v-model="collection.title"
                required
                class="input collection-card__title-input"
                :class="{'input--error':!collection.title}"
                type="text"
                :initial-value="collection.title"
                @keyup.esc="enterEditMode"
              >
              <!-- original save button next to title
              <div class="control">
                <a
                  type="submit"
                  :disabled="!collection.title"
                  class="button is-primary"
                  :class="saving === 'loading' ? 'is-loading' : ''"
                  @click.stop="save"
                >
                  <save-button-icon />
                </a>
              </div>-->
            </div>
          </div>

          <!-- Date de la collection -->
          <div class="collection-dates">
            <span>{{ current_user ? collection.dateMin || "..." : collection.dateMinPub || "..." }}</span>
            <span>{{ current_user ? collection.dateMax || "..." : collection.dateMaxPub || "..." }}</span>
          </div>

          <!-- Description de la collection -->
          <div class="collection-description">
            <!--<span
              :class="editModeEnabled ? 'edit-btn-closed' : 'edit-btn'"
              @click="enterEditMode"
            />-->
            <p v-if="!editMode || !editModeEnabled || collection.title === 'Non triées' ">
              <span v-html="collection.description" />
            </p>
            <p v-else>
              <rich-text-editor
                v-if="editMode && editModeEnabled"
                v-model="form"
                :editable="editMode && editModeEnabled"
                :formats="[['close'],['superscript']]"
                @changed="saveDescription"
                @on-keyup-escape="cancelInput($event)"
              >
                <!--<button
                  class="button is-small"
                  :class="saveButtonClass"
                  :disabled="status === 'disabled'"
                  @click="saveDescription"
                >
                  <component :is="saveButtonIcon" />
                </button>-->
              </rich-text-editor>
              <!-- original TitleFieldInPlace for description
              <title-field-in-place
                :tabulation-index="0"
                label="Titre"
                name="title"
                not-set="Non renseigné"
                :initial-value="collection.description"
                :editable="true"
                :formats="descriptionFormats"
                @changed="saveDescription"
              />-->
            </p>
          </div>
          <!-- Responsables scientifiques de la collection (collection racine seulement) -->
          <collection-responsables
            v-if="collection.title !== 'Hors collections' && !collection.parent"
            :collection-id="collection.id"
          />
          <!-- Curateur de la collection -->
          <div
            v-if="!editModeEnabled || !editMode || collection.title === 'Hors collections'"
            class="collection-user-roles"
          >
            <p>
              Curateur :
            </p>
            <div class="collection-user-roles-value">
              <a>{{ collection.admin.username }}</a>
            </div>
          </div>
          <div
            v-else
            class="collection-user-roles control"
          >
            <p>
              Curateur :
            </p>
            <div class="is-inline-block">
              <b-field>
                <div class="select-parent">
                  <select @change="updateCuratorId">
                    <option :value="collection.admin.id">
                      {{ collection.admin.username }}
                    </option>
                    <option
                      v-for="option in users.filter((u) => u.isAdmin === true && u.id !== collection.admin.id)"
                      :key="option.id"
                      :value="option.id"
                    >
                      {{ option.username }}
                    </option>
                  </select>
                </div>
              </b-field>
            </div>
          </div>
        </div>

        <!-- not in Carine code {{ error.title }}
        <router-link
          tag="button"
          class="button control ml-2 is-primary"
          :to="{ name: 'collection', params: { collectionId: collection.id } }"
        ><i class="fas fa-arrow-right" /></router-link>
      </div>-->
        <!--<div class="control">
          <b-field label="Curator">
            <select @change="updateCuratorId">
              <option :value="collection.admin.id">{{ collection.admin.username }}</option>
              <option
                v-for="option in users.filter((u) => u.isAdmin === true && u.id !== collection.admin.id)"
                :key="option.id"
                :value="option.id"
              >
                {{ option.username }}
              </option>
            </select>
          </b-field>
        </div>-->

        <!-- Colonne 3 : Sommaire -->
        <div class="column toc-column">
          <b-button
            class="TOC-button"
            :class="showHierarchy ? 'opened' : ''"
            @click="showHierarchy = !showHierarchy"
          >
            SOMMAIRE
          </b-button>
          <div v-if="showHierarchy">
            <collection-hierarchy
              :collection-id="collectionId"
              class="TOC-content"
            />
          </div>
        </div>
      </div>

      <!--Carine code <div class="control">
        <a
          @click.stop="save"
          class="button is-primary"
          :class="saving === 'loading' ? 'is-loading' : ''"
        >
          <save-button-icon />
        </a>
      </div>
      <div class="control">
        <a
          @click.stop="deleteCollectionUI"
          class="button is-primary"
          :class="deleting === 'loading' ? 'is-loading' : ''"
        >
          <delete-button-icon :status="deleting === 'error' ? 'error' : deleting === 'normal' ? 'normal' : ''" />
        </a>
      </div>
    </div>
  </span>
  </span>-->
      <!--<div class="columns is-vcentered">
        <img
          id="card_image"
          class="card-img-left m-6 is-inline-block is-rounded"
          :src="getImgUrl(collectionId)"
          alt="Card image cap"
        >
        <div class="column">
          <div class="card-content">
            <div class="is-flex is-justify-content-space-between mb-4">
              <span class="title is-flex is-justify-content-space-between">
                <span v-if="!editMode">
                  <router-link
                    :to="{ name: 'collection', params: { collectionId: collection.id } }"
                    class="mt-3 mb-5"
                  >
                    {{ collection.title }}
                  </router-link>
                </span>
                <span v-else>
                  <div class="field has-addons">
                    <div class="control">
                      <input
                        v-model="collection.title"
                        class="input collection-card__title-input"
                        type="text"
                        placeholder="Titre de la collection"
                      >
                    </div>
                    <div class="control">
                      <a
                        class="button is-primary"
                        :class="saving === 'loading' ? 'is-loading' : ''"
                        @click.stop="save"
                      >
                        <save-button-icon />
                      </a>
                    </div>
                    <router-link
                      tag="button"
                      class="button control ml-2 is-primary"
                      :to="{ name: 'collection', params: { collectionId: collection.id } }"
                    ><i class="fas fa-arrow-right" /></router-link>
                  </div>
                  <div class="control">
                    <b-field label="Curator">
                      <select @change="updateCuratorId">
                        <option :value="collection.admin.id">{{ collection.admin.username }}</option>
                        <option
                          v-for="option in users.filter((u) => u.isAdmin === true && u.id !== collection.admin.id)"
                          :key="option.id"
                          :value="option.id"
                        >
                          {{ option.username }}
                        </option>
                      </select>
                    </b-field>
                  </div>
                </span>
              </span>
            </div>

            <div class="collection-dates">
              <u>Dates :</u> {{ collection.dateMin || "..." }} -
              {{ collection.dateMax || "..." }}
            </div>

            <p v-if="!editMode">
              <span v-html="collection.description" /> ({{
                collection.documentCount
              }}
              documents)
            </p>
            <p v-else>
              <title-field-in-place
                :tabulation-index="0"
                label="Titre"
                name="title"
                not-set="Non renseigné"
                :initial-value="collection.description"
                :editable="true"
                :formats="descriptionFormats"
                @changed="saveDescription"
              />
            </p>
          </div>
        </div>
      </div>-->

      <footer class="card-footer is-flex is-justify-content-end" />
    </div>
  </div>
</template>

<script>
import {mapState, mapActions, mapGetters} from "vuex";
import CollectionHierarchy from "@/components/CollectionHierarchy.vue";
import TitleFieldInPlace from "@/components/forms/fields/TitleFieldInPlace";
import SaveButtonIcon from "@/components/ui/SaveButtonIcon";
import CollectionDeletion from "@/components/CollectionDeletion.vue";
import CollectionResponsables from "@/pages/CollectionResponsables.vue";
import EditorSaveButton from "@/components/forms/fields/EditorSaveButton.vue";
import RichTextEditor from "@/components/forms/fields/RichTextEditor.vue";
import IconSave from '@/components/ui/icons/IconSave';
import IconError from '@/components/ui/icons/IconError';
import IconSuccess from '@/components/ui/icons/IconSuccess';
import CreateButton from "@/components/ui/CreateButton.vue"


export default {
  name: "CollectionInteractiveCard",
  components: {
    CollectionResponsables,
    SaveButtonIcon,
    CollectionHierarchy,
    CollectionDeletion,
    RichTextEditor,
    CreateButton,
  }, // original component for description TitleFieldInPlace
  props: {
    collectionId: { type: Number, required: true },
    editable: { type: Boolean, default: false },
  },
  data() {
    return {
      isLoading: true,
      form: "",
      editModeEnabled: false,
      saving: "normal",
      deleting: "normal",
      collection: null,
      showHierarchy: false,
      curatorId: null,
      status: 'normal',
      error: {},
    };
  },
  computed: {
    ...mapState("collections", ["collectionsById", "selectedCollection"]),
    ...mapState("user", ["current_user", "users"]),
    ...mapGetters("collections", ["findRoot"]),
    saveButtonClass () {
              switch (this.status) {
                  case 'normal':
                  case 'disabled':
                      return 'is-success'
                  case 'success':
                      return 'is-success'
                  case 'error':
                      return 'is-danger'
                  case 'loading':
                      return 'is-loading'
                  default:
                      return 'is-danger'
              }
          },
          saveButtonIcon () {
              switch (this.status) {
                  case 'normal':
                  case 'loading':
                  case 'disabled':
                      return IconSave;
                  case 'success':
                      return IconSuccess;
                  case 'error':
                      return IconError;
                  default:
                      return IconError;
              }
          },
    editMode() {
      return (
        this.editable &&
        //this.editModeEnabled &&
        this.collection &&
        this.current_user &&
        this.current_user.isAdmin
      );
    },
  },
  watch: {
    "collection.title"() {
      this.saving = "normal";
    },
    collectionId: async function () {
      await this.load();
    },
  },
  async mounted() {
    await this.load();
    console.log('Mounted this.collection.description', this.collection.description);
    this.form = this.collection.description || "";
  },
  async created() {
    this.isLoading = true;
    if (this.current_user) {
      this.fetchUsers()
    }
    await this.load();
    this.curatorId = this.collection.admin.id;
    this.isLoading = false;
    /*if (this.$props.collectionId && this.$store.state.collections.collectionsById.length > 0) {
      await this.load();
      this.curatorId = this.collection.admin.id;
    } else {
        await this.fetchAll();
        await this.load();
        this.curatorId = this.collection.admin.id;
    }*/
  },
  methods: {
    ...mapActions("collections", ["saveCollection", "fetchAll", "fetchOne", "deleteCollection"]),
    ...mapActions("user", ["fetchUsers"]),
    cancelInput(evt) {
      console.log("Title event ", { ...evt });
      this.enterEditMode()
    },
    enterEditMode() {
      console.log("this.editModeEnabled", this.editModeEnabled)
      this.editModeEnabled = !this.editModeEnabled
    },
    descriptionFormats() {
      return [["close"],["superscript"]];
    },

    async load() {
      this.collection = this.$store.state.collections.collectionsById[this.$props.collectionId];
      //console.log("interactiveCard async load / ", this.collection)
    },
    async save() {
      if (this.collection.title.length < 1) {
        this.error = {"title": "titre obligatoire"};
        this.loading = false;
        this.status = 'error';
        console.log('error title')
        return;
      }
      this.saving = "loading";
      await this.saveCollection({
        id: this.collection.id,
        title: this.collection.title,
        description: this.form,
        curatorId: this.curatorId,
      }).then(response => {
        this.status = 'success'}
      ).catch(() => {
        this.status = 'error'
      })
      ;
      await this.load();
      this.saving = "success";
      this.status = 'normal';
    },
    async deleteCollectionUI() {
      this.deleting = "loading";
      const resp = await this.deleteCollection({
        id: this.collection.id,
      });
      if (resp.error) {
        this.deleting = "error";
        console.warn("failed to delete collection", this.collection.id, resp.error);
      }
      else {
        this.deleting = "normal";
        this.$router.push({ name: "collections" });
      }
    },

    saveDescription(evt) {
      this.collection.description = evt.value;
      this.save();
    },
    getImgUrl: function (img) {
      try {
        return require('@/assets/images/collections/collection' + img + '.jpg')
      } catch (e) {
        try {
          return require('@/assets/images/collections/collection' + this.findRoot(img).id + '.jpg')
        } catch (e) {
          return require('@/assets/images/collections/default.jpg')
        }
      }
    },
    updateCuratorId(evt) {
      this.curatorId = evt.target.value;
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/sass/main.scss";
@import "@/assets/sass/elements/_select.scss";
@import "@/assets/sass/objects/collection.scss";
@import "@/assets/sass/components/_buttons.scss";

.collection-interactive-card {
  background: none !important;
  border: none !important;

  .collection-card-header {
    gap: 55px;
    align-items: flex-end;
    margin-bottom: 22px;

    @include on-small-desktop {
      gap: 42px;
    }

    @include on-tablet {
      gap: 30px;
    }

    @include on-mobile {
      gap: 15px;
    }

    .parent-collection-title {
      flex: $collection-thumbnail-size 0 0;
      .edit-btn {
        position: unset;
        flex: 55px 0 0;

        display: inline-block;
        width: 25px;
        height: 25px;
        background: url(../assets/images/icons/bouton_edit.svg) center / 25px auto no-repeat !important;
        cursor: pointer;
        .icon.icon__pen-edit {
          display: none;
        }
      }
      font-family: $family-primary;
      font-size: 20px;
      font-weight: 500;
      line-height: 1.2;

      @include on-small-desktop {
        flex: $collection-thumbnail-small-desktop-size 0 0;
      }

      @include on-tablet {
        flex: $collection-thumbnail-tablet-size 0 0;
      }

      @include on-mobile {
        flex: $collection-thumbnail-mobile-size 0 0;
      }

      & > a {
        color: #C00055;
      }
    }

    .collection-actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;

      @media screen and (max-width:500px) {
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-end;
        gap: 20px;
      }

      & > div:last-child {
        align-items: center;
        gap: 20px;

        @include on-small-desktop {
          gap: 10px;
        }
      }

      .edit-btn {
        display: inline-block;
        margin-left: 0;
        cursor: pointer;
        width: 24px;
        height: 38px;
        background: url(../assets/images/icons/bouton_edit.svg) right / 24px auto no-repeat;
        i {
          display: none;
        }
      }

      .edit-btn-closed {
        display: inline-block;
        cursor: pointer;
        width: 24px;
        height: 38px;
        background: url(../assets/images/icons/close_text.svg) center / 18px auto no-repeat;
        i {
          display: none;
        }
      }

      .collection-deletion {
        display: inline-block;
        margin: 0;
      }

      .control > a {
        width: 38px !important;
        height: 38px !important;
      }
    }
  }

  .central-column {
    width: calc( 100% - $collection-thumbnail-size - 290px - 2 * 55px );

    @include on-small-desktop {
      width: calc( 100% - $collection-thumbnail-small-desktop-size - 290px - 2 * 42px );
    }

    @include on-tablet {
      width: calc( 100% - $collection-thumbnail-tablet-size - 30px );
    }

    @include on-mobile {
      width: calc( 100% - $collection-thumbnail-mobile-size - 15px );
    }
  }

  .collection-card-body {
    gap: 55px;

    @include on-small-desktop {
      gap: 42px;
    }

    @include on-tablet {
      display: grid !important;
      grid-template-columns: 180px auto;
      grid-template-rows: auto auto;
      grid-template-areas:
          "collection-card-thumbnail collection-card-metadata"
          "collection-card-thumbnail collection-card-toc";
      gap: 30px;
    }

    @include on-mobile {
      grid-template-columns: 110px auto;
      grid-template-areas:
          "collection-card-thumbnail collection-card-metadata"
          "collection-card-toc collection-card-toc";
      gap: 15px;
    }

    .column {
      padding: 0;
    }

    .thumbnail-column {
      grid-area: collection-card-thumbnail;
      flex: $collection-thumbnail-size 0 0;
      margin-top: 7px;

      @include on-small-desktop {
        flex: $collection-thumbnail-small-desktop-size 0 0;
      }

      @include on-tablet {
        flex: $collection-thumbnail-tablet-size 0 0;
      }
    }

    .metadata-column {
      grid-area: collection-card-metadata;
      width: calc( 100% - $collection-thumbnail-size - 290px - 2 * 55px );
      border-top: #C00055 solid 7px;
      padding-top: 15px;

      @include on-tablet {
        width: 100%;
        padding-bottom: 15px;
      }

      .field.has-addons {
        display: flex;

        .control {
          width: 48px;
        }
      }
      span.edit-btn {
        display: inline-block;
        cursor: pointer;
        width: 24px;
        height: 24px;
        background: url(../assets/images/icons/bouton_edit.svg) center / 24px auto no-repeat;
        i {
          display: none;
        }

      }
      span.edit-btn-closed {
        display: inline-block;
        cursor: pointer;
        width: 24px;
        height: 24px;
        background: url(../assets/images/icons/close_text.svg) center / 18px auto no-repeat;
        i {
          display: none;
        }
      }
    }

    .toc-column {
      grid-area: collection-card-toc;
      flex: 290px 0 0;
      border-top: #C00055 solid 7px;
    }
  }


  .collection-title {
    font-family: $family-primary;
    font-size: 35px;
    font-weight: 500;
    line-height: 1.1;
    color: #000000;
    margin-bottom: 20px;

    @include on-tablet {
      font-size: $font-size-title-tablet;
    }

    @include on-mobile {
      font-size: $font-size-title-mobile;
    }

  }

  .collection-thumbnail {
    width: $collection-thumbnail-size;
    height: $collection-thumbnail-size;
    padding: 0;
    margin-bottom: 15px;
    overflow: hidden;
    border-radius: 20px;

    @include on-small-desktop {
      width: $collection-thumbnail-small-desktop-size;
      height: $collection-thumbnail-small-desktop-size;
    }

    @include on-tablet {
      width: $collection-thumbnail-tablet-size;
      height: $collection-thumbnail-tablet-size;
    }

    @include on-mobile {
      width: $collection-thumbnail-mobile-size;
      height: $collection-thumbnail-mobile-size;
    }

    img {
      width: 100%;
      height: 100%;
      max-height: unset;
      object-fit: cover;
      object-position: center;
      border-radius: 0;
    }
  }

  .collection-thumbnail-caption {
    margin-bottom: 30px;
    font-family: $family-secondary;
    font-size: 16px;
    color: #000000;
    font-weight: 400;
    line-height: 21px;

    @include on-mobile {
      margin-bottom: 15px;
      font-size: 14px;
    }
  }

  .collection-dates {
    margin-bottom: 14px;
    font-family: $family-primary;
    font-size: 16px;
    font-weight: 500;
    color: #6D7278;
    text-transform: uppercase;

    & > span:first-child::after {
      content: ">";
      margin: 0 8px;
    }
  }

  .collection-description {
    margin-bottom: 30px;
    font-family: $family-primary;
    font-size: 18px;
    color: #000000;
    font-weight: 400;
    line-height: 1.2;

    @include on-tablet {
      font-size: $font-size-text-tablet;
    }

    @include on-mobile {
      font-size: $font-size-text-mobile;
    }
  }

  .select-parent {
    margin-top: 5px;
  }

  .collection-user-roles {
    margin-bottom: 30px;

    @include on-tablet {
      margin-top: 10px;
      margin-bottom: 0;
    }

    /* label */
    & > p {
      font-family: $family-primary;
      font-size: 14px;
      font-weight: 500;
      color: #000000;
      text-transform: uppercase;

      @include on-mobile {
        font-size: 13px;
      }
    }

    /* value : read mode */
    .collection-user-roles-value a {
      font-family: $family-primary;
      font-size: 18px;
      font-weight: 400;
      color: #4A4A4A;

      @include on-mobile {
        font-size: 15px;
      }
    }
  }

  .TOC-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 0;
    padding: 12px 10px 14px 2px;
    border:none;
    border-radius: 0;
    border-bottom: solid 1px #C00055;
    box-shadow: none !important;

    font-family: $family-primary;
    font-size: 16px;
    font-weight: 500;
    color: #6D7278;
    text-align: left;

    @include on-tablet {
      margin-bottom: 30px;
    }

    @include on-mobile {
      font-size: 14px;
      margin-bottom: 10px;
    }

    :focus {
      border: none;
      box-shadow: none !important;
    }

    &::after {
      content: "";
      display: inline-block;
      width: 14px;
      height: 10px;
      background: url(../assets/images/icons/open_menu_coll.svg) center right / 14px auto no-repeat;
    }

    &.opened::after {
      transform-origin: 50% 50%;
      transform: rotate(180deg);
    }
  }

  .TOC-content {
    background-color: #F8F8F8;
    padding-bottom: 20px;
    border-bottom: 1px solid #C00055;
    margin-bottom: 30px;

    ::v-deep li  a {
      padding: 0 10px;
    }
  }

  .input--error{
    border-color: red;
  }
}

</style>

