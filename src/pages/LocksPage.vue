<template>
  <div>
    <page-title :title="'Mes verrous'" />
    <div class="results-count-and-pagination">
      <div class="popup-list-header is-flex is-justify-content-space-between is-align-items-center">
        <div class="results-count">
          <span class="total-count">{{ totalCount }}</span> résultat{{ totalCount > 1 ? "s" : "" }}
        </div>
        <div>
          <div
            v-if="totalPages"
            class="pagination-controls"
          >
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
    <div class="result-container">
      <b-table
        ref="multiSortTable"
        class="locks-table"
        :data="data"

        :loading="isLoading"
        backend-pagination
        :total="totalCount"
        :per-page="pageSize"
        :current-page.sync="currentPage"


        aria-next-label="Page suivante"
        aria-previous-label="Page précédente"
        aria-page-label="Page"
        aria-current-label="Page courante"

        :opened-detailed="detailedRows"
        detailed
        :backend-sorting="true"
        :sort-multiple="true"
        :sort-multiple-data="sortingPriority"
        detail-key="id"
        show-detail-icon

        :row-class="rowClass"
        :narrowed="true"
        :mobile-cards="false"

        :debounce-search="1000"

        checkable
        checkbox-position="right"
        :checked-rows.sync="checkedRows"
        :custom-is-checked="(a, b) => { return a.id === b.id }"

        backend-filtering
        @sort="sortPressed"
        @filters-change="onFilter"
      >
        <template #bottom-left>
          <b>Total checked</b>: {{ checkedRows.length }}
        </template>
        <template #empty>
          <section class="section">
            <div class="content has-text-grey has-text-centered">
              <p>Vous n'avez aucun verrouillage pour le moment.</p>
            </div>
          </section>
        </template>
        <template #detail="props">
          <document-list-details
            :transcription-hightlight="props.row.transcriptionHightlight"
            :argument="props.row.argument"
            :witnesses="props.row.witnesses"
            :document-id="props.row.id"
          />
          <!--<document
            class="document-page"
            :doc-id="props.row['object-id']"
            :preview="true"
          />-->
        </template>
        <b-table-column
          field="id"
          label="Lettre"
          sortable
          numeric
          searchable
        >
          <!--<template #searchable>
            <b-taginput
              v-model="tags"
              :data="filteredTags"
              autocomplete
              icon="fas fa-search"
              clearable
              ellipsis
              @typing="updateFilteredTags"
              @icon-right-click="tags = ''"
            >
              <template #selected="props">
                {{ props.tags }}
              </template>
            </b-taginput>
         </template>-->

          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <document-tag-bar
              :key="props.row.id"
              :doc-id="props.row.id"
              :with-status="true"
              :preview="true"
            />
          </template>
        </b-table-column>
        <b-table-column
          field="collections"
          label="Collection(s)"
          sortable
          searchable
        >
          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <span
              v-for="collection in props.row.collections"
              :key="collection.id"
              class="is-block"
              v-html="collection.title"
            />
          </template>
        </b-table-column>
        <b-table-column
          field="username"
          label="User name"
          :sortable="current_user.isAdmin"
          :searchable="current_user.isAdmin"
        >
          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <span v-html="props.row.username" />
          </template>
        </b-table-column>
        <b-table-column
          field="description"
          label="Description"
          sortable
          searchable
        >
          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <span v-html="props.row.description" />
          </template>
        </b-table-column>
        <b-table-column
          field="event_date"
          label="Date"
          sortable
          searchable
        >
          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <span
              class="tag"
              v-html="new Date(props.row.event_date).toLocaleDateString()"
            />
          </template>
        </b-table-column>
        <b-table-column
          field="expiration_date"
          label="Expire"
          sortable
          searchable
        >
          <template #header="{ column }">
            <div v-if="column.sortable">
              <div v-if="sortingPriority.filter(obj => obj.field === column.field).length === 0">
                <span class="icon button arrows-alt-v" />
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'asc'">
                <span class="icon button arrow-up" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <div v-else-if="sortingPriority.filter(obj => obj.field === column.field)[0].order === 'desc'">
                <span class="icon button arrow-down" />
                <span class="icon button sort-index">
                  {{ sortingPriority.findIndex(obj => obj.field === column.field) + 1 }}
                </span>
              </div>
              <span>
                {{ column.label }}
              </span>
            </div>
            <div v-else>
              {{ column.label }}
            </div>
          </template>
          <template #default="props">
            <span
              v-if="props.row.is_active"
              class="tag is-success"
              v-html="new Date(props.row.expiration_date).toLocaleDateString()"
            />
            <span
              v-else
              class="tag is-warning"
              v-html="new Date(props.row.expiration_date).toLocaleDateString()"
            />
          </template>
        </b-table-column>
      </b-table>
      <lock-form
        v-if="withStatus && lockEditMode && status"
        :doc-id="checkedRows[0].docId"
        :current-lock="status.currentLock"
        :cancel="stopLockEditor"
        :submit="stopLockEditor"
      />
    </div>
    <div class="results-count-and-pagination is-flex is-justify-content-flex-end is-align-items-center mt-5">
      <div class="is-inline-block">
        <div
          v-if="totalPages"
          class="pagination-controls"
        >
          <a
            :disabled="currentPage <= 1"
            :class="currentPage <= 1 ? 'button first-page disabled' : 'button first-page'"
            @click="currentPage <= 1 ? null : currentPage = 1"
          >
          </a>
          <a
            :disabled="currentPage <= 1"
            :class="currentPage <= 1 ? 'button previous-page disabled' : 'button previous-page'"
            @click="currentPage <= 1 ? null : --currentPage"
          >
          </a>
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
          >
          </a>
          <a
            :disabled="currentPage >= totalPages"
            :class="currentPage < totalPages ? 'button last-page' : 'button last-page disabled'"
            @click="currentPage < totalPages ? currentPage = totalPages : null"
          >
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { mapState, mapActions, mapGetters } from "vuex";
import DocumentTagBar from "@/components/document/DocumentTagBar";
import LockForm from "@/components/forms/LockForm";
import Document from "@/components/sections/Document.vue";
import DocumentListDetails from "@/components/sections/DocumentListDetails.vue";
import PageTitle from "@/components/ui/PageTitle";

