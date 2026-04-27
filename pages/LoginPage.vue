<script setup lang="ts">
import { Button, Dialog, Divider, InputText, Message, Password } from 'primevue'

const visible = defineModel<boolean>('visible', { default: false })

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = '請填寫帳號與密碼'
    return
  }
  loading.value = true
  // TODO: 接 Supabase auth
  // const { error } = await supabase.auth.signInWithPassword({ email, password })
  loading.value = false
}

function handleClose() {
  email.value = ''
  password.value = ''
  errorMsg.value = ''
  visible.value = false
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :closable="true" :draggable="false" class="w-full max-w-[420px]" @hide="handleClose">
    <template #header>
      <span class="font-semibold text-[18px] tracking-wide">登入</span>
    </template>

    <div class="flex flex-col gap-4 px-2 py-1">
      <!-- 錯誤訊息 -->
      <Message v-if="errorMsg" severity="error" :closable="false">
        {{ errorMsg }}
      </Message>

      <!-- 帳號 -->
      <div class="flex flex-col gap-1">
        <label for="login-email" class="text-[var(--primary-text-color)] text-sm">電子郵件</label>
        <InputText id="login-email" v-model="email" type="email" placeholder="請輸入電子郵件" class="w-full" autocomplete="email" />
      </div>

      <!-- 密碼 -->
      <div class="flex flex-col gap-1">
        <label for="login-password" class="text-[var(--primary-text-color)] text-sm">密碼</label>
        <Password v-model="password" input-id="login-password" placeholder="請輸入密碼" :feedback="false" toggle-mask class="w-full" input-class="w-full" autocomplete="current-password" />
      </div>

      <!-- 忘記密碼 -->
      <div class="text-right">
        <a href="#" class="text-[var(--secondary-text-color)] hover:text-[var(--primary-text-color)] text-sm">
          忘記密碼？
        </a>
      </div>

      <!-- 登入按鈕 -->
      <Button label="登入" :loading="loading" class="bg-[var(--dark-button)] py-2 border-[var(--dark-button)] rounded w-full text-white" @click="handleLogin" />

      <Divider align="center">
        <span class="text-[var(--secondary-text-color)] text-xs">或</span>
      </Divider>

      <!-- 註冊提示 -->
      <p class="text-[var(--secondary-text-color)] text-sm text-center">
        還沒有帳號？
        <a href="#" class="text-[var(--primary-text-color)] underline">立即註冊</a>
      </p>
    </div>
  </Dialog>
</template>

<style scoped lang="scss"></style>
