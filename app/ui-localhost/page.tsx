"use client"

import { useMemo, useRef, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  FolderIcon,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Label,
  PixelatedImage,
  RandomizedLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  StudioFrame,
  Textarea,
  UiLocalhostFolderTile,
} from "@/ui.localhost"

const folderTiles = [
  { label: "#APPS", color: "silver" },
  { label: "#SITES", color: "graphite" },
  { label: "#LABS", color: "red" },
  { label: "#BRANDING", color: "blue" },
  { label: "#TOOLS", color: "yellow" },
  { label: "#START", color: "purple" },
] as const

const frameworks = ["Next.js", "React", "Tailwind", "Motion", "TypeScript", "Vercel"]

export default function UiHostPage() {
  const [query, setQuery] = useState("https://")
  const [scrambleKey, setScrambleKey] = useState(0)
  const comboboxItems = useMemo(() => frameworks, [])
  const comboboxAnchor = useRef<HTMLDivElement>(null)

  return (
    <StudioFrame
      navOverride="home"
      backgroundColor="#050505"
      headerTone="light"
      headerClassName="px-4 md:px-6"
      navClassName="bg-black/45 md:bg-transparent"
    >
      <main className="h-full overflow-auto px-4 pb-12 pt-24 text-white md:px-6 md:pt-28">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          <section className="rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_top,_#1b1b1b_0%,_#0f0f0f_42%,_#060606_100%)] px-5 py-10 md:px-8 md:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white">UI Localhost</Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
                The Foundation for Your Studio System
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-lg">
                A live catalog of reusable components from your site: forms, command patterns,
                folder tiles, text scramble effect, and interaction primitives.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button>Get Started</Button>
                <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                  View Components
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-12">
            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Payment Method</CardTitle>
                <CardDescription className="text-white/55">All transactions are secure and encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel>
                      <FieldTitle className="text-white">Name on card</FieldTitle>
                    </FieldLabel>
                    <Input className="border-white/15 bg-white/6 text-white placeholder:text-white/40" placeholder="John Doe" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>
                        <FieldTitle className="text-white">Card number</FieldTitle>
                      </FieldLabel>
                      <Input className="border-white/15 bg-white/6 text-white placeholder:text-white/40" placeholder="1234 5678 9012 3456" />
                    </Field>
                    <Field>
                      <FieldLabel>
                        <FieldTitle className="text-white">CVV</FieldTitle>
                      </FieldLabel>
                      <Input className="border-white/15 bg-white/6 text-white placeholder:text-white/40" placeholder="123" />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Text Effect</CardTitle>
                <CardDescription className="text-white/55">Randomized label is now a reusable component.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-full min-h-52 flex-col items-center justify-center gap-4">
                <FolderIcon color="graphite" className="h-[76px] w-[92px]" />
                <button
                  type="button"
                  onMouseEnter={() => setScrambleKey((value) => value + 1)}
                  onFocus={() => setScrambleKey((value) => value + 1)}
                  className="rounded-sm px-2 py-1"
                >
                  <RandomizedLabel
                    text="#NO TEAM MEMBERS"
                    className="font-mono text-[15px] tracking-[0.02em] text-white"
                    triggerKey={scrambleKey}
                  />
                </button>
                <Button variant="outline" className="border-white/22 bg-white/8 text-white">Invite Members</Button>
              </CardContent>
            </Card>

            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Command + Input Group</CardTitle>
                <CardDescription className="text-white/55">Search and action controls in studio style.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InputGroup className="h-9 border-white/15 bg-white/6">
                  <InputGroupAddon>
                    <InputGroupText className="text-white/45">@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="text-white placeholder:text-white/35"
                    placeholder="Ask anything..."
                  />
                </InputGroup>
                <Input className="border-white/15 bg-white/6 text-white placeholder:text-white/40" placeholder="https://" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/20 bg-white/4 text-white">Syncing</Badge>
                  <Badge variant="outline" className="border-white/20 bg-white/4 text-white">Updating</Badge>
                  <Badge variant="outline" className="border-white/20 bg-white/4 text-white">Loading</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Select + Combobox</CardTitle>
                <CardDescription className="text-white/55">Controlled option inputs for settings screens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select>
                  <SelectTrigger className="w-full border-white/15 bg-white/6 text-white">
                    <SelectValue placeholder="Choose tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                  </SelectContent>
                </Select>

                <Combobox items={comboboxItems}>
                  <div ref={comboboxAnchor}>
                    <ComboboxInput placeholder="Search framework" showClear showTrigger />
                  </div>
                  <ComboboxContent anchor={comboboxAnchor}>
                    <ComboboxEmpty>No results.</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </CardContent>
            </Card>

            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Menu + Dialog</CardTitle>
                <CardDescription className="text-white/55">Context actions and destructive confirmations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" className="border-white/25 bg-white/6 text-white">Open menu</Button>} />
                  <DropdownMenuContent className="w-52">
                    <DropdownMenuItem>
                      Archive
                      <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive">Remove Project</Button>} />
                  <AlertDialogContent className="bg-[#101010] text-white ring-white/14">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete this project?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        This action cannot be undone and will remove team activity history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/20 bg-white/8 text-white" />
                      <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card className="border-white/12 bg-[#0c0c0c] text-white lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-white">Media + Label</CardTitle>
                <CardDescription className="text-white/55">Image utilities and typography slots.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label className="text-white">Pixelated image utility</Label>
                <div className="overflow-hidden rounded-md border border-white/14">
                  <PixelatedImage
                    src="/website-images/Index.png"
                    alt="Index preview"
                    width={960}
                    height={540}
                    className="h-36 w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-white/12 bg-[#0c0c0c] p-4 md:p-5">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/65">Folder Tile Components</h2>
            <Separator className="my-3 bg-white/10" />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
              {folderTiles.map((tile, index) => (
                <UiLocalhostFolderTile
                  key={tile.label}
                  label={tile.label}
                  color={tile.color}
                  href="/ui-localhost"
                  className="text-white"
                  style={{ animationDelay: `${index * 70}ms` }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/12 bg-[#0c0c0c] p-4 md:p-5">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/65">Textarea / Long Form</h2>
            <Separator className="my-3 bg-white/10" />
            <Field>
              <FieldLabel>
                <FieldTitle className="text-white">Project Brief</FieldTitle>
              </FieldLabel>
              <Textarea className="min-h-28 border-white/15 bg-white/6 text-white placeholder:text-white/40" placeholder="Write requirements, timelines, team context, and constraints..." />
              <FieldDescription className="text-white/55">Reusable field and helper text styling.</FieldDescription>
            </Field>
          </section>
        </div>
      </main>
    </StudioFrame>
  )
}
