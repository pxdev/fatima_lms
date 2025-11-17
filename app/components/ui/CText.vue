<script setup>
  const model = defineModel();
  const { localeProperties } = useI18n();
  const emit = defineEmits(['edit-attributes', 'delete-attributes']);
  const props = defineProps({
    keyValue: {
      type: String,
      default: '',
    },
    editorMode: {
      type: Boolean,
      default: false,
    },
  });

  const { classesManager } = useContentEditor(model.value.attributes, props.editorMode);

  const updateContent = (event) => {
    model.value.value = event.target.innerHTML;
  };

  const deleteAttributes = (key) => {
    emit('delete-attributes', key);
  };

  const editAttributes = (key) => {
    emit('edit-attributes', key);
  };
</script>

<template>
  <div class="relative inline group">
    <u-button-group
      v-if="props.editorMode"
      class="absolute transition-all opacity-0 right-0 ease-in-out delay-100 bottom-full z-20 group-hover:opacity-100"
      size="xs"
    >
      <u-button icon="hugeicons:settings-02" @click="editAttributes(props.keyValue)" />
      <u-button icon="hugeicons:delete-02" @click="deleteAttributes(props.keyValue)" />
    </u-button-group>
    <span
      :class="classesManager"
      :contenteditable="props.editorMode"
      :dir="localeProperties.dir"
      @blur="updateContent"
      v-html="model.value"
    ></span>
  </div>
</template>

<style scoped></style>
