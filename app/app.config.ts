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
                        base: 'py-2.5 px-2 min-h-[42px] text-xs gap-2',
                        leading: 'ps-3',
                        trailing: 'pe-3',
                        leadingIcon: 'size-5',
                        leadingAvatarSize: 'xs',
                        trailingIcon: 'size-5'
                    },
                    xl: {
                        base: 'py-3.5 px-3 min-h-[52px] text-sm gap-2',
                        leading: 'ps-3',
                        trailing: 'pe-3',
                        leadingIcon: 'size-6',
                        leadingAvatarSize: 'xs',
                        trailingIcon: 'size-6'
                    }
                },
            },
        },

        button: {
            base: [
                'cursor-pointer text-black'
            ],
            variants: {
                size: {
                    lg: {
                        base: 'py-2 px-3 min-h-[48px] text-sm gap-2',
                        leadingIcon: 'size-5',
                        trailingIcon: 'size-5',
                    },
                    xl: {
                        base: 'py-3.5 px-3 min-h-[52px] text-sm gap-2',
                        leadingIcon: 'size-5',
                        trailingIcon: 'size-5',
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
                label: 'block font-medium text-default text-xs mb-1',
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
                link: 'text-xs',
                linkLeadingIcon: 'size-4',
                separatorIcon: 'size-4 '
            },
        },


    },
});
