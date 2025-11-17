//
//
// export const handleOAuth = async (
//   event: H3Event,
//   userOptions: { id: string; email: string; name: string },
//   provider: string
// ) => {
//   const { id: providerId, email, name } = userOptions || {};
//   const DB = useDB();
//   const timestamp = now();
//   const session = await getUserSession(event);
//
//   const USER_SELECT = {
//     id: true,
//     name: true,
//     username: true,
//     role: true,
//     email: true,
//     birthday: true,
//     country: true,
//     aboutMe: true,
//     createdAt: true,
//     updatedAt: true
//   };
//
//   /** ──────────────────────────────
//    *  Helper Queries
//    *  ────────────────────────────── */
//   const findConnection = (providerIdArg: string, providerArg: string) =>
//     DB.socialConnection.findFirst({
//       where: {
//         providerId: providerIdArg,
//         provider: providerArg
//       },
//       select: {
//         id: true,
//         userId: true
//       }
//     });
//
//   const findUserByEmail = (emailArg: string) =>
//     DB.user.findUnique({
//       where: { email: emailArg },
//       select: USER_SELECT
//     });
//
//   const findUserById = (userId: number) =>
//     DB.user.findUnique({
//       where: { id: userId },
//       select: USER_SELECT
//     });
//
//   /** ──────────────────────────────
//    *  Main Logic
//    *  ────────────────────────────── */
//   try {
//     // ─────────────── No active session (Login or Register)
//     if (!session?.user) {
//       if (!userOptions) {
//         return sendRedirect(event, "/login?error=signin_auth_error");
//       }
//
//       let authUser = null;
//       const connection = providerId ? await findConnection(providerId, provider) : null;
//
//       if (!connection?.userId) {
//         authUser = email ? await findUserByEmail(email) : null;
//
//         // Email already used by another user
//         if (!connection && authUser && email === authUser.email) {
//           return sendRedirect(event, "/login?error=email_already_registered");
//         }
//
//         // Create a new user if not found
//         if (!authUser?.id) {
//           if (!email) {
//             return sendRedirect(event, "/login?error=signin_auth_error");
//           }
//
//           authUser = await DB.user.create({
//             data: {
//               email,
//               name,
//               createdAt: timestamp,
//               updatedAt: timestamp
//             },
//             select: USER_SELECT
//           });
//
//           if (!authUser?.id) {
//             return sendRedirect(event, "/login?error=signin_auth_error");
//           }
//
//           if (providerId) {
//             const createdConnection = await createConnection(authUser.id, provider, providerId);
//             if (!createdConnection?.provider) {
//               console.info(`${provider} connection failed to save`);
//             }
//           }
//         }
//       }
//
//       // If there was a connection, get the associated user
//       if (!authUser && connection?.userId) {
//         authUser = await findUserById(Number(connection.userId));
//       }
//
//       if (!authUser) {
//         return sendRedirect(event, "/login?error=signin_auth_error");
//       }
//
//       const normalizedUser = normalizeBigInt(authUser);
//       const { secure } = useRuntimeConfig(event);
//       const userHash = await hash(String(normalizedUser.id), secure.salt);
//
//       await setUserSession(event, {
//         user: {
//           ...normalizedUser,
//           hash: userHash,
//           isAdmin: normalizedUser.role === "admin"
//         }
//       });
//
//       return sendRedirect(event, "/account/callback");
//     }
//
//     // ─────────────── Active session (Attach or Validate Connection)
//     if (!providerId) {
//       return sendRedirect(event, "/account/callback");
//     }
//
//     const connection = await findConnection(providerId, provider);
//
//     // Connection exists but belongs to another user
//     if (connection && connection.userId !== session.user.id) {
//       return sendRedirect(
//         event,
//         `/u/${session.user.username}/settings?error=connection_already_exists&provider=${provider}`
//       );
//     }
//
//     // Create a connection if not found
//     if (!connection?.userId) {
//       const createdConnection = await createConnection(session.user.id, provider, providerId);
//       if (!createdConnection?.provider) {
//         console.info(`${provider} connection failed to save`);
//       }
//     }
//
//     const { secure } = useRuntimeConfig(event);
//     const userHash = await hash(String(session.user.id), secure.salt);
//
//     await setUserSession(event, {
//       user: {
//         ...session.user,
//         hash: userHash,
//         isAdmin: session.user?.role === "admin"
//       }
//     });
//
//     return sendRedirect(event, `/account/callback`);
//   } catch (error) {
//     console.error(error);
//     await clearUserSession(event);
//     return sendRedirect(event, "/login?error=signin_auth_error");
//   }
// };
