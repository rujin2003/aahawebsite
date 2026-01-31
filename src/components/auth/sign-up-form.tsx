"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { formatAddress, validateAddress, type AddressParts } from "@/lib/address";

const emptyAddress: AddressParts = {
  street: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
};

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressParts>({ ...emptyAddress });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const addressValidation = validateAddress(address);
    if (!addressValidation.ok) {
      toast.error(addressValidation.message);
      return;
    }
    setIsLoading(true);

    try {
      console.log('Starting registration process...');
      const addressString = formatAddress(address);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });

      console.log('Auth response:', { authData, signUpError });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        console.error('No user data returned from sign up');
        throw new Error('Registration failed - no user data returned');
      }

      console.log('User created successfully, creating profile...');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            email: email,
            username: username,
            phone: phone,
            address: addressString,
          },
        ])
        .select()
        .single();

      console.log('Profile creation response:', { profileData, profileError });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      if (!profileData) {
        console.error('No profile data returned after creation');
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Profile creation failed - no data returned');
      }

      // Save first address to addresses table if available
      try {
        const { insertAddress } = await import('@/lib/addresses');
        await insertAddress(supabase, authData.user.id, address, { setDefault: true });
      } catch (addrErr) {
        console.warn('Could not save address to addresses table:', addrErr);
      }

      console.log('Registration completed successfully');
      toast.success("Account created! Please check your email to verify your account.");
      const redirect = redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
      router.push(`/verify-email${redirect}`);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        toast.error(`Registration failed: ${error.message}`);
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mt-20 max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-gray-500">Enter your information to create an account</p>
      </div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <div className="space-y-2">
            <Input
              placeholder="Street address"
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                required
              />
              <Input
                placeholder="State / Province"
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Country"
                value={address.country}
                onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                required
              />
              <Input
                placeholder="ZIP / Postal code"
                value={address.zipCode}
                onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
} 