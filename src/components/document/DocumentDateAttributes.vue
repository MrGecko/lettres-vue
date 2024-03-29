<template>
  <div
    class="document-date__attributes component is-flex is-justify-items-space-between is-align-items-center"
    :class="editMode ? 'edit-mode' : 'read-mode'"
    style="width: 100%"
  >
    <!--<div class="is-flex is-align-items-center" v-if="editable">
      <span
        v-if="editable"
        :class="!editMode ? 'edit-btn' : 'close-btn'"
        @click="!editMode? enterEditMode() : leaveEditMode()"
      />
    </div>-->
    <div
      v-if="editable"
      class="creation-date"
    >
      <span
        v-if="editable"
        :class="!editMode ? 'edit-btn' : 'close-btn'"
        @click="!editMode? enterEditMode() : leaveEditMode()"
      />
      <b-field
        label="Date de rédaction"
        label-position="inside"
        :type="creationTmpIsValid !== true ? 'is-danger' : null"
        :message="creationTmpIsValid !== true ? creationTmpIsValid !== false ? creationTmpIsValid : 'Format incorrect (AAAA-MM-JJ)' : null"
        @dblclick.native="enterEditMode"
      >
        <b-input
          v-model="creation"
          class="creation-date-input"
          name="creation"
          :placeholder="editMode ? '1574-12-09' : ''"
          expanded
          :disabled="!editMode"
          @keyup.esc.native="cancelInput($event)"
        />
      </b-field>
      <b-field
        label="Étiquette"
        label-position="inside"
        @dblclick.native="enterEditMode"
      >
        <b-input
          v-model="creationLabel"
          class="creation-date-input"
          name="creationLabel"
          :placeholder="editMode ? '1574, 9 Décembre' : ''"
          expanded
          :disabled="!editMode"
          @keyup.esc.native="cancelInput($event)"
        />
      </b-field>
      <b-field
        label="Rédigée avant le"
        label-position="inside"
        :type="notAfterTmpIsValid !== true ? 'is-danger' : null"
        :message="notAfterTmpIsValid !== true ? notAfterTmpIsValid !== false ? notAfterTmpIsValid : 'Format incorrect (AAAA-MM-JJ)' : null"
        @dblclick.native="enterEditMode"
      >
        <b-input
          v-model="creationNotAfter"
          class="creation-date-input"
          name="creationNotAfter"
          :placeholder="editMode ? '1575-01-01' : ''"
          expanded
          :disabled="!editMode"
          @keyup.esc.native="cancelInput($event)"
        />
      </b-field>
      <div
        v-if="editMode && isModified"
        class="control"
      >
        <button
          type="submit"
          class="button save_button is-primary"
          :disabled="creationTmpIsValid !==true || notAfterTmpIsValid !== true"
          :class="saving === 'loading' ? 'is-loading' : ''"
          @click="save"
        >
          <save-button-icon
            :status="status"
          />
        </button>
      </div>
    </div>

    <!-- NON EDITABLE MODE -->
    <div
      v-else
      class="creation-date"
    >
      <!--<b-field
        label="Date de rédaction"
        class="creation-date-input"
      >
        <span class="control">{{ creation }}</span>
      </b-field>-->
      <b-field
        label="Étiquette"
        class="creation-date-input"
      >
        <span class="control">{{ creationLabel }}</span>
      </b-field>
      <!--<b-field
        label="Rédigé avant le"
        class="creation-date-input"
      >
        <span class="control">{{ creationNotAfter }}</span>
      </b-field>-->
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import SaveButtonIcon from "@/components/ui/SaveButtonIcon.vue";

