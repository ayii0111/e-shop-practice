<script setup lang="ts">
import { Button, Divider, InputText, Message, Password } from 'primevue'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const router = useRouter()

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
</script>

<template>
  <div class="flex justify-center items-center bg-[var(--gray-bg)] min-h-screen">
    <div class="flex flex-col gap-4 bg-white shadow px-8 py-10 rounded-lg w-full max-w-[420px]">
      <h2 class="mb-2 font-semibold text-[22px] text-center tracking-wide">
        登入
      </h2>

      <Message v-if="errorMsg" severity="error" :closable="false">
        {{ errorMsg }}
      </Message>

      <div class="flex flex-col gap-1">
        <label for="login-email" class="text-[var(--primary-text-color)] text-sm">電子郵件</label>
        <InputText id="login-email" v-model="email" type="email" placeholder="請輸入電子郵件" class="w-full" autocomplete="email" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="login-password" class="text-[var(--primary-text-color)] text-sm">密碼</label>
        <Password v-model="password" input-id="login-password" placeholder="請輸入密碼" :feedback="false" toggle-mask class="w-full" input-class="w-full" autocomplete="current-password" />
      </div>

      <div class="text-right">
        <a href="#" class="text-[var(--secondary-text-color)] hover:text-[var(--primary-text-color)] text-sm">忘記密碼？</a>
      </div>

      <Button label="登入" :loading="loading" class="bg-[var(--dark-button)] py-2 border-[var(--dark-button)] rounded w-full text-white" @click="handleLogin" />

      <Divider align="center">
        <span class="text-[var(--secondary-text-color)] text-xs">或</span>
      </Divider>

      <p class="text-[var(--secondary-text-color)] text-sm text-center">
        還沒有帳號？
        <a href="#" class="text-[var(--primary-text-color)] underline">立即註冊</a>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
