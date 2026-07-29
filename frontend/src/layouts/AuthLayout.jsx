import { Link } from "react-router";
import { motion } from "motion/react";
import BrandLogo from "../components/ui/BrandLogo";
import AppBackground from "../components/ui3d/AppBackground";
import Surface from "../components/ui3d/Surface";
import { easeOut } from "../components/ui3d/motionTokens";

/* Shared shell for sign-in, sign-up, verification, and password reset.

   The card deliberately does not tilt on pointer move — rotating a panel
   while someone types into it is distracting. Depth here comes from
   elevation, the gradient hairline, and the entrance. */
function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-y-auto tf-bg-app px-5 py-12 sm:px-8">
      <AppBackground variant="marketing" />

      <div className="relative z-10 my-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
          className="mb-7 flex flex-col items-center text-center sm:mb-8"
        >
          <Link to="/" className="group flex flex-col items-center">
            <motion.span
              whileHover={{ y: -3, rotate: -2 }}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
              className="flex items-center justify-center"
            >
              <BrandLogo size="auth" />
            </motion.span>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight tf-text sm:mt-6 sm:text-[32px]">
              {title}
            </h1>
          </Link>

          {subtitle && (
            <p className="mt-2.5 text-[15px] tf-text-muted">
              {subtitle}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...easeOut, delay: 0.08 }}
        >
          <Surface elevation={4} rounded="rounded-3xl" className="overflow-hidden p-5 sm:p-9">
            {children}
          </Surface>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
