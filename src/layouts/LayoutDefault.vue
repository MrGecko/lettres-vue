<template>
  <section class="main">
    <nav-bar />
    <section
      class="section"
      style="height: 100%"
    >
      <div
        v-if="$route.name === 'home'"
      >
        <div
          id="intro_home"
          class="bg-image content"
        >
          <div
            class="row"
          >
            <p class="homepage_title">
              ecco
            </p>
          </div>
          <div
            class="row"
          >
            <p class="homepage_subtitle">
              Édition collaborative
              <br/>
              des correspondances modernes
            </p>
          </div>
          <div
            class="row is-flex is-justify-content-center"
          >
            <b-button
              tag="router-link"
              to="/about"
              class="portail_button"
            >
              À propos du portail
            </b-button>
          </div>
        </div>
        <div class="row search_row is-align-items-center">
          <div class="col is-2">
            <span class="search_span">Chercher dans les</span>
          </div>
          <div class="column pt-3">
            <search-box />
          </div>
        </div>
      </div>
      <div
        v-else-if="$route.name === 'search' || $route.name === 'document' || $route.name === 'documentation'"
      >
        <div
          id="intro_search"
          class="bg-image content is-align-items-center"
        >
          <div
            v-if="$route.name === 'search' || $route.name === 'document'"
            class="row search_page_search_row"
          >
            <div class="col is-2 search_page_search_span">
              <span>Chercher dans les</span>
            </div>
            <div class="column">
              <search-box />
            </div>
          </div>
          <div
            v-else-if="$route.name === 'documentation'"
            class="row search_page_search_row"
          >
            <div class="column">
              <p class="documentation_title">
                Documentation de l'API
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        class="columns advanced-search_row"
        :class="columnsCssClass"
      >
        <div
          v-if="showLeftSideBar && $route.name === 'search'"
          class="column filters-column"
        >
          <div
            class="hide-left-bar"
            @click="hideLeftSideBar"
          />
          <advanced-search-form v-if="$route.name === 'search'" />
        </div>
        <div class="column main-column">
          <div class="main-column-content">
            <slot />
          </div>
        </div>
        <!--<div
          v-show="rightSideBarIsVisible"
          class="column is-5"
          style="background-color: #f6f6f6"
        >
          <mirador-viewer
            v-if="document && displayedManifestUrl"
            class="mirador-container"
            :manifest-url="displayedManifestUrl"
          />
        </div>-->
      </div>
    </section>
    <footer class="footer">
      <nav>
        <ul class="is-flex is-justify-content-space-between">
          <li>
            <a href="">
              <img
                class="enc-logo"
                src="@/assets/images/logos/logo-footer.png"
                alt=""
              >
            </a>
          </li>
          <li>
            <a href="">
              <img
                class="cths-logo"
                src="@/assets/images/logos/logo-cths-footer.png"
                alt=""
              >
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  </section>
</template>

<script>
import { mapState, mapActions } from "vuex";
import NavBar from "@/components/NavBar.vue";
import SearchBox from "@/components/SearchBox";
import AdvancedSearchForm from "@/components/AdvancedSearchForm.vue";
import background_image from "@/assets/images/about.jpg";
/*import SideBar from "@/components/SideBar.vue";*/

