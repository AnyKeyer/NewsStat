<template>
  <div id="app">
    <AppHeader />
    
    <main class="container" style="flex: 1; padding: 2rem 1rem;">
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>