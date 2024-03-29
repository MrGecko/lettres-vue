<template>
  <span class="page-title">{{ title }}</span>
</template>

<script>
export default {
  name: "PageTitle",
  props: {
    title: {type: String, required: true },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/sass/main.scss";
.page-title {
  display: block;
  margin-top: 10px;
  margin-bottom: 20px;

  border: none;
  padding: 10px 0;
  font-family: $family-secondary;
  font-size: 16px;
  color: #C00055 !important;
  font-weight: 500;
  text-decoration: none;
  text-transform: uppercase;
}
</style>
