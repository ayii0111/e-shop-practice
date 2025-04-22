<script setup lang="ts">
const route = useRoute()
console.log(route.params.abc)
</script>

<template>
  <div>
    <h1>{{ route.params.abc }}</h1>
    <h1>{{ route.params.id }}</h1>
    <RouterLink :to="{ name: 'user', params: { id: 12, abc: '123' } }">
      hello
    </RouterLink>
  </div>
</template>

<style scoped lang="scss"></style>
