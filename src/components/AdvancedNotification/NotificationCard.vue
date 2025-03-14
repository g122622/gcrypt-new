<!-- SPDX-License-Identifier: GPL-3.0-or-later
License: GNU GPLv3 or later. See the license file in the project root for more information.
Copyright © 2021 - present Aleksey Hoffman. All rights reserved.
-->

<template>
    <div class="notification__item" :data-hashID="notification.hashID" :data-type="notification.type"
        :is-hidden="notification.isHidden" @mouseover="pauseNotificationTimer(notification)"
        @mouseleave="resetNotificationTimer(notification)">
        <v-progress-linear v-show="notification.timeout !== 0 && !notification.isHidden" v-model="percentsCounter"
            :color="notification.timeoutProgressColor || 'blue-grey'" height="2" />

        <div class="notification__item__content">
            <div class="notification__item__content__main">
                <div class="notification__item__content__main__header">
                    <div v-if="notification.colorStatus !== ''" class="notification__item__color-indicator"
                        :color="notification.colorStatus" size="18px" />

                    <div v-show="notification.icon" class="notification__item__icon">
                        <v-icon size="20px">
                            {{ notification.icon }}
                        </v-icon>
                    </div>

                    <div v-if="notification.loader" class="notification__item__loader">
                        <v-progress-circular v-if="notification.loader" indeterminate size="20" width="2"
                            :background-color="this.$utils.getCSSVar('--bg-color-2')"
                            :color="this.$utils.getCSSVar('--highlight-color-1')" />
                    </div>

                    <div v-if="notification.title" class="notification__item__title"
                        :colorStatus="notification.colorStatus" v-html="notification.title" />

                    <v-spacer />

                    <!-- button:hide-notification -->
                    <v-tooltip v-if="!notification.isHidden" top>
                        <template #activator="{ on }">
                            <v-btn v-show="notification.closeButton" icon size="small" color="rgba(0,0,0,0)"
                                :border="false" v-bind="on"
                                @click="this.$emitter.emit('HIDE_NOTIFICATION', notification)">
                                <div class="notification__item__icon--close">
                                    <v-icon>mdi-close</v-icon>
                                </div>
                            </v-btn>
                        </template>
                        <span>Hide notification</span>
                    </v-tooltip>

                    <!-- button:remove-notification -->
                    <v-tooltip v-if="notification.isHidden && notification.isStatic" top>
                        <template #activator="{ on }">
                            <v-btn v-show="notification.closeButton" icon size="small" color="rgba(0,0,0,0)"
                                :border="false" v-bind="on"
                                @click="this.$emitter.emit('REMOVE_NOTIFICATION', notification)">
                                <div class="notification__item__icon--close">
                                    <v-icon>mdi-trash-can-outline</v-icon>
                                </div>
                            </v-btn>
                        </template>
                        <span>Remove notification</span>
                    </v-tooltip>
                </div>

                <div v-if="notification.message" class="notification__item__message" v-html="notification.message" />

                <div v-if="notification.content" class="notification__item__message-content">
                    <div v-for="(contentItem, index) in notification.content" :key="'notification-content-' + index">
                        <div v-if="contentItem.type === 'html'" class="dialog-card__html" v-html="contentItem.value" />

                        <div v-if="contentItem.type === 'list'"
                            class="notification__item__message-content__list custom-scrollbar">
                            <div v-for="(listItem, index) in contentItem.value"
                                :key="'notification-content-list-item' + index">
                                {{ listItem }}
                            </div>
                        </div>

                        <div v-if="contentItem.type === 'action-list'"
                            class="notification__item__message-content__action-list custom-scrollbar">
                            <div v-for="(listItem, index) in contentItem.value"
                                :key="'notification-content-list-item' + index"
                                class="notification__item__message-content__action-list-item">
                                <div class="notification__item__message-content__action-list-item-text">
                                    <v-icon class="notification__item__message-content__action-list-item-icon"
                                        size="20px">
                                        {{ listItem.type.icon }}
                                    </v-icon>
                                    {{ listItem.command }}
                                </div>
                                <v-btn :key="'notification-content-list-item-button' + index" class="button-1" small
                                    @click="listItem.onClick()">
                                    run
                                </v-btn>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="notification.actionButtons && notification.actionButtons.length !== 0"
                class="notification__actions">
                <v-tooltip v-for="(button, index) in notification.actionButtons" :key="`notification-button-${index}`"
                    :disabled="!(button.extrnalLink || button.tooltip)" bottom offset-overflow>
                    <template #activator="{ on }">
                        <v-btn class="button-1 mr-3" small depressed v-bind="on"
                            @click="handleNotificationButtonOnClickEvent(notification, button)">
                            {{ button.title }}
                        </v-btn>
                    </template>
                    <span>
                        <div v-show="button.extrnalLink">
                            <div class="tooltip__description">
                                <v-layout align-center>
                                    <v-icon class="mr-3" size="16px">
                                        mdi-open-in-new
                                    </v-icon>
                                    {{ button.extrnalLink }}
                                </v-layout>
                            </div>
                        </div>
                        <div v-show="button.tooltip">
                            <div class="tooltip__description">
                                {{ button.tooltip }}
                            </div>
                        </div>
                    </span>
                </v-tooltip>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mapStores } from 'pinia'
