<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCategoryStore } from '@/stores/categories';
import { useToast } from '@/composables/useToast';
import { categorySchema, type CategoryFormValues } from '@/lib/schemas/category';
import type { Category } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';

const props = defineProps<{ editing?: Category | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useCategoryStore();
const toast = useToast();

interface FormState {
  name: string;
  type: 'income' | 'expense';
  color: string;
  /** Emoji (1 grapheme) — guardado na coluna `icon`. */
  icon: string;
}

const form = ref<FormState>({
  name: '',
  type: 'expense',
  color: '#0A84FF',
  icon: '🏷️',
});
const errors = ref<Partial<Record<keyof CategoryFormValues, string>>>({});

watch(
  () => props.editing,
  (c) => {
    if (c) {
      form.value = {
        name: c.name,
        type: c.type,
        color: c.color ?? '#0A84FF',
        icon: c.icon ?? '🏷️',
      };
    } else {
      form.value = { name: '', type: 'expense', color: '#0A84FF', icon: '🏷️' };
    }
    errors.value = {};
  },
  { immediate: true },
);

async function onSubmit() {
  const parsed = categorySchema.safeParse(form.value);
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof CategoryFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.update(props.editing.id, parsed.data);
      toast.success('Categoria atualizada.');
    } else {
      await store.create({
        ...parsed.data,
        icon: parsed.data.icon ?? null,
        color: parsed.data.color ?? null,
        is_default: false,
      });
      toast.success('Categoria criada.');
    }
    emit('saved');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <!-- Preview ao vivo do emoji + cor -->
    <div
      class="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3"
    >
      <div
        class="grid size-11 place-items-center rounded-xl border text-2xl"
        :style="{
          backgroundColor: `${form.color}1A`,
          borderColor: `${form.color}40`,
        }"
      >
        {{ form.icon || '🏷️' }}
      </div>
      <div class="min-w-0">
        <p class="text-xs uppercase tracking-wider text-muted-foreground">Pré-visualização</p>
        <p class="truncate text-sm font-medium">{{ form.name || 'Nova categoria' }}</p>
      </div>
    </div>

    <div class="space-y-1.5">
      <Label for="name">Nome</Label>
      <Input id="name" v-model="form.name" placeholder="Ex.: Pet, Investimentos" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="space-y-1.5">
      <Label>Tipo</Label>
      <Select
        v-model="form.type"
        :options="[
          { value: 'expense', label: 'Despesa' },
          { value: 'income', label: 'Receita' },
        ]"
      />
    </div>

    <div class="space-y-1.5">
      <Label for="icon">Emoji</Label>
      <Input
        id="icon"
        v-model="form.icon"
        placeholder="Ex.: 🚗  •  🍕  •  🎓"
        class="text-xl"
        :maxlength="4"
      />
      <p class="text-xs text-muted-foreground">
        Cole um emoji que represente a categoria — só um caractere.
      </p>
    </div>

    <div class="space-y-2">
      <Label>Cor</Label>
      <ColorPicker v-model="form.color" />
      <p v-if="errors.color" class="text-xs text-destructive">{{ errors.color }}</p>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">
        {{ editing ? 'Salvar' : 'Adicionar' }}
      </Button>
    </div>
  </form>
</template>
