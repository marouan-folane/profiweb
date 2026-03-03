"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Checkbox } from "@/components/ui/checkbox";
import SiteLogo from "@/public/images/logo/logo-1.png";
import { useMediaQuery } from "@/hooks/use-media-query";
import Image from "next/image";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(3, { message: "Password must be at least 3 characters" }),
});

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = React.useState("password");
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
  const router = useRouter();

  const togglePasswordType = () => {
    setPasswordType(prev => prev === "text" ? "password" : "text");
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      // default access
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    startTransition(async () => {
      try {
        // Use redirect: false to handle redirect manually
        const response = await signIn("credentials", {
          emailOrUsername: data.email,
          password: data.password,
          redirect: false,
        });

        console.log("Login response:", response);

        if (response?.ok) {
          toast.success("Login Successful");
          reset();

          // Get session to check user role
          const session = await getSession();
          console.log("Session after login:", session);

          // Wait a moment for session to be fully established
          await new Promise(resolve => setTimeout(resolve, 100));

          // Get session again to ensure it's updated
          const updatedSession = await getSession();
          const userRole = updatedSession?.user?.role;

          if (userRole === "superadmin") {
            router.push("/dashboard");
          } else if (
            userRole === "d.s" || userRole === "d.i" || userRole === "d.it" ||
            userRole === "d.c" || userRole === "d.in" || userRole === "d.d" ||
            userRole === "c.m"
          ) {
            router.push("/projects");
          } else {
            // Fallback for any other authenticated role — redirect to projects
            router.push("/projects");
          }

        } else if (response?.error) {
          toast.error(response.error === "CredentialsSignin"
            ? "Invalid email or password"
            : response.error || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="w-full py-10">
      <Link href="/" className="inline-block">
        <Image
          src={SiteLogo}
          className="w-28 h-28 text-primary"
          alt="Site Logo"
          width={112}
          height={112}
        />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Hey, Hello
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">

      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7">
        <div>
          <Label htmlFor="email" className="mb-2 font-medium text-default-600">
            Email
          </Label>
          <Input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            placeholder="Enter your email"
            className={cn("", {
              "border-destructive": errors.email,
            })}
            size={!isDesktop2xl ? "xl" : "lg"}
          />
        </div>
        {errors.email && (
          <div className="text-destructive text-sm mt-1">{errors.email.message}</div>
        )}

        <div className="mt-3.5">
          <Label
            htmlFor="password"
            className="mb-2 font-medium text-default-600"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              disabled={isPending}
              {...register("password")}
              type={passwordType}
              id="password"
              placeholder="Enter your password"
              className={cn("peer", {
                "border-destructive": errors.password,
              })}
              size={!isDesktop2xl ? "xl" : "lg"}
            />

            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
              onClick={togglePasswordType}
              disabled={isPending}
              aria-label={passwordType === "password" ? "Show password" : "Hide password"}
            >
              {passwordType === "password" ? (
                <Icon
                  icon="heroicons:eye"
                  className="w-5 h-5 text-default-400"
                />
              ) : (
                <Icon
                  icon="heroicons:eye-slash"
                  className="w-5 h-5 text-default-400"
                />
              )}
            </button>
          </div>
        </div>
        {errors.password && (
          <div className="text-destructive text-sm mt-1">
            {errors.password.message}
          </div>
        )}

        <div className="mt-5 mb-8 flex flex-wrap gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <Checkbox
              size="sm"
              className="border-default-300 mt-[1px]"
              id="isRemebered"
              disabled={isPending}
            />
            <Label
              htmlFor="isRemebered"
              className="text-sm text-default-600 cursor-pointer whitespace-nowrap"
            >
              Remember me
            </Label>
          </div>

        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          size={!isDesktop2xl ? "lg" : "md"}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Signing in..." : "Sign In"}
        </Button>
      </form>

    </div>
  );
};

export default LogInForm;
