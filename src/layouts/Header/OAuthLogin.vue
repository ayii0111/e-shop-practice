<script setup lang="ts">
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth, useSession } from 'vue-clerk'
import { Button, Toast, useToast } from 'primevue'
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import to from 'await-to-js'
import { auth } from '@services/firebase'

const { isSignedIn } = useSession()
const isLogin = ref(false)
const user = ref<User | null>(null)
const toast = useToast()

// 用來驗證 firebase 是否是登入狀態
function verify() {
  if (isLogin.value && user.value) {
    toast.add({
      severity: 'success',
      summary: `驗證當前狀態：已登入\n帳號: ${user.value.email}\nUID: ${user.value.uid}`,
      life: 6000,
    })
    console.log('user.value', user.value)
    return 'exit'
  }
  toast.add({
    severity: 'error',
    summary: `驗證當前狀態：尚未登入`,
    life: 6000,
  })
}

watch(isSignedIn, (n, o) => {
  if (n) { return 'exit' }
  signOut(auth).then(() => {
    console.log('已登出')
  }).catch((error) => {
    console.log('登出失敗', error.message)
  })
})

// 驗證當前登入狀態
const token = ref<string | undefined | null>('')
onMounted(async () => {
  onAuthStateChanged(auth, (_user) => {
    if (_user) {
      isLogin.value = true
      user.value = _user
    }
    else {
      isLogin.value = false
      user.value = null
    }
  })
  const { getToken } = useAuth()
  token.value = await getToken.value({ template: 'integration_firebase' }) || ''
  console.log('token:', token.value)

  // 將 token 帶入 Firebase 的 signInWithCustomToken() 函式中來登入
  const [error, userCredentials] = await to(signInWithCustomToken(auth, token.value))
  // userCredentials.user 就相當於 auth.user
  console.log('User:', userCredentials?.user)
})
</script>

<template>
  <div class="">
    <Toast />
    <SignedOut>
      <!-- as-child 若不使用會有 button 的元素包裹 -->
      <!-- cursor: pointer; 讓鼠標變為手指 -->
      <SignInButton v-slot="props" mode="modal" as-child>
        <slot :props>
          <a v-bind="props" style="cursor: pointer;">
            <i class="pi pi-user"></i>
          </a>
        </slot>
      </SignInButton>
    </SignedOut>
    <SignedIn>
      <span class="flex justify-center size-5">
        <UserButton />
      </span>
    </SignedIn>

    <!-- <Button severity="secondary" class="block mt-4 p-0.5 w-52" @click="verify">
      驗證 Firebase 登入狀態
    </Button><br /> -->
  </div>
</template>

<style scoped lang="scss"></style>
