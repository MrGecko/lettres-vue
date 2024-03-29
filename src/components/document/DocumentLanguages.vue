<template>
  <div class="document-languages__component component is-flex is-justify-items-space-between is-align-items-center">
    <span
      v-if="editable"
      :class="!editMode ? 'edit-btn' : 'close-btn'"
      @click="enterEditMode"
    >
      <!-- variable button
      <component
        v-if="editable"
        :is="editButtonIcon"
        class="field-title__icon"
      />-->
    </span>
    <b-field label="Langues">
      <b-taginput
        v-if="editable && editMode"
        v-model="tags"
        placeholder="Français"
        :data="filteredTags"
        :readonly="!editable"
        autocomplete
        field="label"
        open-on-focus
        @click.native="getFilteredTags"
        @typing="getFilteredTags"
        @keyup.esc.native="cancelInput($event)"
      />
      <div v-else>
        <b-taglist>
          <b-tag
            v-for="tag in tags"
            :key="tag.id"
            type="is-light"
          >
            {{ tag.label }}
          </b-tag>
        </b-taglist>
      </div>
    </b-field>
  </div>
</template>

<script>
import {mapActions, mapState} from "vuex";
import IconPenEdit from "../ui/icons/IconPenEdit";
import IconSuccess from "../ui/icons/IconSuccess";

export default {
  name: "DocumentLanguages",
  //components: {IconPenEdit, IconSuccess},
  props: {
    editable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      filteredTags: [],
      tags: [],
      init: false,
      editMode: false
    };
  },
  computed: {
    ...mapState("document", ["document", "languages"]),
    ...mapState("languages", {allLanguages: "languages"}),
    editButtonIcon () {
      if (this.status === 'success') {
        return IconSuccess;
      }
      return IconPenEdit;
    }
  },
  watch: {
    tags() {
      if (this.init) {
        const data = {
          id: this.document.id,
          relationships: {
            languages: {
              data: this.tags.map((l) => {
                return {
                  id: l.id,
                  type: "language",
                };
              }),
            },
          },
        };

        this.$store.dispatch("document/save", data);
        console.log("lang data", data);
      } else {
        this.init = true;
      }
    },
  },
  created() {
    this.filteredTags = this.allLanguages;
    this.tags = this.languages;
  },
  methods: {
    getFilteredTags(text) {
      if (text && text.length > 0) {
        this.filteredTags = this.allLanguages.filter((option) => {
          return option.label.toString().toLowerCase().indexOf(text.toLowerCase()) >= 0;
        });
      } else {
        this.filteredTags = this.allLanguages
      }
    },
    cancelInput(evt) {
      this.enterEditMode()
    },
    enterEditMode() {
      this.editMode = !this.editMode
    }
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";

.component ::v-deep {
  .field {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .label {
    margin: 0;
    font-family: $family-primary;
    font-size: 16px;
    color: #000000;
    font-weight: 500;
    text-transform: uppercase;

    @include on-mobile {
      font-size: 13px;
    }

  }
}
.edit-btn {
  position: unset;
  flex: 55px 0 0;

  display: inline-block;
  width: 25px;
  height: 25px;
  background: url(../../assets/images/icons/bouton_edit.svg) center / 20px auto no-repeat !important;
  cursor: pointer;

  @include on-mobile {
    flex: 45px 0 0;
  }

  .icon.icon__pen-edit {
    display: none;
  }
}
.close-btn {
  position: unset;
  flex: 55px 0 0;

  display: inline-block;
  width: 25px;
  height: 25px;
  background: url(../../assets/images/icons/close_text.svg) center / 20px auto no-repeat !important;
  cursor: pointer;

  @include on-mobile {
    flex: 45px 0 0;
  }

  .icon.icon__pen-edit {
    display: none;
  }
}
</style>
