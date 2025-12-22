<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true
  }
});

const variants = {
  active: {
    label: "Active",
    color: "primary",
  },
  completed: {
    label: "Completed",
    color: "sky",
  },
  pending: {
    label: "Pending",
    color: "amber",
  },
  paused: {
    label: "Paused",
    color: "orange",
  },
  cancelled: {
    label: "Cancelled",
    color: "rose",
  },
};

const label = computed(() => variants[props.status]?.label ?? props.status);
const color = computed(() => variants[props.status]?.color ?? "gray");
</script>

<template>
  <u-badge :label="label" :color="color" variant="soft" class="capitalize" />
</template>
