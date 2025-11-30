<script setup>
</script>

<template>
  <section class="relative py-20 overflow-hidden">
    <u-container>
      <div class="relative z-10">
        <!-- Section Header -->
        <header class="text-center mb-12 space-y-4">
          <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4">
            <icon name="tabler:gift" class="w-5 h-5"/>
            Free Trial Session
          </div>
          <h2 class="text-4xl md:text-5xl font-black tracking-tight">
            Book Your Free One-to-One <span class="text-primary">Trial Session</span>
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience personalized Arabic and Qur'anic learning with an expert instructor. No commitment required.
          </p>
        </header>

        <!-- Main Content Card -->
        <div class="max-w-5xl mx-auto">
          <div class="bg-white rounded-3xl overflow-hidden">
            <div class="grid md:grid-cols-2 gap-0">
              <!-- Left Side - What's Included -->
              <div class="p-8 md:p-12 space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div class="space-y-4">
                  <h3 class="text-2xl font-bold text-gray-900">
                    What's Included in Your Trial:
                  </h3>

                  <!-- Feature List -->
                  <ul class="space-y-4">
                    <li class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <icon name="heroicons:check-16-solid" class="w-4 h-4 text-white"/>
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900">
                          30-Minute Live Session
                        </p>
                        <p class="text-sm text-gray-600">
                          One-to-one session with a certified Arabic & Tajweed instructor
                        </p>
                      </div>
                    </li>

                    <li class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <icon name="heroicons:check-16-solid" class="w-4 h-4 text-white"/>
                      </div>

                      <div>
                        <p class="font-semibold text-gray-900">
                          Personalized Assessment
                        </p>
                        <p class="text-sm text-gray-600">
                          Evaluate your current level and create a custom learning plan
                        </p>
                      </div>
                    </li>

                    <li class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <icon name="heroicons:check-16-solid" class="w-4 h-4 text-white"/>
                      </div>

                      <div>
                        <p class="font-semibold text-gray-900">
                          Interactive Learning
                        </p>
                        <p class="text-sm text-gray-600">
                          Experience our teaching methodology with real-time feedback
                        </p>
                      </div>
                    </li>

                    <li class="flex items-start gap-3">
                      <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <icon name="heroicons:check-16-solid" class="w-4 h-4 text-white"/>
                      </div>

                      <div>
                        <p class="font-semibold text-gray-900">
                          Q&A & Guidance
                        </p>
                        <p class="text-sm text-gray-600">
                          Ask questions and get expert advice on your learning journey
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Right Side - CTA -->
              <div
                  class="bg-primary p-8 md:p-12 flex flex-col justify-center text-white relative overflow-hidden">


                <div class="relative z-10 space-y-6">
                  <div class="space-y-3 text-center">
                    <div
                        class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                      <icon name="hugeicons:calendar-03" class="w-10 h-10"/>
                    </div>
                    <p class="text-3xl font-black">
                      Free Trial Session
                    </p>
                    <p class="text-lg font-medium opacity-90">
                      100% Free - No Credit Card
                    </p>
                  </div>

                  <div class="space-y-3 text-sm">
                    <div class="flex items-center gap-2">
                      <icon name="heroicons:check-circle-solid" class="w-5 h-5"/>
                      <span>No payment or commitment required</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <icon name="heroicons:check-circle-solid" class="w-5 h-5"/>
                      <span>Personalized one-to-one attention</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <icon name="heroicons:check-circle-solid" class="w-5 h-5"/>
                      <span>Choose your convenient time</span>
                    </div>
                  </div>

                  <u-button block color="neutral" variant="outline" size="xl" class="cursor-scale group rounded-full py-3 px-6">
                    <duplicate-hover-text> Book Free Session</duplicate-hover-text>
                  </u-button>

                  <p class="text-xs text-white/80 text-center">
                    No credit card required to book your trial session
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </u-container>
  </section>
</template>

<style scoped>
/* Add any custom styles if needed */
</style>
