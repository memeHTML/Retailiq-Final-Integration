/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '.';

function FormSmoke() {
  const methods = useForm<{ name: string }>({ defaultValues: { name: '' } });

  return (
    <Form {...methods}>
      <form>
        <FormField
          control={methods.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input aria-label="Name field" {...field} />
              </FormControl>
              <FormDescription>Visible helper text</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function NestedFormSmoke() {
  const methods = useForm<{ profile: { name: string } }>({ defaultValues: { profile: { name: '' } } });

  useEffect(() => {
    methods.setError('profile.name', { type: 'manual', message: 'Nested required field' });
  }, [methods]);

  return (
    <Form {...methods}>
      <form>
        <FormField
          control={methods.control}
          name="profile.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile name</FormLabel>
              <FormControl>
                <input aria-label="Profile name field" {...field} />
              </FormControl>
              <FormDescription>Nested helper text</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe('ui primitives smoke', () => {
  it('renders the prompt-mandated primitive surface', () => {
    render(
      <div>
        <Label htmlFor="label-input">Label</Label>
        <input id="label-input" />
        <Checkbox />
        <Switch />
        <Progress value={60} />
        <Textarea aria-label="Notes" />
        <Separator />
        <Avatar>
          <AvatarImage src="https://example.com/avatar.png" alt="avatar" />
          <AvatarFallback>RI</AvatarFallback>
        </Avatar>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Tab content</TabsContent>
        </Tabs>
        <Select>
          <SelectTrigger aria-label="Select trigger">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button">Hover</button>
            </TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">Open popover</button>
          </PopoverTrigger>
          <PopoverContent>Popover text</PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button">Open menu</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription>Dialog body</DialogDescription>
          </DialogContent>
        </Dialog>
        <Sheet open={false} onOpenChange={() => undefined} title="Sheet">
          Sheet body
        </Sheet>
        <AlertDialog open={false}>
          <AlertDialogContent>
            <AlertDialogTitle>Alert</AlertDialogTitle>
            <AlertDialogDescription>Confirm</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
        <FormSmoke />
      </div>,
    );

    expect(screen.getByText('Label')).toBeTruthy();
    expect(screen.getByText('Tab content')).toBeTruthy();
    expect(screen.getByText('Visible helper text')).toBeTruthy();
  });

  it('wires accessibility metadata for nested form fields', async () => {
    render(<NestedFormSmoke />);

    const input = screen.getByLabelText('Profile name field');
    expect(input.getAttribute('aria-describedby')).toContain('description');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Nested required field')).toBeTruthy();
  });
});
