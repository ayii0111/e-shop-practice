import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useJsonViewStore = defineStore('JsonView', () => {
  const data = ref({})

  function dataInject(_data: any) {
    data.value = _data
  }
  function dataReset() {
    data.value = {}
  }

  return { data, dataInject, dataReset }
})
