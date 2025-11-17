<script setup>
  import { DatePicker } from 'v-calendar';
  import 'v-calendar/dist/style.css';
  import { format, sub } from 'date-fns';

  const { t } = useI18n();

  const props = defineProps({
    label: {
      type: String,
    },
    name: {
      type: String,
    },
    size: {
      type: String,
      default: 'lg',
    },
    required: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: 'date',
    },
    dateFormat: {
      type: String,
      default: 'PP',
    },
    isRange: {
      type: Boolean,
      default: false,
    },
    disableDates: {
      type: Array,
      default: () => [],
    },
  });

  const date = defineModel();
  const selectedRangeId = ref(null);

  const ranges = [
    { id: 1, label: 'forms.datePicker.last7Days', duration: { days: 7 } },
    { id: 2, label: 'forms.datePicker.last14Days', duration: { days: 14 } },
    { id: 3, label: 'forms.datePicker.last30Days', duration: { days: 30 } },
    { id: 4, label: 'forms.datePicker.last3Months', duration: { months: 3 } },
    { id: 5, label: 'forms.datePicker.last6Months', duration: { months: 6 } },
    { id: 6, label: 'forms.datePicker.lastYear', duration: { years: 1 } },
  ];

  const selectRange = (range) => {
    date.value = { start: sub(new Date(), range.duration), end: new Date() };
    selectedRangeId.value = range.id;
  };
</script>

<template>
  <u-form-group :label="props.label" :name="props.name" :required="props.required">
    <u-popover>
      <div class="flex-1">
        <slot name="default">
          <u-input
            v-if="props.isRange"
            :size="props.size"
            :value="
              date.start && date.start
                ? format(date.start, props.dateFormat) + ' &#8652; ' + format(date.end, props.dateFormat)
                : ''
            "
            icon="i-solar-calendar-linear"
          />
          <u-input
            v-else
            :size="props.size"
            :value="date ? format(date, props.dateFormat) : ''"
            icon="i-hugeicons-calendar-03"
          />
        </slot>
      </div>

      <template #panel="{ close }">
        <div class="flex gap-4 items-center">
          <div v-if="props.isRange" class="hidden sm:flex ltr:border-r rtl:border-l flex-col px-2 py-4">
            <u-link
              v-for="(range, index) in ranges"
              :key="index"
              class="py-2 rounded px-8 text-sm"
              truncate
              variant="link"
              :class="{ 'bg-blue-500/20': range.id === selectedRangeId }"
              @click="selectRange(range)"
              >{{ t(range.label) }}</u-link
            >
          </div>

          <date-picker
            style="direction: ltr"
            v-if="props.isRange"
            v-model.range="date"
            :columns="2"
            :disabled-dates="props.disabledDates"
            :mode="props.mode"
            borderless
            is-required
            transparent
            @close="close"
          />

          <date-picker
            style="direction: ltr"
            v-else
            v-model="date"
            :disabled-dates="props.disabledDates"
            :mode="props.mode"
            borderless
            is-required
            transparent
            @close="close"
          />
        </div>
      </template>
    </u-popover>
  </u-form-group>
</template>
