<template>
  <div>
    <page-title :title="'Mon historique'" />
    <changelog />
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Changelog from "@/components/sections/Changelog";
import PageTitle from "@/components/ui/PageTitle";

export default {
  name: "HistoryPage",
  components: {
    Changelog,
    PageTitle,
  },
  data() {
    return {
      data: [],
      sortingPriority: [{ field: "event-date", order: "desc" }],
      numPage: 1,
      pageSize: 30,
      p: 1,
    };
  },
  computed: {
    ...mapState("user", ["current_user"]),
    ...mapState("changelog", ["fullChangelog", "isLoading", "totalCount"]),
  },
  created() {
    this.loadAsyncData();
  },
  methods: {
    ...mapActions("changelog", ["fetchFullChangelog"]),
    loadAsyncData() {
      if (this.current_user.isAdmin) {
        // user is admin, can only full history (HistoryPage)
        this.fetchFullChangelog({
          numPage: this.numPage,
          pageSize: this.pageSize,
          sortingPriority: this.sortingPriority,
          filters: "",
        });
      } else {
        // user not admin, can only access his own history (HistoryPage)
        let filters = "";
        if (this.current_user) {
          filters = `filter[user_id]="${this.current_user.id}"`;
        }
        this.fetchFullChangelog({
          numPage: this.numPage,
          pageSize: this.pageSize,
          sortingPriority: this.sortingPriority,
          filters: filters,
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";
@import "@/assets/sass/components/_search_results_table.scss";
@import "@/assets/sass/components/_search_results_pagination.scss";
</style>