import { useMainStore } from "@/store/main"

export default {
    props: {
        notification: {
            type: Object,
            default: () => ({
                progress: 0,
                content: {
                    type: '', // 'html' | 'list'
                },
            }),
        },
        location: String,
        scheduleNotificationForRemoval: Function,
    },
    data() {
        return {
            percentsCounter: this.notification.timeoutData.percentsCounter
        }
    },
    mounted() {
        let foo = setInterval(() => {
            if (this.percentsCounter >= 100) {
                clearInterval(foo)
            }
            this.percentsCounter = this.notification.timeoutData.percentsCounter
        }, 100)
    },
    computed: {
        ...mapStores(useMainStore),
        notifications() {
            return this.mainStore.notifications
        },
        showProgressBar() {
            return this.notification.progress.started &&
                this.notification.progress.percentDone > 0 &&
                !this.notification.progress.isDone
        }
    },
    methods: {
        resetNotificationTimer(notification) {
            if (this.location === 'screen') {
                this.scheduleNotificationForRemoval(notification)
            }
        },
        pauseNotificationTimer(notification) {
            if (this.location === 'screen') {
                this.$emitter.emit('RESET_NOTIFICATION_TIMERS', notification)
                notification.timeoutData.ongoingTimeout.clear()
                clearInterval(notification.timeoutData.secondsCounterInterval)
                clearInterval(notification.timeoutData.percentsCounterInterval)
            }
        },
        handleNotificationButtonOnClickEvent(notification, button) {
            try {
                if (button.onClick) {
                    button.onClick()
                    if (button.closesNotification) {
                        this.$emitter.emit('HIDE_NOTIFICATION', notification)
                    }
                }
            } catch (error) {
                throw Error(error)
            }
        },
    },
}
</script>

<style scoped>
.v-progress-linear__determinate {
    transition: all 0.1s cubic-bezier(1, 1, 0.5, 0.5) !important;
}

.notification__item {
    overflow: hidden;
    margin-bottom: 8px;
    border-radius: 15px;
    background-color: var(--bg-color-1);
    transition: all 0.5s;
    box-shadow: var(--shadow-x4_hover);
}

@media (min-width: 600px) {
    .notification__item {
        width: 100%;
    }
}

@media (max-width: 599px) and (min-width: 400px) {
    .notification__item {
        width: 300px;
    }
}

@media (max-width: 399px)  {
    .notification__item {
        width: 200px;
    }
}

.notification__item[is-hidden=“true”] {
    margin-bottom: 0;
    border-radius: 0;
    border-bottom: 1px solid var(--divider-color-1);
    box-shadow: none;
}

.notification__item__content {
    display: grid;
    grid-template-columns: 1fr;
    padding: 12px 16px 12px 16px;
}

.notification__item__content__main__header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.notification__item__color-indicator {
    position: relative;
    height: 6px;
    width: 6px;
    margin-right: 10px;
    border-radius: 50%;
}

.notification__item__color-indicator[color="blue"] {
    background-color: rgb(54, 129, 179);
    box-shadow: 0 0 8px rgb(54, 129, 179);
}

.notification__item__color-indicator[color="green"] {
    background-color: #0e9674;
    box-shadow: 0 0 8px #0e9674;
}

.notification__item__color-indicator[color="red"] {
    background-color: #e53935;
    box-shadow: 0 0 8px #e53935;
}

.notification__item__color-indicator[color="yellow"] {
    background-color: #e5bf35;
    box-shadow: 0 0 8px #e5bf35;
}

.notification__item__loader {
    margin-right: 10px;
}

.notification__item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
}

.notification__item__icon .v-icon,
.notification__item__icon--close .v-icon {
    color: #bdbdbd;
}

.notification__item__title {
    color: #bdbdbd;
    font-size: 16px;
}

.notification__item__message {
    margin-bottom: 8px;
    color: #9e9e9e;
    font-size: 14px;
}

.notification__item__message-content__list {
    max-height: 100px;
    margin: 12px 0;
    padding: 8px 12px;
    border-radius: 4px;
    background-color: rgba(var(--bg-color-2-value), 0.5);
}

.notification__item__message-content__action-list {
    max-height: 100px;
    margin: 12px 0;
}

.notification__item__message-content__action-list-item {
    border-bottom: 1px solid var(--divider-color-2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
}

.notification__item__message-content__action-list-item-text {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
}

.notification__item__message-content__action-list-item-icon {
    margin-right: 8px;
}

.notification__item__progress__filename {
    font-size: 14px;
}

.notification__item__progress__content {
    display: grid;
    grid-auto-flow: column;
    column-gap: 12px;
    font-size: 14px;
}

.notification__actions {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
</style>
