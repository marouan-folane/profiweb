"use client";
import { Fragment } from "react";
import LogInForm from "@/components/auth/login-form";

const LoginPage = () => {
  return (
    <Fragment>
      <div className="min-h-screen bg-mist-50 dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-[500px] relative z-10">
          <div className="bg-card backdrop-blur-md border border-border shadow-2xl rounded-3xl overflow-hidden px-8 pb-8 pt-0 md:p-12 transition-all">
            <div className="text-center">
              <LogInForm />
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Hello Website. All rights reserved.
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default LoginPage;
