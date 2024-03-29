<template>
  <div>
    <page-title :title="'Créer un nouveau document'" />
    <section>
      <b-field
        :label="'Renseigner le titre du document'"
        :type="invalidTitle ? 'is-danger' : null"
        :message="invalidTitle ? 'Titre obligatoire' : null"
      >
        <rich-text-editor
          v-model="title"
          :multiline="false"
          :formats="[['italic', 'superscript']]"
          :options="{ placeholder: 'Ex. Français 3512, Ms. 564, K 35' }"
        />
      </b-field>
      <create-button
        label="Créer le document"
        :loading="loading"
        :disabled="invalidTitle"
        @click="submit"
      />
    </section>
  </div>
</template>

<script>
import RichTextEditor from "@/components/forms/fields/RichTextEditor.vue";
import { mapState, mapActions } from "vuex";
import PageTitle from "@/components/ui/PageTitle";
import CreateButton from "@/components/ui/CreateButton.vue"

export default {
  name: "DocumentCreationPage",
  components: {
    RichTextEditor,
    PageTitle,
    CreateButton,
  },
  data() {
    return {
      title: "Ceci est le titre du nouveau document",
      loading: false,
      defaultTitle: `${process.env.VUE_APP_UNSORTED_DOCUMENTS_COLLECTION_TITLE}`,
      invalidTitle: false,
    };
  },
  computed: {
    ...mapState("document", ["document", "documentLoading"]),
    ...mapState("collections", ["collectionsById"])
  },
  watch: {
    title() {
      this.invalidTitle = this.title === ""
    }
  },
  methods: {
    ...mapActions("collections", ["fetchAll"]),
    submit() {
      this.invalidTitle = this.title === ""
      if (!this.invalidTitle) {
        this.createNewDocument()
      }
    },
    async createNewDocument() {
      this.loading = true;
      const defaultData = {
        attributes: {
          title: this.title,
        },
        relationships: {
          collections: {
            data: [
              {
                type: "collection",
                //from envir variables id: Object.values(this.collectionsById).filter((col) => col.title === process.env.VUE_APP_UNSORTED_DOCUMENTS_COLLECTION_TITLE)[0].id,
                id: Object.values(this.collectionsById).filter((col) => col.title === "Hors collections")[0].id,
              },
            ],
          },
        },
      };
      await this.$store.dispatch("document/initializeDummyDocument", defaultData);
      console.log("submitting", this.document);
      const doc = await this.$store.dispatch("document/add");
      console.log("document added !", doc);
      this.$router.push({ name: "document", params: { docId: doc.id } });
      this.loading = false;
    },
    created(){
      this.fetchAll();
    }
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";

::v-deep .label {
  padding-bottom: 10px;
}

</style>
