<template>
  <modal-form
    :title="title"
    :cancel="cancelAction"
    :submit="submitAction"
    :remove="removeAction"
    :submitValid="isSubmitValid"
    :previousValue="hasPreviousValue"
    :submitting="false"
  ><!-- :valid="$props.format === 'page' ? /^\d+$/.test(form1) && form2.length >= 1 : form1.length >= 1"-->
    <div class="location-form textinput-form">
      <form @submit.prevent="">
        <div class="field">
          <label class="label">{{ label }}</label>
          <div class="control">
            <input
              ref="field1"
              v-model="form1"
              class="input"
              type="text"
            >
          </div>
        </div>
        <div
          v-if="$props.format && $props.format === 'page'"
          class="field"
        >
          <label class="label">URL de la page</label>
          <div class="control">
            <input
              ref="field"
              v-model="form2"
              class="input"
              type="url"
            >
          </div>
        </div>
      </form>
    </div>
  </modal-form>
</template>

<script>
import ModalForm from "./ModalForm";

export default {
  name: "TextfieldForm",
  components: {
    ModalForm,
  },
  props: {
    format: { type: String, default: ""},
    title: { type: String, default: "" },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    url: { type: String, default: "" },
    cancel: { type: Function, default: () => {} },
    submit: { type: Function, default: () => {} },
    remove: { type: Function, default: () => {} },
  },
  data() {
    return {
      form1: this.value,
      form2: this.url,
      isSubmitValid: false,
      hasPreviousValue: this.value? true : false
    };
  },
  watch: {
    form1(){
      if (this.$props.format === 'page') {
        console.log('this.$props.format === \'page\'')
        if (/^\d+$/.test(this.form1) && this.isHttpValid(this.form2)) {
          this.isSubmitValid = true
        } else this.isSubmitValid = false
      } else {
        console.log('not this.$props.format === \'page\'')
        if (this.isHttpValid(this.form1)) {
          this.isSubmitValid = true
        } else this.isSubmitValid = false
      }
    },
    form2(){
      if (this.$props.format === 'page') {
        console.log('this.$props.format === \'page\'')
        if (/^\d+$/.test(this.form1) && this.isHttpValid(this.form2)) {
          this.isSubmitValid = true
        } else this.isSubmitValid = false
      } else {
        console.log('not this.$props.format === \'page\'')
        if (this.isHttpValid(this.form1)) {
          this.isSubmitValid = true
        } else this.isSubmitValid = false
      }
    }
  },
  mounted() {
    this.$refs.field1.focus();
    console.log("this.value", this.value)
    console.log("this.url", this.url)
    console.log("format", this.$props.format)
  },
  methods: {
    isHttpValid(str) {
      try {
        const newUrl = new URL(str);
        return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
      } catch (err) {
        return false;
      }
    },
    submitAction() {
      if (this.$props.format === 'page') {
        if (this.value && this.url && this.form1 !== this.value || this.value && this.url && this.form2 !== this.url) {
          console.log("this is an update", { href: this.form2, pageNum: this.form1 })
          //this.removeAction();
          this.$props.submit({href: this.form2, pageNum: this.form1});
        } else {
          console.log("{ href: this.form1, pageNum: this.form2}", { href: this.form2, pageNum: this.form1 })
          this.$props.submit({  href: this.form2, pageNum: this.form1 });
        }
      } else {
        this.$props.submit(this.form1);
      }
    },
    cancelAction() {
      this.$props.cancel();
    },
    removeAction() {
      this.$props.remove();
    },
  },
};
</script>
