<template>
  <div
    :id="`vue-mirador-container-${windowId}`"
    class="vue-mirador-container"
    @refresh-viewer="updateCurrentWindow"
  /><!-- v-show="viewer" -->
</template>

<script>
import React from 'react';
import ReactDOM from "react-dom/client";
import {Provider} from 'react-redux';
import Mirador from "mirador";
import MiradorApp from 'mirador/dist/es/src/components/App';
import createPluggableStore from 'mirador/dist/es/src/state/createPluggableStore';
import {mapActions, mapState} from "vuex";

let NEXT_MUI_CLASSES_SEED = 0;


export default {
  name: "MiradorViewer",
  components: {},
  props: {
    manifestUrl: { type: String, required: true },
    windowId: {type: String, default: "document"}
  },
  data() {
    return {
      reactRoot: null,
      miradorStore: null,
      defaultManifestUrl: null,
      canvasId: '',
    };
  },
  computed: {
    ...mapState("document", ["witnesses"]),
    ...mapState("search", ["documents"]),
    ...mapState("layout", ["canvasIndex", "viewerMode"]),
  },
  watch: {
    manifestUrl(newValue, oldValue) {
      console.log("Mirador watch manifestUrl / newValue : ", newValue)
      this.setManifestUrl(this.manifestUrl);
    },
    canvasIndex() {
      console.log("Mirador watch canvasIndex", this.canvasIndex)
      this.setCanvasId(this.canvasIndex)
    },
    viewerMode: {
      immediate: true,
      handler(newValue, oldValue) {
        console.log("Mirador watch viewerMode / newValue : ", newValue)
        //this.setCanvasId(this.canvasIndex)
      }
    }
  },
  async mounted() {
    await this.initialize();
  },
  beforeDestroy() {
    this.reactRoot.unmount()
  },
  async created() {
    this.$parent.$on("refresh-viewer", await this.updateCurrentWindow);
  },
  methods: {
    ...mapActions("layout", ["setViewerMode", "setCanvasIndex"]),
    async initialize() {
      if (this.viewerMode === "text-mode" || !this.viewerMode) {
        this.setViewerMode("text-and-images-mode");
      }
      const manifests = {};
      let url = this.manifestUrl;
      try {
        //const collection = await axios.get(this.manifestUrl);
        // waiting for mirador 3 support of collections ?
        //url = collection.data.manifests[0]["@id"];
      } catch (e) {
        console.error(e);
      }

      manifests[url] = {
        // metadata:
        // 'provider': ''
      };

      try {
        const viewerContainerId = `vue-mirador-container-${this.windowId}`;
        const viewerConfig = {
          id: viewerContainerId,
          manifests: manifests,
          windows: [
            {
              id: this.windowId,
              loadedManifest: url,
              canvasIndex: this.canvasIndex
            },
          ],
          window: {
            allowClose: false,
            allowFullscreen: false,
            allowMaximize: false,
            defaultSideBarPanel: "info",
            defaultView: 'single',
            sideBarOpenByDefault: false,
            hideWindowTitle: true,
            maximizedByDefault: false
          },
          workspace: {
            showZoomControls: true,
            type: "mosaic", // Which workspace type to load by default. Other possible values are "elastic"
          },
          workspaceControlPanel: {
            enabled: false,
          },
          createGenerateClassNameOptions: {
            productionPrefix: "mirador",
            seed: NEXT_MUI_CLASSES_SEED++,

          }
        }
        this.reactRoot = ReactDOM.createRoot(document.getElementById(viewerContainerId));
        this.miradorStore = createPluggableStore(viewerConfig);
        this.reactRoot.render(
          React.createElement(
            Provider,
            {store: this.miradorStore},
            React.createElement(
              MiradorApp,
              {plugins: []}
            )
          ),
        )
      } catch (e) {
        console.warn("Mirador viewer: ", e);
      }
    },
    async dispatchMiradorAction(action) {
      this.miradorStore.dispatch(action);
    },

    setManifestUrl(newUrl) {
      //console.log("setManifestUrl", newUrl);
      const action = Mirador.actions.updateWindow(this.windowId, {
        manifestId: this.manifestUrl,
      });
      this.dispatchMiradorAction(action);
    },

    async setCanvasId(canvasIndex) {
      console.log("setCanvasId", canvasIndex)
      this.canvasId = this.witnesses[0].manifest.sequences[0]["canvases"][canvasIndex]["@id"];
      const action = Mirador.actions.setCanvas(this.windowId, this.canvasId);
      if (this.viewerMode === "text-mode" || !this.viewerMode) {
        this.setViewerMode("text-and-images-mode");
      }
      this.dispatchMiradorAction(action);
    },

    updateCurrentWindow() {
      console.log("refresh-viewer caught by mirador viewer");
      this.setManifestUrl(this.manifestUrl);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/sass/main.scss";

.vue-mirador-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.mosaic-root {
  top: 0 !important;
  bottom: 0 !important;
  right: 0 !important;
  left: 0 !important;
}
.mosaic-tile {
  margin: 0 !important;
}
.Connect\(WithPlugins\(WindowTopBar\)\)-windowTopBarStyle-16.Connect\(WithPlugins\(WindowTopBar\)\)-focused-15 {
  border-top: none !important;
}
</style>
