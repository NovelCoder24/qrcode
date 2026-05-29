import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

const ThemeTest = () => {
  return (
    <div className="min-h-screen bg-background p-10 flex flex-col items-center justify-center space-y-8">
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Theme Verification</h1>
        <p className="text-muted-foreground">If colors look correct, the OKLCH theme is working!</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Shadcn Card Component</CardTitle>
          <CardDescription>Testing border radius, background, and muted text.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">This box should be a soft gray/muted color.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            Primary Action
          </Button>
        </CardFooter>
      </Card>

      <div className="flex gap-4 flex-wrap justify-center">
        <Button variant="default">Default (Primary)</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

    </div>
  );
};

export default ThemeTest;