export default {
  name: "LayoutDefault",
  emit: ["refresh-viewer"],
  components: {
    NavBar,
    /*SideBar,*/
    SearchBox,
    AdvancedSearchForm,
  },
  data: function () {
    return {
      background_image: background_image,
      //featured_collectionIds : [73, 74, 75]
    }
  },
  computed: {
    ...mapState("user", ["current_user"]),
    ...mapState("layout", [
      "showLeftSideBar",
      "showRightSideBar",
      "displayedManifestUrl"
    ]),
    ...mapState("document", ["document", "witnesses"]),

    rightSideBarIsVisible() {
      return this.showRightSideBar;
    },
    columnsCssClass() {
      if (this.$route.name === 'search' && this.showLeftSideBar) {
        return 'with-side-bar';
      } else {
        if (this.$store.state.layout.viewerMode === "text-and-images-mode" && this.$route.name === 'document') {
          return 'large-screen';
        } else if (this.$route.name === 'documentation') {
          return 'large-screen';
        }
      }
      return "";
    }
  },
  watch: {
    displayedManifestUrl() {
      if (!this.displayedManifestUrl) {
        this.hideRightSideBar();
      } else {
        //this.$emit("refresh-viewer");
      }
    },
    "document.id"() {
      this.setDisplayedManifestUrl(null);
    },
    witnesses() {
      this.$emit("refresh-viewer");
    },
    showRightSideBar() {
      if (this.showRightSideBar) {
        this.$emit("refresh-viewer");
      }
    }
  },
  created() {},
  methods: {
    ...mapActions("layout", [
      "toggleLeftSideBar",
      "hideLeftSideBar",
      "toggleRightSideBar",
      "hideRightSideBar",
      "setDisplayedManifestUrl"
    ]),
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";

.columns {
  display: flex;
  height: 100%;
  min-height: 100vh;
}
.column {
  margin-top: 0;
  padding: 0;
  &.is-2,
  &.is-5 {
    padding-left: 0;
    padding-right: 0;
    background-color: $beige-lighter;
  }
}
.main {
  min-height: 100%;
}
.main-column {
  background-color: white;
  padding-bottom: 20px;
}
.main-column-content {
  width: $container-max-width;
  margin: 18px auto;
  background-color: white;
}
.main-column-content section .container {
  margin: 0 !important;
}

.mirador-container {
  position: fixed;
  top: 100px;
  right: 0;
  box-shadow: 0px 0px 5px 5px #00000040;
  z-index: 10;
}

::v-deep .narrow-container {
  margin-left: $container-narrow-margin;
  margin-right: $container-narrow-margin;

  @include on-small-desktop {
    margin-left: 10%;
    margin-right: 10%;
  }

  @include on-tablet {
    margin-left: 6%;
    margin-right: 6%;
  }

  @include on-mobile {
    margin-left: 2%;
    margin-right: 2%;
  }
}


.hide-button {
  width: 15px;
  min-height: 100vh;
  /*background-color: $beige-lighter;*/
  border: 1px solid;
  border-top: none;
  border-bottom: none;
  &:hover {
    background-color: lightgrey;
    cursor: pointer;
  }
  &.divider-left {
    padding-left: 25px;
    border-right-color: $nice-grey;
    border-left: none;
  }
  &.divider-right {
    padding-right: 25px;
    border-left-color: $nice-grey;
    border-right: none;
  }
}

.section {
  padding: 0;
  .columns {
    margin: 0;
  }
}
footer {
  background-color: $footer-background-color !important;
  border-top: solid 6px #7F0038;
  padding: 90px 0 !important;
  z-index: 100;

  @include on-mobile {
    padding: 40px 0 30px !important;
  }

  nav {
    width: $container-max-width;
    margin: 0 auto;

    @include on-small-desktop {
      width: 100%;
      padding: 0 $container-small-desktop-margin;
    }

    @include on-tablet {
      padding: 0 $container-tablet-margin;
    }

    @include on-mobile {
      padding: 0 $container-mobile-margin;
    }

    ul {

      @include on-mobile {
        flex-direction: column;
        align-items: center;
        gap: 30px;
      }

      .enc-logo {
        height: 70px;

        @include on-mobile {
          height: 50px;
        }
      }

      .cths-logo {
        height: 100px;

        @include on-mobile {
          height: 60px;
        }
      }
    }

  }
}
#intro_home {
  position: relative;
  background-image: url('../assets/images/about.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height:443px;
  width:auto;
  display:flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 0 !important;

  @include on-tablet {
    height:320px;
  }
}
#intro_home::before {
  content: "";
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  background-color: #00000066;
  z-index: 1;
}
#intro_home::after {
  content: "";
  position: absolute;
  left: 0;
  top:0;
  display: block;
  width: 100%;
  height: 70px;
  background-image: linear-gradient(#000000 0% ,#D8D8D800 100%);
  opacity: 0.50;
  z-index: 2;
}
#intro_home > * {
  position: relative;
  z-index: 2;
}

#intro_search {
  background-image: url('../assets/images/about.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height:266px;
  width:auto;
  display:flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 0 !important;

  @include on-mobile {
    height:150px;
  }
}
#card_image {
  max-height: 250px;
}
.homepage_title {
  font-family: $family-apptitle;
  font-weight: 200;
  font-size: 210px;
  line-height: 1.1;
  color: white;
  text-align: center;

  @include on-tablet {
    font-size: 100px;
  }

  @include on-mobile {
    font-size: 80px;
  }
}

.homepage_subtitle {
  max-width: 500px;
  margin: 0 auto;
  font-family: $family-apptitle;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  color: white;
  text-align: center;
  transform: translateY(-20px);

  @include on-tablet {
    font-size: 22px;
    transform: none;
  }

  @include on-mobile {
    font-size: 16px;
  }
}
.documentation_title {
  font-family: $family-apptitle;
  font-weight: 600;
  font-size: 40px;
  line-height: 1.1;
  color: white;
  text-align: center;

  @include on-tablet {
    font-size: 30px;
  }

  @include on-mobile {
    font-size: 20px;
  }
}

