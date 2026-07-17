<template>
  <Teleport to="body">
    <div class="win11-notify-container">
      <TransitionGroup name="notify">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="win11-notify"
          :class="[`win11-notify--${notification.type}`, { 'win11-notify--leave': !notification.visible }]"
        >
          <div class="win11-notify-icon">
            <svg v-if="notification.type === 'success'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="notification.type === 'error'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else-if="notification.type === 'warning'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="win11-notify-message">{{ notification.message }}</span>
          <button class="win11-notify-close" @click="remove(notification.id)">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import notify from './notify'

const { notifications, remove } = notify
</script>

<style scoped>
.win11-notify-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
}

.win11-notify {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--win11-surface);
  border: 1px solid var(--win11-border);
  border-radius: 10px;
  box-shadow: var(--win11-shadow-notify);
}

.win11-notify--success {
  border-left: 3px solid #107c10;
}

.win11-notify--error {
  border-left: 3px solid #d13438;
}

.win11-notify--warning {
  border-left: 3px solid #ff8c00;
}

.win11-notify--info {
  border-left: 3px solid #0078d4;
}

.win11-notify-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.win11-notify--success .win11-notify-icon {
  color: #107c10;
}

.win11-notify--error .win11-notify-icon {
  color: #d13438;
}

.win11-notify--warning .win11-notify-icon {
  color: #ff8c00;
}

.win11-notify--info .win11-notify-icon {
  color: #0078d4;
}

.win11-notify-message {
  flex: 1;
  font-size: var(--type-body);
  color: var(--win11-text);
  line-height: 1.5;
}

.win11-notify-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--win11-icon);
  cursor: pointer;
  transition: all 0.15s;
}

.win11-notify-close:hover {
  background: var(--win11-control-hover-bg);
  color: var(--win11-text);
}

.notify-enter-active {
  animation: notify-slide-in 0.3s ease;
}

.notify-leave-active {
  animation: notify-slide-out 0.3s ease;
}

@keyframes notify-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes notify-slide-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