export default {
  name: "LocksPage",
  components: {
    DocumentListDetails,

    DocumentTagBar,
    LockForm,
    PageTitle,
  },//Document,
  data() {
    return {
      lockEditMode: false,
      withStatus: false,
      status: null,
      fetchedData: [],
      data: [],
      detailedRows: [],
      filteredTags: [],
      documentsCollections: [],
      checkedRows:[],
      sortingPriority: [{ field: "expiration_date", order: "desc" }],
      filters: [],
      numPage: 1,
      p: 1,
      pageSize: 3,
      totalCount: 0,
      isLoading: false,
    };
  },

  computed: {
    ...mapState("user", ["current_user", "jwt"]),
    ...mapState("locks", ["fullLocks", "currentLock"]),
    ...mapGetters("document", ["getDocumentStatus"]),

    totalPages: function() {
      return Math.ceil(this.totalCount / this.pageSize)
    },
    currentPage: {
      get: function () {
        return this.numPage;
      },
      set: async function (newValue, oldValue) {
        newValue = parseInt(newValue);
        if (newValue && newValue !== oldValue && newValue >=1 && newValue <= this.totalPages) {
          this.p = newValue;
          this.numPage = newValue;
          await this.loadAsyncData();
        }
      },
    },
    tags: {
      get: function () {
          return [this.data.map(item => item.id)][0];
      },
      set: function (value) {
        console.log("tags :", [this.data.filter(item => item.id.toString().includes(value)).map(item => item.id)])
       return value;
      }
    }
  },
  watch: {
    checkedRows: async function() {
      console.log("checked rows watch : ", this.checkedRows)
      /*TODO allow multiple locks processing */
      if (this.checkedRows.length === 1 && this.checkedRows[0].docId) {
        await this.fetchStatus(this.checkedRows[0].docId);
        this.lockEditMode = true;
        this.withStatus = true;
      }
    },
    currentLock: async function (newVal, oldVal) {
      console.log("currentLock updated ? :", oldVal, newVal)
      if (!oldVal || !newVal || oldVal.attributes.expiration_date ==! newVal.attributes.expiration_date ) {
        await this.fetchData();
        this.loadAsyncData()
      }
    }
    /*fetchData() {
      this.loadAsyncData();
    }*/
  },
  async created() {
    // set type search default in order to display witnesses in DocumentListDetails
    this.setSearchType('isParatextSearch');
    if (this.current_user) {
      if (this.current_user.isAdmin) {
        await this.fetchUsers();
      }
      await this.fetchData();
    }
    if (this.fetchedData) {
          this.totalCount = this.fetchedData.locksWithCollections.length
    }
    this.loadAsyncData();
  },
  methods: {
    ...mapActions("locks", ["fetchFullLocks"]),
    ...mapActions("user", ["fetchUsers"]),
    ...mapActions("search", ["setSearchType"]),

    rowClass(row) {
      let classNames = []
      if (!this.showDetailIcon(row.id)) {
        classNames.push('hide-arrow-icon-detail')
      }
      if (this.detailedRows.includes(row.id)) {
        classNames.push("details-opened")
      }
      return classNames.join(" ")
    },
    showDetailIcon(rowDocId) {
      let showIcon = false
      if (!this.loadingTable) {
        if (this.fullLocks && this.fullLocks.length <= 1 ) {
          if (this.fullLocks[0].witnesses.length > 0 ) {
            showIcon = true
          }
          return showIcon
        } else {
          if (this.fullLocks && this.fullLocks.filter(l => l.id === rowDocId)[0].witnesses.length > 0 ) {
            showIcon = true
          }
          return showIcon
        }
      }
    },
    updateFilteredTags(text) {
      this.filteredTags = [this.data.filter(item => item.id.toString().includes(text)).map(item => item.id)][0]
      console.log("this.filteredTags :", this.filteredTags)
    },
    async fetchStatus(docId) {
      this.status = await this.getDocumentStatus(docId);
      console.log("status", docId, this.status);
    },
    async fetchData() {
      this.isLoading = true;
      let filters_list = [];
      let filtered_users = [];
      if (this.filters) {
        for (let i = 0; i < Object.keys(this.filters).length; i++) {
          // If username filter, get user_ids
          if (Object.keys(this.filters)[i] === 'username') {
            if (this.current_user.isAdmin) {
              filtered_users = this.$store.state.user.users.map(u => u.username.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(Object.values(this.filters)[i].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")) ? u.id : false).filter(Boolean);
              console.log('filtered_users for admins: ', filtered_users)
              if (filtered_users.length > 0) {
                  // assign array of users as list (backend expects list)
                  filters_list.push({'user_id': filtered_users});
              } else {
                  this.fetchedData = [];
                  this.data = [];
                  this.isLoading = false;
                  return;
              }
            }
          }
          else {
            let filters_payload = {};
            filters_payload[Object.keys(this.filters)[i]] = Object.values(this.filters)[i]
            filters_list.push(filters_payload);
          }
        }
      }
      if (!this.current_user.isAdmin){
        console.log("For non-admin users, only fetch their own locks");
        filtered_users = [this.current_user.id]
        if (filtered_users.length > 0){
          filters_list.push({'user_id': filtered_users});
        } else {
          this.data = [];
          this.isLoading = false;
          return;
        }
      }
      console.log('filters_list : ', filters_list)

      this.fetchedData = await this.fetchFullLocks({
        userId: this.current_user.id,
        sortingPriority: this.sortingPriority,
        numPage: this.numPage,
        pageSize: this.pageSize,
        filters: filters_list.length ? filters_list : null,
      });
      console.log('async fetchData() / this.fetchedData : ', this.fetchedData);
      return this.fetchedData;
    },
    /*TODO add lock sort reset button
    async resetPriority() {
      console.log("reset");
      this.$refs.multiSortTable.resetMultiSorting();
      // reset local backend sorting
      if (this.backendSortingEnabled) {
        this.sortingPriority = [];
        await this.fetchData();
      }
    },*/
    async onFilter(filters){
      console.log("filters : ", filters);
      if (filters) {
        this.filters = Object.entries(filters).reduce((a,[k,v]) => (v ? (a[k]=v, a) : a), {});
        console.log('onFilter / this.filters ', this.filters)
        await this.fetchData();
        this.loadAsyncData();
      }
    },
    // Backend sorting
    async sortingPriorityRemoved(field) {
      console.log('sortingPriorityRemoved', field);
      const newPriority = this.sortingPriority.filter(
        (priority) => priority.field !== field
      );
      this.sortingPriority = [...newPriority];
      if (this.sortingPriority.length > 0) {
          console.log(newPriority, this.sortingPriority);
      } else {
          // default sorting on descending locks expiration date
          this.sortingPriority = [{ field: "expiration_date", order: "desc" }];
          console.log("Default sorting new Priority", newPriority, this.sortingPriority);
      }
      await this.fetchData();
      this.loadAsyncData();
    },

    async sortPressed(field, order, event) {
      console.log('field, order, event', field, order, event);
      if ((this.customKey && event[this.customKey]) || !this.customKey) {
        //console.log('condition', (this.customKey && event[this.customKey]) || !this.customKey);
        let existingPriority = this.sortingPriority.filter((i) => i.field === field)[0];
        // UPDATE SORTING
        //console.log("existingPriority", existingPriority);
        if (existingPriority) {
          if (existingPriority.order === "desc") {
            // SORTING WAS 'desc' UPDATED TO 'asc'
            existingPriority.order = "asc";
          } else if (existingPriority.order === "asc") {
            // SORTING WAS 'asc' UPDATED TO unset
            this.sortingPriorityRemoved(field);
          } else {
            existingPriority.order = "desc"; // unused scenario
          }
          //existingPriority.order = existingPriority.order === "desc" ? "asc" : "desc";
          //this.sortingPriority[this.sortingPriority.findIndex(sp => sp.field === existingPriority.field)] = existingPriority;
          //this.sortingPriority.push({ field, order });
          console.log('sortingPriority', this.sortingPriority);
        } else {
          // NO SORTING : request sorted data (note History is sorted from backend & JS : combined data)
          // default sorting here, need to be equivalent to default sortingPriority :
          // here default is 'desc', hence a new priority needs to be 'desc' so that clicks follows desc -> asc -> unset -> etc
          this.sortingPriority.push({ field, order: "desc"});
          console.log("this.sortingPriority", this.sortingPriority)
        }
        await this.fetchData();
        this.loadAsyncData();
        this.currentPage = 1;
      } else {
        // request regular sorted data from backend
        console.log('no change order', field, order );
        this.sortingPriority = []; // [{field, order}]
        this.currentPage = 1;
      }
      // will reload the data (Note 24022023 : not true)
      //this.currentPage = 1;
    },
    /* function used to regroup locks by docId in the version with multiple historical locks by doc
    (see also loadAsyncData below)

    groupLocksByDoc(arr){

      const mapper = new Map()
      for (const { data, user} of arr) {
        if (!mapper.has(data.attributes['object-id'])) {
          mapper.set(data, { docId: data.attributes['object-id'], lock: [], user})
        }
        mapper.get(data).lock.push(data.attributes)
       }
       return Array.from(mapper.values())
    },*/
    loadAsyncData() {
      //if (this.fetchedData && this.documentsCollections) {
        console.log('loadAsyncData() / this.fetchedData : ', this.fetchedData)
        this.totalCount = this.fetchedData.totalCount;

        /* code used to regroup locks by docId in the version with multiple historical locks by doc

        let LocksByDocID = this.groupLocksByDoc(this.fetchedData.locks);
        console.log('LocksByDocID : ', LocksByDocID)

        this.data = LocksByDocID.map(({docId, lock, user}) => {
          const flatLockByDoc = {};

          flatLockByDoc['docId'] = parseInt(docId),
          flatLockByDoc['description'] = lock[0]['description'],
          flatLockByDoc['event_date'] = lock[0]['event-date'],
          flatLockByDoc['expiration_date'] = lock[0]['expiration-date'],
          flatLockByDoc['is_active'] = lock[0]['is-active'],
          flatLockByDoc['user_id'] = user.id,
          flatLockByDoc['username'] = user.username

          return flatLockByDoc;
          })*/

        this.data = this.fetchedData.locksWithCollections
          // local pagination
          .slice(
            (this.numPage - 1) * this.pageSize,
            this.numPage * this.pageSize,
          )
        this.detailedRows = [];
        //console.log('this.rootCollections : ', this.getCollectionAdmin());
        console.log('loadAsyncData() / this.data : ', this.data);
        this.isLoading = false;
      //}
    },
    /*getCollectionAdmin(){
      return Object.values(this.$store.state.collections.collectionsById).filter((c) => c.admin.username === this.current_user.username)

    },*/
    startLockEditor() {
      this.lockEditMode = true;
        return Promise.resolve(this.status.currentLock['is-active']);
    },
    async stopLockEditor() {
      this.lockEditMode = false;
      await this.fetchData();
      this.loadAsyncData();
    },
  },
}
</script>

<style scoped lang="scss">

  @import "@/assets/sass/main.scss";
  @import "@/assets/sass/components/_search_results_table.scss";
  @import "@/assets/sass/components/_search_results_pagination.scss";

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
    & > input {
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
  .results-count-and-pagination {
    @include on-mobile {
      flex-direction: column;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      margin-bottom: 20px;
    }
  }
  .popup-list-header {
    border-top: solid 1px #FDB3CC;
    border-bottom: solid 1px #C7C7C7;
    margin-bottom: 25px;

    @include on-mobile {
      flex-direction: column;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      gap: 10px;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .results-count {
      display: flex;
      align-items: center;
      gap: 10px;

      font-family: $family-primary;
      font-size: 14px;
      color: #6D7278;
      font-weight: 600;
      text-transform: uppercase;

      .total-count {
        font-size: 50px;
        color: #FF0052;
        text-align: center;
        font-weight: 700;

        @include on-mobile {
          font-size: 30px;
        }
      }
    }
  }
  .table_title {
    margin-bottom: 25px;
    font-family: $family-primary;
    font-size: 20px;
    font-weight: 500;
    color: #C00055;
  }

  // Smaller tags :
  ::v-deep {
    .tags.document-tag-bar {
      margin-right: 10px !important;

      @include on-tablet {
        margin-right: 0 !important;

        & > span.badge.tag {
          margin-left: 15px !important;
        }
      }

      @include on-small-tablet {
        .tag.document-status-card__doc-tag {
          position: unset !important;
          text-align: center !important;
        }

        & > span.badge.tag {
          margin-left: 0 !important;
        }
      }

      .publish-tag a {
        min-width: 30px !important;
        background-size: 15px auto !important;
      }

      .bookmark-tag a,
      .lock-tag a {
        min-width: 30px !important;
        background-size: 12px auto !important;
      }
    }
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  ::v-deep {
    input[type=number] {
      -moz-appearance: textfield;
    }
  }

  ::v-deep .b-table tr {
      &:not(.hide-arrow-icon-detail) {
        td.chevron-cell a {
          width: 15px;
          height: 15px;
          span.icon {
            &:after {
              display: none !important;
            }
             &:not(.is-expanded) {
               background: url(../assets/images/icons/open_text.svg) center / 15px auto no-repeat;
             }
             &.is-expanded {
               background: url(../assets/images/icons/close_text.svg) center / 10px auto no-repeat;
             }
          }
        }
        &.hide-arrow-icon-detail {
          width: 15px;
          height: 15px;
          span.icon:after {
            display: none !important;
          }
        }
      }
  }
  ::v-deep .b-table .hide-arrow-icon-detail td.chevron-cell a {
    pointer-events: none;
    span.icon:after {
      display: none !important;
    }
  }
</style>
