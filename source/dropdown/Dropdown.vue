<template>
    <keep-alive>
        <div class="bp-dropdown" :class="customClass">
            <button @click="_onToggle"
                    :class="{ 'bp-dropdown__btn--active': !isHidden }"
                    class="bp-dropdown__btn">
                <slot name="btn-text">
                    <span class="bp-dropdown__btn-text">Text</span>
                </slot>
                <svg
                        v-if="isArrow"
                        :class="{ 'bp-dropdown__icon--top': arrowTop, 'bp-dropdown__icon--right': arrowRight, 'bp-dropdown__icon--bottom': arrowBottom, 'bp-dropdown__icon--left': arrowLeft }"
                        class="bp-dropdown__icon"
                        viewBox="0 0 256 512">
                    <path fill="currentColor" d="M119.5 326.9L3.5 209.1c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0L128 287.3l100.4-102.2c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L136.5 327c-4.7 4.6-12.3 4.6-17-.1z"></path>
                </svg>
            </button>
            <transition name="fade">
                <div v-if="!isHidden"
                     :id="generatedId"
                     :style="{ top: `${positionTop}px`, left: `${positionLeft}px` }"
                     class="bp-dropdown__body">
                    <slot name="content">Empty content</slot>
                </div>
            </transition>
        </div>
    </keep-alive>
</template>

<script>
    export default {
        name: 'bp-vuejs-dropdown',

        props: {
            beforeOpen: {
                type: Function,
                required: false,
                default: resolve => resolve()
            },

            isArrow: {
                type: Boolean,
                required: false,
                default: true
            },

            arrowDirection: {
                type: String,
                required: false,
                default: 'bottom'
            },

            customClass: {
                type: String,
                required: false,
                default: ''
            },
        },

        data() {
            return {
                isHidden: true,
                isAppended: false,
                generatedId: undefined,
                positionTop: undefined,
                positionLeft: undefined
            }
        },

        computed: {
            arrowTop() { return this.arrowDirection === 'top' },
            arrowRight() { return this.arrowDirection === 'right' },
            arrowBottom() { return this.arrowDirection === 'bottom' },
            arrowLeft() { return this.arrowDirection === 'left' }
        },

        created() {
            const $root = this.$root;

            // --- hide dropdown on show other dropdowns
            $root.$on('bq-dropdown:toggle', () => this.isHidden = true);

            // --- hide dropdown on document click event
            if (!$root.bqDropdown) {
                $root.bqDropdown = true;

                document.onclick = (e) => {
                    let target = e.target;
                    let dropdown = target.closest('.bp-dropdown__btn') || target.closest('.bp-dropdown__body');

                    if (dropdown) {
                        return;
                    }

                    this.$root.$emit('bq-dropdown:toggle');
                }
            }

            this.generateRandomId();
        },

        methods: {
            // --- generate random id for dropdown body position
            generateRandomId() {
                this.generatedId = `bq-dropdown-${Math.random().toString(36).substr(2, 10)}`;
            },

            _onToggle(e) {
                if (this.isHidden) {
                    // --- reposition for window resize
                    this.isPosition = false;

                    // --- custom callback before open
                    new Promise(this.beforeOpen)
                        .then(() => {
                            // --- hide dropdown on show other dropdowns
                            this.$root.$emit('bq-dropdown:toggle')
                        })
                        .catch(() => { throw Error('bq-dropdown promise error') });
                }

                // --- because we're have promise
                setTimeout(() => {
                    this.isHidden = !this.isHidden;
                    if (!this.isHidden) {
                        // --- because body is not in DOM
                        setTimeout(this.setPosition, 0);
                    }
                });
            },

            setPosition() {
                const button = this.$el.firstElementChild;
                const container = document.getElementById(this.generatedId);

                const windowWidth = innerWidth;
                const windowHeight = innerHeight;

                let coords = this.getBoundingCoords(button);

                let bodyWidth = container.offsetWidth;
                let bodyHeight = container.offsetHeight;

                let currentTop = coords.top + button.offsetHeight;
                let currentLeft = coords.left;

                this.positionTop =
                    // --- if behind bottom
                    ((currentTop + bodyHeight) >= windowHeight) ?
                        (currentTop + pageYOffset - button.offsetHeight - bodyHeight) :
                        (currentTop + pageYOffset);

                this.positionLeft =
                    // --- if behind left
                    ((currentLeft + bodyWidth) >= windowWidth) ?
                        (currentLeft + pageXOffset - bodyWidth + button.offsetWidth) :
                        (currentLeft + pageXOffset);

                // --- if already in body
                if (!this.isAppended) {
                    document.body.appendChild(container);
                    return;
                }

                this.isAppended = true;
            },

            // --- get element coordinates of Window
            getBoundingCoords(element) {
                element = element.getBoundingClientRect();

                return {
                    top: element.top,
                    left: element.left
                };
            }
        }
    }
</script>

<style>
    :root {
        --iconSize: 15px;

        --btnPadding: 3px 5px;
        --btnBorder: 1px solid #efefef;
        --btnBgActive: #eee;

        --bodyPadding: 5px 8px;
        --bodyBg: #fff;
        --bodyBoxShadow: 0 5px 15px -5px rgba(0, 0, 0, .5);
    }

    @define-mixin resetBtn {
        padding: 0;
        background: none;
        border: 0;
        outline: none;
        overflow: visible;
        color: inherit;
        font: inherit;
        line-height: normal;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }

    .bp-dropdown {
        &__btn {
            @mixin resetBtn;

            display: inline-flex;
            align-items: center;
            padding: var(--btnPadding);
            border: var(--btnBorder);
            transition: background-color .1s ease;

            &-text {
                margin-right: 3px;
            }

            &--active {
                background-color: var(--btnBgActive);

                & .bp-dropdown__icon {
                    transform: rotate(-180deg);

                    &--top {
                        transform: rotate(-180deg);
                    }

                    &--top {
                        transform: rotate(0);
                    }

                    &--left {
                        transform: rotate(-90deg);
                    }

                    &--right {
                        transform: rotate(90deg);
                    }
                }
            }
        }

        &__icon {
            display: inline-block;
            width: var(--iconSize);
            height: var(--iconSize);
            overflow: visible;
            transition: transform .1s ease;

            &--bottom {
                transform: rotate(0);
            }

            &--top {
                transform: rotate(-180deg);
            },

            &--left {
                transform: rotate(90deg);
            }

            &--right {
                transform: rotate(-90deg);
            }
        }

        &__body {
            min-width: 100px;
            position: absolute;
            padding: var(--bodyPadding);
            background-color: var(--bodyBg);
            box-shadow: var(--bodyBoxShadow);
        }
    }

    .fade-enter-active, .fade-leave-active { transition: opacity .1s; }
    .fade-enter, .fade-leave-to { opacity: 0; }
</style>