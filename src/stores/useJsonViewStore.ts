import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useJsonViewStore = defineStore('JsonView', () => {
  const data = ref({})

  function dataInject (data: any) {
    data.value = data
  }
  function dataReset () {
    data.value = {}
  }

  return { data, dataInject, dataReset }
})
