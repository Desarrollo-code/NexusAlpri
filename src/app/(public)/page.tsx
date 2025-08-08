// src/app/(public)/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, UserCircle, LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LandingPage() {
  return (
      <div className="flex-1 w-full">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-grainy-gradient">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-7xl/none font-headline text-foreground">
                    Learn from
                    <br />
                    <span className="text-primary">your home.</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" variant="outline">
                    <Link
                      href="/about"
                    >
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Card className="w-full max-w-md border-2 border-foreground/80 shadow-2xl">
                    <CardHeader className="text-left">
                        <p className="font-semibold text-muted-foreground">No account yet?</p>
                        <CardTitle className="text-3xl font-bold font-headline">
                            Create your <br />
                            <span className="text-primary">account today!</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-landing" className="sr-only">Email</Label>
                                 <Input id="email-landing" type="email" placeholder="Type a valid email..." required className="bg-muted"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-landing" className="sr-only">Password</Label>
                                <Input id="password-landing" type="password" placeholder="Type a strong password..." required className="bg-muted"/>
                            </div>
                            <Button type="submit" className="w-full" size="lg">
                                Register Account
                            </Button>
                        </form>
                    </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}
