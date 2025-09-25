<template>
  <div class="hashtag-input" @click="focusInput">
    <div v-if="modelValue.length" class="tag-chips">
      <span v-for="tag in modelValue" :key="tag" class="tag-chip">
        #{{ tag }}
        <button type="button" class="remove" @click.stop="remove(tag)" aria-label="Удалить тег">×</button>
      </span>
    </div>
    <input
      ref="inputEl"
      v-model="draft"
      :placeholder="placeholder"
      class="tag-text"
      @keydown.enter.prevent="commit()"
      @keydown.space.prevent="commit()"
      @keydown.tab.prevent="commit(); /* allow navigation but first commit */"
      @keydown.backspace="onBackspace"
      @keydown="onKeydown"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <ul v-if="showSuggestions" class="suggestions">
      <li
        v-for="(s,i) in filteredSuggestions"
        :key="s"
        :class="{ active: i === activeIndex }"
        @mousedown.prevent="choose(s)"
        @mousemove="activeIndex = i"
      >#{{ s }}</li>
      <li v-if="canCreate" class="create" @mousedown.prevent="choose(normalizedDraft)">
        ➕ Создать: #{{ normalizedDraft }}
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

interface Props {
  modelValue: string[]
  all?: string[]
  placeholder?: string
  max?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e:'update:modelValue', v:string[]):void; (e:'added', tag:string):void }>()

const draft = ref('')
const inputEl = ref<HTMLInputElement|null>(null)
const activeIndex = ref(0)
const focused = ref(false)

const normalizedDraft = computed(()=> draft.value.trim().replace(/^#+/, '').toLowerCase())

const filteredSuggestions = computed(()=> {
  const base = (props.all||[]).filter(t => !props.modelValue.includes(t))
  if (!normalizedDraft.value) return base.slice(0,10)
  return base.filter(t => t.startsWith(normalizedDraft.value)).slice(0,10)
})

// Показываем подсказки только когда пользователь что-то вводит (draft не пустой)
const showSuggestions = computed(()=> !!normalizedDraft.value && (filteredSuggestions.value.length>0 || canCreate.value) && focused.value)
const canCreate = computed(()=> !!normalizedDraft.value && !props.modelValue.includes(normalizedDraft.value) && !(props.all||[]).includes(normalizedDraft.value))

function focusInput(){ inputEl.value?.focus() }

function commit(onBlur=false){
  if (!normalizedDraft.value) { draft.value=''; return }
  const val = normalizedDraft.value
  if (props.max && props.modelValue.length >= props.max) { draft.value=''; return }
  if (!props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
    emit('added', val)
  }
  draft.value=''
  if (onBlur) nextTick(()=> { activeIndex.value = 0 })
}

function remove(tag:string){
  emit('update:modelValue', props.modelValue.filter(t=> t!==tag))
}

function choose(tag:string){
  if (props.max && props.modelValue.length >= (props.max||0)) return
  if (!props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
    emit('added', tag)
  }
  draft.value=''
  nextTick(()=> focusInput())
}

function onBackspace(e:KeyboardEvent){
  if (draft.value === '' && props.modelValue.length && !e.repeat) {
    const copy = [...props.modelValue]
    copy.pop()
    emit('update:modelValue', copy)
  }
}

function onInput(){
  activeIndex.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === ',') {
    e.preventDefault()
    commit()
  }
}

function onFocus() { focused.value = true }
function onBlur() { commit(true); focused.value = false }

watch(()=> props.modelValue, ()=> { /* side effects later */ })

// Делаем метод доступным родителю (например для принудительного коммита перед сохранением формы)
defineExpose({ commit })
</script>
<style scoped>
.hashtag-input { position:relative; display:flex; flex-wrap:wrap; gap:.35rem; padding:.5rem .6rem; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:.6rem; cursor:text; }
.tag-chips { display:flex; flex-wrap:wrap; gap:.35rem; }
.tag-chip { display:inline-flex; align-items:center; gap:.35rem; background:linear-gradient(135deg,var(--accent) 0%, var(--accent) 55%, var(--accent) 100%); color:#fff; padding:.25rem .55rem; font-size:.7rem; font-weight:600; letter-spacing:.5px; border-radius:1rem; position:relative; box-shadow:0 2px 6px -2px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 3px rgba(99,102,241,0.18); }
.tag-chip .remove { background:none; border:none; color:inherit; cursor:pointer; font-size:.9rem; line-height:1; padding:0; display:flex; align-items:center; }
.tag-chip .remove:hover { opacity:.75; }
.tag-text { flex:1; min-width:120px; border:none; background:transparent; outline:none; font-size:.8rem; padding:.25rem .15rem; color:var(--text-primary); }
.suggestions { position:absolute; left:0; right:0; top:100%; margin:.25rem 0 0; list-style:none; background:var(--bg-secondary); border:1px solid var(--border); border-radius:.6rem; padding:.35rem 0; max-height:210px; overflow-y:auto; box-shadow:0 6px 18px -6px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.05); z-index:40; }
.suggestions li { padding:.45rem .9rem; font-size:.75rem; cursor:pointer; display:flex; align-items:center; gap:.4rem; color:var(--text-primary); }
.suggestions li.active, .suggestions li:hover { background:var(--accent); color:#fff; }
.suggestions li.create { font-style:italic; color:var(--accent); }
.suggestions li.create:hover { background:var(--accent); color:#fff; }
</style>
