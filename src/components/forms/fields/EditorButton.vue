<template>
  <div
    class="control"
  >
    <button
      class="button is-small"
      :class="buttonClass"
      :disabled="!active"
      @click="callback(format)"
    >
      <span class="tooltiptext">{{ setTitles(this.format) }}</span>
    </button>
  </div>
</template>

<script>
import icons from "../../../modules/quill/icons";

export default {
  name: "EditorButton",
  props: {
    selected: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    callback: { type: Function, default: () => {} },
    format: { type: String, default: "" },
  },
  computed: {
    buttonClass() {
      return this.format + "-btn " + ( this.selected ? "selected" : "" );
    },
    iconClass() {
      return "fa fa-" + this.icon;
    },
    iconSvg() {
      return icons[this.format];
    },
  },
  methods: {
    setTitles(format) {
      let tooltips = {
        "italic": "Italique",
        "bold": "Gras",
        "underline": "Souligné",
        "cite": "Citation",
        "superscript": "Exposant",
        "page": "Page suivante",
        "person": "Personne",
        "location": "Lieu",
        "note": "Note",
        "link": "Lien",
        "close": "Fermer",
        "del": "Barré",
        "remove": "Retirer le formatage"
      }
      return tooltips[format]
    },
  },
};
</script>

<style scoped  lang="scss">
.control {

  button {
    display: inline-block;
    position: relative;
    width: 40px;
    height: 40px;
    background-color: #F2F2F2;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 4px !important;
    border: none;

    &:hover {
      background-color: #E9E9E9;
    }

    &.selected {
      background-color: #FFE76E;
    }

    &.italic-btn {
      background-image: url(../../../assets/images/icons/editor_ital.svg);
      background-size: 8px auto;
    }

    /* Manquent les icônes */

    &.bold-btn {
      background-image: url(../../../assets/images/icons/editor_bold.svg);
    }

    &.underline-btn {
      background-image: url(../../../assets/images/icons/editor_underline.svg);
    }

    &.remove-btn,
    &.del-btn {
      background-image: url(../../../assets/images/icons/editor_del.svg);
    }

    &.cite-btn {
      background-image: url(../../../assets/images/icons/editor_quote.svg);
    }

    /* */

    &.superscript-btn {
      background-image: url(../../../assets/images/icons/editor_exposant.svg);
      background-size: 18px auto;
    }

    &.page-btn {
      background-image: url(../../../assets/images/icons/editor_saut_page.svg);
      background-size: 20px auto;
    }

    &.person-btn {
      background-image: url(../../../assets/images/icons/editor_perso.svg);
      background-size: 18px auto;
    }

    &.location-btn {
      background-image: url(../../../assets/images/icons/editor_lieu.svg);
      background-size: 18px auto;
    }

    &.note-btn {
      background-image: url(../../../assets/images/icons/editor_ajout_note.svg);
      background-size: 25px auto;
    }

    &.link-btn {
      background-image: url(../../../assets/images/icons/editor_lien.svg);
      background-size: 23px auto;
    }

    &.list-btn {
      background-image: url(../../../assets/images/icons/editor_liste.svg);
      background-size: 23px auto;
    }

    &.close-btn {
      background-image: url(../../../assets/images/icons/close_text.svg);
      background-size: 23px auto;
    }

    & > *:not(.tooltiptext) {
      display: none;
    }
    &:not(hover) > .tooltiptext {
      font-size: 12px !important;
      width: auto;
      background-color: black !important;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px 5px;
      visibility: hidden;
      /* Position the tooltip */
      position: absolute;
      z-index: 10;
      bottom: 110%;
      transform: translateX(-50%);
    }
    &:hover > .tooltiptext[disabled]{
      visibility: visible;
      background-color: #C3C3C3 !important;
    }
    &:hover > .tooltiptext {
      visibility: visible;
      background-color: black !important;
    }
  }
}

</style>
