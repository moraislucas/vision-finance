<script setup lang="ts">
import { RouterView } from 'vue-router';
import { TooltipProvider } from 'reka-ui';
</script>

<template>
  <TooltipProvider :delay-duration="200" :skip-delay-duration="100">
    <RouterView />
  </TooltipProvider>
</template>
