<template>
  <footer
    class="w-full relative text-sm text-white bg-white"
  >
    <wave-top/>


      <u-container class="relative z-10 hidden">
        <div class="newsletters" />
        <div class="mx-auto max-w-xl py-12 md:py-24 ">
          <div class="text-center space-y-2 mb-6">
            <h3 class="text-xl sm:text-2xl md:text-3xl">10% Discount for First Appointment!</h3>
            <p class="text-sm md:text-base">Subscribe to our newsletter</p>
          </div>

          <div class="w-full flex items-center bg-white border border-primary-50/20 rounded-full p-1">
            <u-input class="flex-1 mx-2" type="text" variant="none" placeholder="Enter your email" size="lg" />
            <u-button color="secondary" size="xl" class="shrink-0 rounded-full py-3 px-3 lg:py-4 lg:px-6">
              <span class="hidden md:block">Subscribe Now</span>
              <icon name="hugeicons:mail-send-01" class="block md:hidden w-6 h-6" />
            </u-button>
          </div>
        </div>
      </u-container>




    <div class="bg-black">
      <u-container>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 py-6 md:py-12 rounded-3xl">
          <!-- Left: Logo & social -->
          <div class="flex flex-col gap-4 md:gap-6">
            <p class="opacity-70 leading-relaxed text-xs md:text-sm">
              Medical services are an essential part of our lives, offering care and treatment for various health
              conditions
            </p>
            <div class="flex mt-2 gap-4">
              <a href="#" class="hover:text-secondary-500 transition-colors">
                <icon name="ri:facebook-fill" class="w-4 h-4 md:w-6 md:h-6" />
              </a>
              <a class="hover:text-secondary-500 transition-colors">
                <icon name="ri:twitter-x-fill" class="w-4 h-4 md:w-6 md:h-6" />
              </a>
              <a class="hover:text-secondary-500 transition-colors">
                <icon name="ri:linkedin-box-fill" class="w-4 h-4 md:w-6 md:h-6" />
              </a>
              <a class="hover:text-secondary-500 transition-colors">
                <icon name="ri:instagram-fill" class="w-4 h-4 md:w-6 md:h-6" />
              </a>
            </div>
          </div>

          <!-- Middle 2: Link -->
          <div class="flex flex-col gap-3 mt-6 sm:mt-0">
            <h3 class="text-lg md:text-xl mb-2">Links</h3>
            <ul class="space-y-2 text-xs md:text-sm">
              <li>
                <a href="#" class="hover:text-secondary-500 transition-colors">Terms & Condition</a>
              </li>
              <li>
                <a href="#" class="hover:text-secondary-500 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" class="hover:text-secondary-500 transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" class="hover:text-secondary-500 transition-colors">Terms Of Use</a>
              </li>
            </ul>
          </div>

          <!-- Right: Contact -->
          <div class="flex flex-col gap-4 md:gap-6 mt-6 lg:mt-0">
            <h3 class="text-lg md:text-xl">Contact</h3>
            <div class="flex flex-col space-y-4">
              <!-- Address -->
              <div class="flex items-center gap-3 md:gap-4">
                <div
                  class="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-primary"
                >
                  <icon name="hugeicons:location-06" class="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <div class="opacity-70 text-xs">Address</div>
                  <p class="text-xs md:text-sm">66 Mansoura Egypt</p>
                </div>
              </div>
              <!-- Phone -->
              <div class="flex items-center gap-3 md:gap-4">
                <div
                  class="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-primary"
                >
                  <icon name="hugeicons:call" class="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <div class="opacity-70 text-xs">Emergency</div>
                  <p class="text-xs md:text-sm">012 345 678 9101</p>
                </div>
              </div>
              <!-- Email -->
              <div class="flex items-center gap-3 md:gap-4">
                <div
                  class="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-primary"
                >
                  <icon name="hugeicons:calendar-03" class="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <div class="opacity-70 text-xs">Open Hours</div>
                  <p class="text-xs md:text-sm">Mon - Fri: 8.00 am. - 6.00 pm.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </u-container>
    </div>
    <div class="bg-black ">
      <u-container>
        <div class="py-4 text-center text-xs">
          <p>Copyright 2025 Components Designed By Components. All Rights Reserved</p>
        </div>
      </u-container>
    </div>
  </footer>
</template>

<style>
.newsletters {
     position: absolute;
    top: 0;
    left: 0;
    background-color: #f00;
    transition: all 500ms ease;
    mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 485"><path d="M93.3383 50.2529C66.3045 51.6585 41.1387 60.7949 23.6656 75.5536C6.19249 90.3123 -2.15943 109.444 0.478019 128.654L38.7211 404.697C43.6663 440.539 85.4259 468.182 136.197 469.198L941.937 484.972C988.862 485.909 1030.4 463.653 1042.16 431.403L1166.78 89.5314C1174.91 67.1981 1167.44 43.4592 1146.67 25.7331C1125.9 8.00706 1094.36 -1.51972 1062.05 0.198227L93.3383 50.2529Z" /></svg>');
    mask-repeat: no-repeat;
    mask-position: center center;
    mask-size: cover;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
</style>
<script setup lang="ts">
import WaveTop from "~/components/app/WaveTop.vue";
</script>