export default {
  name: "DocumentAttributes",
  components: {SaveButtonIcon},
  props: {
    editable: {
      type: Boolean,
      default: false,
    },
    editAttributes: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      creationLabelStatus: "normal",
      creationInit: null,
      creationTmp: null,
      creationLabelInit: null,
      creationLabelTmp: null,
      creationNotAfterInit: null,
      creationNotAfterTmp: null,

      creationTmpIsValid: true,
      notAfterTmpIsValid: true,

      editMode: false,
      isModified: false,
      saving: "normal",
      status: "normal",
    };
  },
  computed: {
    ...mapState("document", ["document"]),
    creation: {
      get() {
        return this.creationTmp;
      },
      set(value) {
        this.creationTmp = value;
        this.maskCheckCreation();
        if (this.creationTmp !== this.document["creation"] || this.creationLabelTmp !== this.document["creation-label"] || this.creationNotAfterTmp !== this.document["creation-not-after"]) {
          this.isModified = true;
        } else {
          this.isModified = false;
        }
      },
    },
    creationLabel: {
      get() {
        return this.creationLabelTmp;
      },
      set(value) {
        this.creationLabelTmp = value;
        if (this.creationTmp !== this.document["creation"] || this.creationLabelTmp !== this.document["creation-label"] || this.creationNotAfterTmp !== this.document["creation-not-after"]) {
          this.isModified = true;
        } else {
          this.isModified = false;
        }
      },
    },
    creationNotAfter: {
      get() {
        return this.creationNotAfterTmp;
      },
      set(value) {
        this.creationNotAfterTmp = value
        this.maskCheckNotAfter();
        if (this.creationTmp !== this.document["creation"] || this.creationLabelTmp !== this.document["creation-label"] || this.creationNotAfterTmp !== this.document["creation-not-after"]) {
          this.isModified = true;
        } else {
          this.isModified = false;
        }
      },
    },

    documentCreationLabel() {
      return this.document["creation-label"];
    },
    documentCreationNotAfter() {
      return this.document["creation-not-after"];
    },
  },
  watch: {
    "document.creation"() {
      this.creationTmp = this.document.creation;
    },
    documentCreationLabel() {
      this.creationLabelTmp = this.document["creation-label"];
    },
    documentCreationNotAfter() {
      this.creationNotAfterTmp = this.document["creation-not-after"];
    },
    creationTmp() {
      if (this.creationTmp) {
        this.maskCheckNotAfter()
        if (this.creationTmpIsValid === true && this.creationNotAfterTmp && this.notAfterTmpIsValid === true) {
          this.compareDates(this.creationTmp, this.creationNotAfterTmp)
        }
      }
    },
    creationNotAfterTmp() {
      if (this.creationNotAfterTmp) {
        this.maskCheckCreation()
        if (this.creationTmp && this.creationTmpIsValid === true && this.notAfterTmpIsValid === true) {
          this.compareDates(this.creationTmp, this.creationNotAfterTmp)
        }
      }
    }
  },
  created() {
    this.creationInit = this.document.creation;
    this.creationTmp = this.document.creation;
    this.creationLabelInit = this.document["creation-label"];
    this.creationLabelTmp = this.document["creation-label"];
    this.creationNotAfterInit = this.document["creation-not-after"];
    this.creationNotAfterTmp = this.document["creation-not-after"];
  },
  methods: {
    maskCheckCreation: function () {
      this.creationTmpIsValid = false;
      let dateRegEx = /^\d{4}(?:-\d{2}){0,2}$/;
      let fullDateRegEx = /^\d{4}-\d{2}-\d{2}$/;
      // Checking format first (either blank or as dateRegEx / fullDateRegEx)
      if (!this.creationTmp || this.creationTmp === '') {
        this.creationTmpIsValid = true;
      } else if (!this.creationTmp.match(dateRegEx) && !this.creationTmp.match(fullDateRegEx)) {
        // Format invalid : this.notAfterTmpIsValid remains false
      } else {
        // If date and if date format ok : further validity checks
        this.creationTmpIsValid = true;
        if (this.creationTmp.length > 0 && this.creationTmpIsValid) {
          let d = new Date(this.creationTmp);
          if (this.creationTmp.length === 4) {
            this.creationTmpIsValid = d.getFullYear() ? true : "Date invalide"
          } else if (this.creationTmp.length === 7) {
            this.creationTmpIsValid = d.getFullYear() && d.getMonth() + 1 ? true : "Date invalide"
          } else if (this.creationTmp.length === 10) {
            let dNum = d.getTime();
            if (!dNum && dNum !== 0) {
              // NaN value, Invalid date
              this.creationTmpIsValid = "Date invalide"
            }
            if (d.getTime()) {
              // Valid date
              if (d.toISOString().slice(0, 10) === this.creationTmp) {
                // Leap year date check
                this.creationTmpIsValid = true
              } else {
                this.creationTmpIsValid = "Date invalide";
              }
            }
          }
        }
      }
    },
    maskCheckNotAfter: function () {
      this.notAfterTmpIsValid = false;
      let dateRegEx = /^\d{4}(?:-\d{2}){0,2}$/;
      let fullDateRegEx = /^\d{4}-\d{2}-\d{2}$/;
      // Checking format first (either blank or as dateRegEx / fullDateRegEx)
      if (!this.creationNotAfterTmp || this.creationNotAfterTmp === '') {
        this.notAfterTmpIsValid = true;
      } else if (!this.creationNotAfterTmp.match(dateRegEx) && !this.creationNotAfterTmp.match(fullDateRegEx)) {
        // Format invalid : this.notAfterTmpIsValid remains false
      } else {
        // If date and if date format ok : further validity checks
        this.notAfterTmpIsValid = true;
        if (this.creationNotAfterTmp.length > 0 && this.notAfterTmpIsValid) {
          let d = new Date(this.creationNotAfterTmp);
          if (this.creationNotAfterTmp.length === 4) {
            this.notAfterTmpIsValid = d.getFullYear() ? true : "Date invalide"
          } else if (this.creationNotAfterTmp.length === 7) {
            this.notAfterTmpIsValid = d.getFullYear() && d.getMonth() + 1 ? true : "Date invalide"
          } else if (this.creationNotAfterTmp.length === 10) {
            let dNum = d.getTime();
            if (!dNum && dNum !== 0) {
              // NaN value, Invalid date
              this.notAfterTmpIsValid = "Date invalide"
            }
            if (d.getTime()) {
              // Valid date
              if (d.toISOString().slice(0, 10) === this.creationNotAfterTmp) {
                // Leap year date check
                this.notAfterTmpIsValid = true
              } else {
                this.notAfterTmpIsValid = "Date invalide";
              }
            }
          }
        }
      }
    },
    compareDates(creationTmp, creationNotAfterTmp) {
      let d_creation = new Date(creationTmp.slice(0, creationNotAfterTmp.length));
      let d_notAfter = new Date(creationNotAfterTmp.slice(0, creationTmp.length));
      // Checking years first
      this.creationTmpIsValid = d_creation.getFullYear() <= d_notAfter.getFullYear() ? true : "Invalide : > Rédigée avant le";
      this.notAfterTmpIsValid = d_notAfter.getFullYear() >= d_creation.getFullYear() ? true : "Invalide : < Date de rédaction";
      // Checking months
      if (this.creationTmpIsValid === true && this.notAfterTmpIsValid === true && d_creation.getMonth() && d_notAfter.getMonth()) {
        this.creationTmpIsValid = d_creation.getMonth() <= d_notAfter.getMonth() ? true : "Invalide : > Rédigée avant le";
        this.notAfterTmpIsValid = d_creation.getMonth() <= d_notAfter.getMonth() ? true : "Invalide : < Date de rédaction";
      }
      // Checking days
      if (this.creationTmpIsValid === true && this.notAfterTmpIsValid === true && d_creation.getDate() && d_notAfter.getDate()) {
        this.creationTmpIsValid = d_creation <= d_notAfter ? true : "Invalide : > Rédigée avant le";
        this.notAfterTmpIsValid = d_creation <= d_notAfter ? true : "Invalide : < Date de rédaction";
      }
    },
    cancelInput(evt) {
      this.leaveEditMode()
    },
    enterEditMode() {
      this.editMode = true;
      this.saving = "normal";
      this.status = "normal";
    },
    leaveEditMode() {
      this.creationTmp = this.document.creation;
      this.creationLabelTmp = this.document["creation-label"];
      this.creationNotAfterTmp = this.document["creation-not-after"];
      this.maskCheckCreation();
      this.maskCheckNotAfter();
      this.editMode = false;
      this.isModified = false;
      this.saving = "normal";
      this.status = "normal";
    },
    async save() {
      let saveData = (
          { id: this.document.id,
            attributes:
                {
                  'creation': this.creationTmp === '' ? null : this.creationTmp,
                  'creation-label': this.creationLabelTmp === '' ? null : this.creationLabelTmp,
                  'creation-not-after': this.creationNotAfterTmp === '' ? null : this.creationNotAfterTmp
                }
          }
        );
      let creation_msg = null
      if (!this.creationInit && this.creationTmp && this.creationTmp !== '') {
        saveData['attributes']['creation'] = this.creationTmp === '' ? null : this.creationTmp;
        creation_msg = 'Ajout de la Date de rédaction'
      } else if (this.creationInit && this.creationTmp && this.creationTmp !== '' && this.creationInit !== this.creationTmp) {
        saveData['attributes']['creation'] = this.creationTmp === '' ? null : this.creationTmp;
        creation_msg = `Modification de la Date de rédaction (${this.creationInit})`
      } else if (this.creationInit && !this.creationTmp || this.creationInit && this.creationTmp === '') {
        saveData['attributes']['creation'] = this.creationTmp === '' ? null : this.creationTmp;
        creation_msg = `Suppression de la Date de rédaction (${this.creationInit})`
      }
      let creationLabel_msg = null
      if (!this.creationLabelInit && this.creationLabelTmp) {
        saveData['attributes']['creation-label'] = this.creationLabelTmp === '' ? null : this.creationLabelTmp;
        creationLabel_msg = 'Ajout de la date "Étiquette"'
      } else if (this.creationLabelInit && this.creationLabelTmp && this.creationLabelInit !== this.creationLabelTmp) {
        saveData['attributes']['creation-label'] = this.creationLabelTmp === '' ? null : this.creationLabelTmp;
        creationLabel_msg = `Modification de la date "Étiquette" (${this.creationLabelInit})`
      } else if (this.creationLabelInit && !this.creationLabelTmp || this.creationLabelInit && this.creationLabelTmp === '') {
        saveData['attributes']['creation-label'] = this.creationLabelTmp === '' ? null : this.creationLabelTmp;
        creationLabel_msg = `Suppression de la date "Étiquette" (${this.creationLabelInit})`
      }
      let creationNotAfter_msg = null
      if (!this.creationNotAfterInit && this.creationNotAfterTmp ) {
        saveData['attributes']['creation-not-after'] = this.creationNotAfterTmp === '' ? null : this.creationNotAfterTmp;
        creationNotAfter_msg = 'Ajout de la date "Rédigée avant le"'
      } else if (this.creationNotAfterInit && this.creationNotAfterTmp && this.creationNotAfterInit !== this.creationNotAfterTmp) {
        saveData['attributes']['creation-not-after'] = this.creationNotAfterTmp === '' ? null : this.creationNotAfterTmp;
        creationNotAfter_msg = `Modification de la date "Rédigée avant le" (${this.creationNotAfterInit})`
      } else if (this.creationNotAfterInit && !this.creationNotAfterTmp || this.creationNotAfterInit && this.creationNotAfterTmp === '') {
        saveData['attributes']['creation-not-after'] = this.creationNotAfterTmp === '' ? null : this.creationNotAfterTmp;
        creationNotAfter_msg = `Suppression de la date "Rédigée avant le" (${this.creationNotAfterInit})`
      }
      //console.log("saveData['changelog_msg']", [creation_msg, creationLabel_msg, creationNotAfter_msg].filter(Boolean).join(', '))
      saveData['changelog_msg'] = [creation_msg, creationLabel_msg, creationNotAfter_msg].filter(Boolean)
        console.log("saveData : ", saveData);
        this.saving = "loading";
        this.$store.dispatch("document/save", saveData)
            .then(response => {
              if (response != 200) {
                console.log("saving date response not 200 : ", response)
                this.saving = "normal";
                this.dateSetStatusError();
              } else {
                this.creationInit = saveData['attributes']['creation'];
                this.creationLabelInit = saveData['attributes']['creation-label'];
                this.creationNotAfterInit = saveData['attributes']['creation-not-after']
                /*if (update_msg.length > 0){
                  console.log("test")
                  update_msg.forEach((m) => {
                    this.$store.dispatch("changelog/trackChanges", {
                      objId: this.document.id,
                      objType: 'document',
                      userId: this.$store.state.user.current_user.id,
                      msg: m
                    }).then(() => {
                      console.log("changelog date updated")
                    }).catch(() => {
                      console.log("changelog date not updated")
                    });
                  })
                }*/
                this.saving = "normal";
                this.dateSetStatusSuccess();
                setTimeout(() => {
                      this.dateSetStatusNormal()
                      this.isModified = false;
                      this.leaveEditMode()
                    },
                    1500)
              }
            })
            .catch((e) => {
              console.log("saving date catch error : ", e)
              this.saving = "normal";
              this.dateSetStatusError();
        });
    },
    dateSetStatusNormal() {
      this.status = "normal";
    },
    dateSetStatusSuccess() {
      this.status = "success";
    },
    dateSetStatusError() {
      this.status = "error";
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";

.creation-date {
  width: 100%;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  //gap: 10px;

  @include on-tablet {
    flex-direction: column;
  }

  .creation-date-input {
    margin-right: 30px;
    width: 200px;

    ::v-deep {
      input[type="text"] {
        padding: 22px 30px 5px 14px !important;
      }
      input[disabled] {pointer-events:none}
    }
  }
  &::v-deep > div > p {
      margin-right: 30px;
      text-align: center;
  }

  .label {
    font-size: 12px !important;
  }
}

.document-date__attributes.read-mode {
  .creation-date-input {
    ::v-deep {
      ::placeholder {
        color: transparent;
        text-indent: -9999px;
      }
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
    margin-bottom: 10px;
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
    margin-bottom: 10px;
  }

  .icon.icon__pen-edit {
    display: none;
  }
}
.save_button {
  position: unset;
  flex: 40px 0 0;

  display: inline-flex;
  align-items:center;
  width: 38px;
  height: 38px;
  padding: 0;
  cursor: pointer;

  @include on-mobile {
    flex: 45px 0 0;
  }

  .icon.icon__pen-edit {
    display: none;
  }
}
</style>
