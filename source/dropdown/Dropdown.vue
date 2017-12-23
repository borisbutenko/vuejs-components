<template>
    <keep-alive>
        <div class="bp-dropdown">
            <button @click="_onToggle"
                    :class="{ 'bp-dropdown__btn--active': !isHidden }"
                    class="bp-dropdown__btn">
                <slot name="btn-text">
                    <span class="bp-dropdown__btn-text">Text</span>
                </slot>
                <svg v-if="arrowBtn" class="bp-dropdown__icon" viewBox="0 0 256 512">
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

            arrowBtn: {
                type: Boolean,
                required: false,
                default: true
            },

            arrowSublist: {
                type: Boolean,
                required: false,
                default: true
            }
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

        created() {
            const $root = this.$root;

            // --- hide dropdown on show other dropdowns
            $root.$on('bq-dropdown:toggle', () => this.isHidden = true);

            // --- hide dropdown on document click event
            if (!$root.bqDropdown) {
                $root.bqDropdown = true;

                document.addEventListener('click', (e) => {
                    let target = e.target;
                    let dropdown = target.closest('.bp-dropdown__btn') || target.closest('.bp-dropdown__body');

                    if (dropdown) {
                        return;
                    }

                    this.$root.$emit('bq-dropdown:toggle');
                }, false);
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

                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let coords = this.getCoords(button);

                let bodyWidth = container.offsetWidth;
                let bodyHeight = container.offsetHeight;

                this.positionTop =
                    // --- if behind bottom
                    ((coords.top + bodyHeight) >= windowHeight) ?
                        (coords.top - button.offsetHeight) :
                        (coords.top + button.offsetHeight);

                this.positionLeft =
                    // --- if behind left
                    ((coords.left + bodyWidth) >= windowWidth) ?
                        (coords.left - bodyWidth + button.offsetWidth) :
                        coords.left;

                // --- if already in body
                if (!this.isAppended) {
                    document.body.appendChild(container);
                    return;
                }

                this.isAppended = true;
            },

            // --- get element coordinates
            getCoords(element) {
                element = element.getBoundingClientRect();

                return {
                    top: parseInt(element.top + pageYOffset, 10),
                    left: parseInt(element.left + pageXOffset, 10)
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
                }
            }
        }

        &__icon {
            display: inline-block;
            width: var(--iconSize);
            height: var(--iconSize);
            overflow: visible;
            transition: transform .1s ease;
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