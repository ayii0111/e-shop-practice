<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fab)
</script>

<template>
  <div class="text-center bg-[var(--gray-bg)]">
    <ul class="grid grid-cols-1 gap-8 md:grid-cols-3 p-8">
      <li class="px-6">
        <h5 class="h5 ">
          Carol's Shop
        </h5>
        <p class="p">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Est recusandae fugiat, nemo harum nobis laborum expedita vero repellendus consectetur nostrum.
        </p>
      </li>
      <li>
        <h5 class="h5 ">
          Contact Us
        </h5>
        <ul class="p">
          <li>TEL： 12345678910</li>
          <li>
            Mail： carolshop@mail.com
          </li>
          <li>
            地址： 地球上的某一個角落
          </li>
        </ul>
      </li>
      <li>
        <h5 class="h5 ">
          Follow Us
        </h5>
        <ul>
          <li class="flex justify-center items-center">
            <a class="icon-a " href="">
              <FontAwesomeIcon :icon="['fab', 'facebook-f']" size="xl" />
            </a>
            <a class="icon-a  " href="">
              <FontAwesomeIcon :icon="['fab', 'twitter']" size="xl" />
            </a>
          </li>
          <li class="flex justify-center items-center">
            <a class="icon-a " href="">
              <FontAwesomeIcon :icon="['fab', 'instagram']" size="xl" />
            </a>
            <a class="icon-a " href="">
              <FontAwesomeIcon :icon="['fab', 'line']" size="xl" />
            </a>
          </li>
        </ul>
      </li>
    </ul>
    <div class="border-t py-4">
      ⓒ 2019 Carol's Shop by Carol
    </div>
  </div>
</template>

<style scoped lang="scss">
.h5 {
  @apply mb-5 font-bold text-xl;
}

.p {
  @apply text-[var(--gray-icon)];
}

.icon-a {
  @apply bg-[var(--dark-button)] text-white flex justify-center items-center rounded-full w-10 h-10 mr-1;
}
</style>
