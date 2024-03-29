<template>
  <b-button
    type="is-primary"
    :label="label"
    class="create-btn"
    :loading="loading"
    @click="click"
  />
</template>

<script>
export default {
  name: "CreateButton",
  props: {
    label: {type: String, required: true},
    loading: {type: Boolean, required: false},
  },
  methods: {
    click(evt) {
      this.$emit('click', evt);
    }
  }
}
</script>


<style lang="scss">
@import "@/assets/sass/main.scss";
@import "@/assets/sass/components/_buttons.scss";
</style>