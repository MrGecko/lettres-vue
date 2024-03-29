<template>
  <div class="narrow-container">
    <div class="m-5">
      <!--<p class="has-text-justified mb-2">
        Les collections constituent des ensembles de taille variable constitués autour de logiques décidées par leurs responsables scientifiques. La plus répandue est celle qui consiste à éditer la correspondance active d’un individu. D’autres choix sont également recevables, comme les lettres reçues par un individu (correspondance passive) ou les lettres écrites par des groupes de personnes ayant entre elles un lien familial ou professionnel.
      </p>
      <p class="has-text-justified mb-2">
        Dans l’attente d’une présentation selon des regroupements thématiques, il est actuellement possible d’effectuer une recherche sur cette page selon une liste où les correspondances sont classées par ordre alphabétique du nom de l’individu expéditeur ou destinataire.
      </p>-->
    </div>

    <div v-if="!isLoading">
      <div class="collection-list-header is-flex is-justify-content-space-between is-align-items-center">
        <div class="search-container">
          <b-field>
            <b-input
              v-model="searchTerm"
              placeholder="Rechercher une collection"
              type="search"
              icon-right="close-circle"
              icon-right-clickable
              @icon-right-click="searchTerm=''"
            />
          </b-field>
        </div>
        <span
          v-if="current_user && current_user.isAdmin"
          class="column"
        >
          <router-link
            v-slot="{ navigate }"
            to="/collections/create"
            custom
          >
            <create-button
              label="Créer une collection"
              @click="navigate"
            />
          </router-link>
        </span>
        <div class="is-inline-block">
          <div
            v-if="totalPages && !searchTerm"
            class="has-text-centered"
          >
            <div class="pagination-controls">
              <a
                :disabled="currentPage <= 1"
                :class="currentPage <= 1 ? 'button first-page disabled' : 'button first-page'"
                @click="currentPage <= 1 ? null : currentPage = 1"
              />
              <a
                :disabled="currentPage <= 1"
                :class="currentPage <= 1 ? 'button previous-page disabled' : 'button previous-page'"
                @click="currentPage <= 1 ? null : --currentPage"
              />
              <input
                v-model="currentPage"
                name="page"
                type="number"
                min="1"
                :max="totalPages"
                placeholder="Page..."
                class="current-page"
                @change.prevent="currentPage = parseInt(p)"
              >
              <span class="label-sur-page">sur</span>
              <span class="total-pages">{{ totalPages }}</span>
              <a
                :disabled="currentPage >= totalPages"
                :class="currentPage < totalPages ? 'button next-page' : 'button next-page disabled'"
                @click="currentPage < totalPages ? ++currentPage : null"
              />
              <a
                :disabled="currentPage >= totalPages"
                :class="currentPage < totalPages ? 'button last-page' : 'button last-page disabled'"
                @click="currentPage < totalPages ? currentPage = totalPages : null"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- if admin show default collection of unclassified documents -->
      <div v-if="current_user && current_user.isAdmin">
        <div v-if="searchTerm === ''">
          <!-- Collection cards -->
          <collection-list-item
            v-for="rootCollection of paginated"
            :key="rootCollection.id"
            :collection-id="rootCollection.id"
            class="collection-list-item"
          />
        </div>
        <div v-else>
          <collection-search-result
            v-for="collection of searchResults"
            :key="collection.id"
            :collection-id="collection.id"
            :search-term="searchTerm"
            class="collection-list-item"
          />
        </div>
      </div>
      <!-- if not admin (contributor or visitor, do not show default collection of unclassified documents -->
      <div v-else>
        <div v-if="searchTerm === ''">
          <!-- Collection cards -->
          <collection-list-item
            v-for="rootCollection of paginated"
            :key="rootCollection.id"
            :collection-id="rootCollection.id"
            class="collection-list-item"
          />
        </div>
        <div v-else>
          <collection-search-result
            v-for="collection of activesearchResults"
            :key="collection.id"
            :collection-id="collection.id"
            :search-term="searchTerm"
            class="collection-list-item"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>

import { mapActions, mapGetters, mapState} from "vuex";
import CollectionListItem from "@/components/CollectionListItem.vue"
import CollectionSearchResult from "@/components/CollectionSearchResult.vue"
import CreateButton from "@/components/ui/CreateButton.vue"

export default {
  name: "CollectionsPage",
  components: {
    CollectionListItem,
    CollectionSearchResult,
    CreateButton,
  },
  data() {
    return {
      searchTerm: "",
      numPage: 1,
      p: 1,
      pageSize: 10,
      totalPages: 0,
    }
  },

  computed: {
    ...mapState("user", ["current_user"]),
    ...mapState("collections", ["isLoading"]),
    ...mapGetters("collections", ["rootCollections"]),
    indexStart() {
      console.log("indexStart", (this.currentPage-1) * this.pageSize)
      return (this.currentPage-1) * this.pageSize;
    },
    indexEnd() {
      console.log("indexEnd", this.indexStart + this.pageSize);
      return this.indexStart + this.pageSize;
    },
    paginated() {
      if (this.current_user) {
        console.log("this.activeRootCollections.slice(this.indexStart, this.indexEnd)", this.activeRootCollections.slice(this.indexStart, this.indexEnd));
        return this.activeRootCollections.slice(this.indexStart, this.indexEnd);
      } else {
        return this.activeRootCollections.filter((item) => item.publishedCount > 0).slice(this.indexStart, this.indexEnd);
      }

    },
    currentPage: {
      get: function () {
        console.log("currentPage / this.numPage", this.numPage)
        return this.numPage;
      },
      set: async function (newValue, oldValue) {
        newValue = parseInt(newValue);
        if (newValue && newValue !== oldValue && newValue >=1 && newValue <= this.totalPages ) {
          this.numPage = newValue;
        }
      },
    },

    searchResults() {
      return this.$store.getters['collections/search'](this.searchTerm)
    },
    activeRootCollections(){
      if (this.current_user && this.current_user.isAdmin) {
          return this.rootCollections
      } else if (this.current_user && !this.current_user.isAdmin) {
        return this.rootCollections.filter(function(coll){
            if (coll.title !== "Hors collections") {
              return coll
            }
          })
      } else {
        return this.rootCollections.filter((coll) => coll.title !== "Hors collections" && coll.publishedCount > 0);
      }
    },
    activesearchResults(){
      if (this.current_user) {
        return this.searchResults.filter((coll) => coll.title !== "Hors collections");
      } else {
        return this.searchResults.filter((coll) => coll.title !== "Hors collections" && coll.publishedCount > 0);
      }
    }
  },
  async created() {
    if (this.current_user) {
      await this.fetchCollections();
      let amountRootCollections = this.$store.state.collections.rootCollectionsIds.length-1;
      this.totalPages = amountRootCollections === 0 ? 1 : parseInt(Math.ceil(amountRootCollections / this.pageSize));
      console.log("this.totalPages : ", this.totalPages);
    } else {
      await this.fetchCollections();
      let amountRootCollections = this.rootCollections.filter((coll) => coll.publishedCount > 0).length-1;
      this.totalPages = amountRootCollections === 0 ? 1 : parseInt(Math.ceil(amountRootCollections / this.pageSize));
      console.log("this.totalPages : ", this.totalPages);
    }
    console.log("clear state on collection navigation")
    await this.resetSearchState();
    this.$store.state.layout.showLeftSideBar = false;
  },
  methods: {
    ...mapActions("search", ["resetSearchState"]),
    ...mapActions("collections", { fetchCollections: "fetchAll" }),
  },
};
</script>

<style lang="scss">
@import "@/assets/sass/main.scss";
@import "@/assets/sass/objects/collection.scss";

.collection-list-header {
  margin-bottom: 15px;
  gap: 20px;

  @include on-mobile {
    flex-direction: column;
    align-items: flex-end !important;

    .search-container {
      width: 100%;
    }

    .column {
      padding: 5px 0;
    }
  }
}

.collection-list-item {
  margin-bottom: 50px;
}

input[type=text],
input[type=search] {
  height: auto;
  padding: 4px 30px 5px 10px !important;
  background-color: #FFFFFF;
  border: solid 1px #C5C5C5;
  border-radius: 5px;
  box-shadow: none;
}

.control.has-icons-left .icon,
.control.has-icons-right .icon {
  width: 30px !important;
  height: 100% !important;
  padding: 0;
}


.pagination-controls {
  display: flex;
  align-items: center;
  /*visibility: hidden;*/

  & > * {
    display: inline-block;
    width: 38px;
    height: 38px;
    margin-right: 4px;
  }
  & > a {
    display: inline-block;
    width: 38px;
    height: 38px;
    background-color: #C3C3C3;
    border-radius: 3.2px;
  }
  & > a.disabled {
    cursor: not-allowed !important;
  }
  & > a.first-page {
    background: #C3C3C3 url(../assets/images/icons/page_debut.svg)  center / 28px auto no-repeat;
  }
  & > a.previous-page {
    background: #C3C3C3 url(../assets/images/icons/page_precedent.svg) center / 28px auto no-repeat;
  }
  & > a.next-page {
    background: #C3C3C3 url(../assets/images/icons/page_suivant.svg) center / 28px auto no-repeat;
  }
  & > a.last-page {
    background: #C3C3C3 url(../assets/images/icons/page_fin.svg) center / 28px auto no-repeat;
  }
  & > input.current-page {
    height: 38px !important;
    padding: 0 !important;
    border: 1px solid #C00055;
    border-radius: 3.2px;

    font-family: $family-primary;
    font-size: 18px;
    color: #CB2158;
    font-weight: 800;
    text-align: center;
    text-decoration: none;

    &:focus {
      outline: 1px solid #C00055;
    }
  }

  & > span.label-sur-page {
    font-family: $family-primary;
    font-size: 11px;
    line-height: 38px;
    color: #979797;
    font-weight: 500;
    text-align: center;
    text-transform: uppercase;
  }

  & > span.total-pages {
    background-color: #DFDFDF;
    border-radius: 3.2px;

    font-family: $family-primary;
    font-size: 18px;
    line-height: 38px;
    color: #818181;
    text-align: center;
    font-weight: 600;
    text-transform: uppercase;
  }
}
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
