export default defineAppConfig({
    ui: {
        colors: {
            primary: 'tickle-me-pink',
            secondary: 'buttercup',
            neutral: 'neutral',
        },

        container: {
            base: 'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8',
        },


        input: {
            variants: {
                size: {
                    lg: {
                        base: 'py-3 px-3 min-h-[48px] text-sm gap-2',
                        leading: 'ps-4',
                        trailing: 'pe-4',
                        leadingIcon: 'size-6',
                        leadingAvatarSize: 'xs',
                        trailingIcon: 'size-6'
                    },
                    xl: {
                        base: 'py-4 px-4 min-h-[56px] text-base gap-2',
                        leading: 'ps-4',
                        trailing: 'pe-4',
                        leadingIcon: 'size-7',
                        leadingAvatarSize: 'xs',
                        trailingIcon: 'size-7'
                    }
                },
            },
        },

        button: {
            base: [
                'cursor-pointer text-black font-medium'
            ],
            variants: {
                size: {
                    lg: {
                        base: 'py-3 px-4 min-h-[52px] text-base gap-2',
                        leadingIcon: 'size-6',
                        trailingIcon: 'size-6',
                    },
                    xl: {
                        base: 'py-4 px-5 min-h-[60px] text-base gap-2',
                        leadingIcon: 'size-6',
                        trailingIcon: 'size-6',
                    }
                },

            },
        },

        dropdownMenu: {
            slots: {
                content: 'font-primary',
            },
        },

        modal: {
            slots: {
                content: 'divide-y-0 ',
                overlay: 'bg-secondary/75',
            }
        },

        tabs: {
            variants: {
                size: {
                    xl: {
                        trigger: 'px-3 py-4 text-xs gap-2',
                        leadingIcon: 'size-4',
                        leadingAvatarSize: 'xs'
                    }
                }
            },
        },

        formField: {
            slots: {
                label: 'block font-medium text-default text-sm mb-2',
            }
        },

        avatar: {
            variants: {
                size: {
                    '3xl': {
                        root: 'size-14 text-2xl'
                    }
                }
            },
            defaultVariants: {
                size: 'md'
            }
        },

        breadcrumb: {
            slots: {
                link: 'text-sm font-medium',
                linkLeadingIcon: 'size-5',
                separatorIcon: 'size-5'
            },
        },

        skeleton: {
            base: 'bg-white animate-pulse',
            background: 'bg-white',
        },

        card: {
            base: 'shadow-none',
            ring: 'ring-0',
            rounded: 'rounded-xl',
            body: {
                base: 'p-6',
                padding: 'p-6 sm:p-6'
            },
            header: {
                base: 'p-6',
                padding: 'px-6 py-5 sm:px-6'
            },
            footer: {
                base: 'p-6',
                padding: 'px-6 py-5 sm:px-6'
            }
        },


    },
});
