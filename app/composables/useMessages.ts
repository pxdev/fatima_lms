export const useMessages = () => {
  const { t } = useI18n()
  const toast = useToast()

  const showMessage = (message: string, type: "success" | "error") => {
    toast.add({
      title: t(type === "success" ? "messages.notification" : "messages.error"),
      icon: type === "success" ? "heroicons:check-circle-20-solid" : "heroicons:exclamation-circle-20-solid",
      description: t(message),
      color: type === "success" ? "success" : "error",
    })
  }

  return {
    showMessage,
  }
}
