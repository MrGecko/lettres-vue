<template>
  <div v-if="current_user.isAdmin">
    <page-title :title="`Créer une nouvelle ${collectionType}`" />
    <section>
      <b-field
        :label="`Renseigner le titre de la ${collectionType}`"
        :type="error.field === 'title' ? 'is-danger' : null"
        :message="error.field === 'title' ? error.title : null"
      >
        <input
          v-model="title"
          class="input"
          :multiline="false"
          :placeholder="`Titre de la ${collectionType}`"
          @focus="$event.target.select()"
        >
      </b-field>
      <b-field :label="`Renseigner la description de la ${collectionType}`">
        <rich-text-editor
          v-model="description"
          :multiline="true"
          :formats="[['italic', 'superscript']]"
          :options="{ placeholder: `Description de la ${collectionType}` }"
        />
      </b-field>
      <b-field
        label="Curator"
        :type="!curatorId ? 'is-danger' : error.field === 'curator' ? 'is-danger' : null"
        :message="!curatorId ? 'Curator obligatoire' : error.field === 'curator' ? error.title : null"
      >
        <b-select
          v-model="curatorId"
        >
          <option
            v-for="option in users.filter((u) => u.isAdmin === true)"
            :key="option.id"
            :value="option.id"
          >
            {{ option.username }}
          </option>
        </b-select>
      </b-field>
      <create-button
        :label="`Créer la ${collectionType}`"
        class="create-button"
        :loading="loading"
        :disabled="Object.keys(error).length > 0 || !curatorId"
        @click="createNewCollection"
      />
      <p
        v-if="error.field === 'GLOBAL'"
        class="global-error"
      >
        {{ error.title }}
      </p>
    </section>
  </div>
  <div v-else>
    <section>
      Page réservée aux administrateurs du site.
    </section>
  </div>
</template>
<script>
import RichTextEditor from "@/components/forms/fields/RichTextEditor.vue";
import { mapState, mapActions } from "vuex";
import PageTitle from "@/components/ui/PageTitle";
import CreateButton from "@/components/ui/CreateButton.vue"

export default {
  name: "CollectionCreationPage",
  components: {
    RichTextEditor,
    PageTitle,
    CreateButton,
  },
  props: ["collectionId"],
  data() {
    return {
      title: this.collectionId ? "Titre de la sous-collection" : "Titre de la collection",
      description: this.collectionId ? "Description de la sous-collection" : "Description de la collection",
      loading: false,
      curatorId: null,
      error: {},
      collectionType: this.collectionId ? "sous-collection" : "collection"
    }
  },
  computed: {
    ...mapState("user", ["current_user", "users"]),
  },
  watch: {
    title() {
      if (this.title.length < 1) {
        this.error = {"title": "Titre obligatoire", "field": "title"};
      } else if (this.error.field === "title") {
        this.error = {};
      }
    },
    curatorId() {
      if (this.curatorId === null) {
        this.error = {"title": "Curator obligatoire", "field": "curator"};
      } else if (this.error.field === "curator") {
        this.error = {};
      }
    }
  },
  created() {
    this.fetchUsers()
  },
  methods: {
    ...mapActions("user", ["fetchUsers"]),
    async createNewCollection() {
      this.loading = true;
      if (this.title.length < 1) {
        this.error = {"title": "Titre obligatoire", "field": "title"};
        this.loading = false;
        return;
      }
      if (this.curatorId === null) {
        this.error = {"title": "Curator obligatoire", field: "curator"};
        this.loading = false;
        return;
      }
      const collection = {
        title: this.title,
        description: this.description,
        parentId: this.collectionId,
        curatorId: this.curatorId
      };
      console.log("submitting", collection);
      const newCollection = await this.$store.dispatch("collections/addCollection", collection);
      if (newCollection.error) {
        if (newCollection.error.response.data) {
          this.error = {"title": newCollection.error.response.data["errors"]["title"], field: "GLOBAL"};
        }
        else {
          this.error = {"title": newCollection.error, field: "GLOBAL"};
        }
        this.loading = false;
        return;
      }
      console.log("created collection", newCollection)
      this.loading = false;
      this.$router.push({ name: "collection", params: {collectionId: newCollection.id}});
    }
  }
};
</script>
<style scoped lang="scss">
@import "@/assets/sass/main.scss";
.input {
  font-family: Helvetica, Arial, sans-serif;
  color: #4a4a4a;
}
::v-deep .label {
  padding-bottom: 10px;
}

.create-button {
  margin-top: 30px;
}

::v-deep .input {
  &:hover,
  &:focus {
    border-color: rgb(219, 219, 219) !important;
    box-shadow: none !important;
  }
}

.control, .search_input {
  ::v-deep select {
    &:hover,
    &:focus {
      border-color: rgb(219, 219, 219) !important;
      box-shadow: none !important;
    }
  }
  ::v-deep .select::after {
      border-color: rgba(127, 0, 56) !important;
  }
}

.global-error {
  padding-top: 10px;
  color: #f14668;
}

</style>
