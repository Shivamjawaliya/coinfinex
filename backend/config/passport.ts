import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleid: profile.id });

        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ username: email });
          }

          if (user) {
            user.googleid = profile.id;
            user.avatar = profile.photos?.[0]?.value || "";
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              username: profile.emails?.[0]?.value || profile.id,
              googleid: profile.id,
              avatar: profile.photos?.[0]?.value || "",
              password: "",
            });
          }
        }

        return done(null, user as unknown as Express.User);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

// ── Add these ────────────────────────────────────
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user as unknown as Express.User);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
