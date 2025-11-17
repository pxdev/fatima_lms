export default defineOAuthGoogleEventHandler({
  config: {
    scope: ["email", "profile"]
  },

  async onSuccess (event, { user }) {
      console.log("user info from google", user)

    return handleOAuth(event, {
      id: user.sub,
      name: user.name,
      email: user.email
    }, "google");
  }

});
