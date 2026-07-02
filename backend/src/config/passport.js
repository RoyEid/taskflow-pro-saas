import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.model.js";

// Google Strategy
console.log("GOOGLE_CLIENT_ID exists:", Boolean(process.env.GOOGLE_CLIENT_ID));
console.log("GOOGLE_CLIENT_SECRET exists:", Boolean(process.env.GOOGLE_CLIENT_SECRET));
console.log("GOOGLE_CALLBACK_URL exists:", Boolean(process.env.GOOGLE_CALLBACK_URL));

if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const emailRaw = profile.emails && profile.emails[0]?.value;

                    if (!emailRaw) {
                        return done(new Error("No email found from Google"), null);
                    }
                    const email = emailRaw.trim().toLowerCase();

                    // Check if user already exists
                    let user = await User.findOne({ email });

                    if (user) {
                        // Link Google ID if not linked
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            user.isEmailVerified = true;
                            if (profile.photos && profile.photos[0]?.value && !user.avatar) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        name: profile.displayName || "Google User",
                        email: email,
                        avatar: profile.photos && profile.photos[0]?.value,
                        provider: "google",
                        googleId: profile.id,
                        isEmailVerified: true, // OAuth emails are trusted
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
    console.log("[OAuth] Google strategy registered");
} else {
    console.warn("[OAuth] Google OAuth env variables missing.");
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback",
                scope: ["user:email"], // Request email explicitly
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let emailRaw = profile.emails && profile.emails[0]?.value;

                    // GitHub might hide emails, fetch from API
                    if (!emailRaw) {
                        const response = await fetch("https://api.github.com/user/emails", {
                            headers: {
                                Authorization: `token ${accessToken}`,
                                "User-Agent": "TaskFlow-Pro"
                            }
                        });
                        const emails = await response.json();
                        if (emails && emails.length > 0) {
                            const primaryEmail = emails.find(e => e.primary && e.verified);
                            if (primaryEmail) {
                                emailRaw = primaryEmail.email;
                            } else {
                                emailRaw = emails[0].email;
                            }
                        }
                    }

                    if (!emailRaw) {
                        return done(new Error("No public email found from GitHub. Please make your GitHub email public or use another method."), null);
                    }
                    
                    const email = emailRaw.trim().toLowerCase();

                    // Check if user already exists
                    let user = await User.findOne({ email });

                    if (user) {
                        // Link GitHub ID if not linked
                        if (!user.githubId) {
                            user.githubId = profile.id;
                            user.isEmailVerified = true;
                            if (profile.photos && profile.photos[0]?.value && !user.avatar) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        name: profile.displayName || profile.username || "GitHub User",
                        email: email,
                        avatar: profile.photos && profile.photos[0]?.value,
                        provider: "github",
                        githubId: profile.id,
                        isEmailVerified: true, // OAuth emails are trusted
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
} else {
    console.warn("⚠️ WARNING: GitHub OAuth env variables missing.");
}

export default passport;