.metadata {
  font-size: xx-large;
  font-weight: bolder;
  text-shadow: 0px 2px, 2px 0px, 2px 2px;
  color: rgb(255, 0, 83);
  text-align: center;
}
.card {
  height: 100%;
  overflow: hidden;
  background-color: #F0F0F0;
  border-radius: 10px;
  box-shadow: none;
}
.card-title {
  color: rgb(255, 0, 83);
}
a.portail_button {
  margin: 50px 0;
  padding: 0 1em;
  background-color: transparent;
  border-color: #FFFFFF;
  border-width: 1px;
  border-radius: 5px;
  font-family: $family-secondary;
  font-size: 18px;
  text-align: center;
  font-weight: 400;
  color: #FFFFFF;
  text-transform: uppercase;

  @include on-mobile {
    font-size: 14px;
  }
}
a.portail_button:hover {
  color: #FFFFFF;
}

.search_row,
.advanced-search_row,
.search_page_search_row {
  display:flex;
  flex-direction: row;
  align-items: center;
  width: 100% !important;

  padding-left: calc( 0.5 * (100% - $nav-max-width) );
  padding-right: calc( 0.5 * (100% - $nav-max-width) );

  @include on-small-desktop {
    padding-left: $container-small-desktop-margin;
    padding-right: $container-small-desktop-margin;
  }

  @include on-tablet {
    padding-left: $container-tablet-margin;
    padding-right: $container-tablet-margin;
  }

  @include on-mobile {
    padding-left: $container-mobile-margin;
    padding-right: $container-mobile-margin;
  }
}

.advanced-search_row.large-screen {
  padding-left: $container-tablet-margin;
  padding-right: $container-tablet-margin;

  @include on-tablet {
    padding-left: $container-tablet-margin;
    padding-right: $container-tablet-margin;
  }

  @include on-mobile {
    padding-left: $container-mobile-margin;
    padding-right: $container-mobile-margin;
  }
}

.search_row {
  background-color: #230914;
  padding-top: 25px;
  padding-bottom: 25px;

  & > .column.pt-3 {
    padding-top: 0 !important;
  }
}

.search_page_search_row {
  background-color: transparent;

  @include on-mobile {
    flex-direction: column;
    align-items: center;

    & > .column {
      width: 100%;
    }
  }
}

.advanced-search_row {
  display: flex;
  align-items: flex-start;
  gap: 40px;
  overflow: hidden;

  @include on-small-tablet {
    display: block !important;
    position: relative;
  }

  & > .filters-column {
    flex: 350px 0 0;
    padding-top: 70px;
    position: relative;

    @include on-small-tablet {
      position: absolute;
      z-index: 100;

      ::v-deep {
        .advanced-search-form {
          background-color: rgba(255, 255, 255, 0.9);
          padding-right: 10px;
          padding-bottom: 50px;
          border-radius: 10px;
          transform: translateX(-100%);
        }
      }
    }

    .hide-left-bar {
      position: absolute;
      top: 0;
      left: 0;

      width: 32px;
      height: 32px;
      background: url('../assets/images/icons/close-filters-panel.svg') center / 18px auto no-repeat;
      margin-top: 20px;
      cursor: pointer;
    }

  }

  & > .main-column {
    width: 100%;
    flex: 100% 0 0;

    .main-column-content {
      width: 100%;

      .container {
        max-width: 100%;
      }
    }
  }

  &.with-side-bar > .filters-column {
    ::v-deep {
      .advanced-search-form {
        transform: translateX(0);
      }
    }
  }

  &.with-side-bar > .main-column {
    flex: calc( 100% - 350px - 40px ) 0 0;
    width: calc( 100% - 350px - 40px );

    @include on-small-tablet {
      width: 100%;
    }
  }
}

.search_span {
  margin-left: 0 !important;
  background-color: rgba(35, 9, 20);
  font-family: $family-primary;
  font-size: 20px;
  color: white;
  text-align: center;

  @include on-mobile {
    display: none;
    font-size: 15px;
  }

}
.search-container {
  margin: 0 0 0 20px !important;

  @include on-mobile {
    margin: 0 !important;
  }

  ::v-deep .icon {
    height: 40px !important;
    padding: 0;
  }
}

.search_page_search_span {
  background-color: #00000094;
  font-size: 20px;
  line-height: 1;
  color: white;
  text-align: center;
  padding: 10px 12px;
  border-radius: 5px;

  @include on-mobile {
    font-size: 16px;
  }

}

/*a.button {
  border: none !important;
  outline: none !important;
}*/


</style>
