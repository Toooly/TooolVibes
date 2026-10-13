"use client"

import { LocalizedText } from "@/components/i18n/localized-text";
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-[var(--tv-radius-modal)]! border border-[color:var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] p-2 text-[var(--tv-ink-primary)] shadow-[var(--tv-elevation-floating)]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Comandi rapidi",
  description = "Cerca una sezione, un tool o un'azione.",
  children,
  className,
  showCloseButton = false,
  shouldFilter,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  /** Forwarded to cmdk; false lets the caller rank/filter items itself (B31). */
  shouldFilter?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "top-1/3 max-w-[42rem] translate-y-0 overflow-hidden rounded-[var(--tv-radius-modal)]! border border-[color:var(--tv-border-subtle)] bg-transparent p-0 shadow-none ring-0 duration-[var(--tv-duration-base)] ease-[var(--tv-easing-standard)] data-open:fade-in-0 data-open:slide-in-from-top-2 data-closed:fade-out-0 data-closed:slide-out-to-top-2 data-open:zoom-in-100 data-closed:zoom-out-100",
          className
        )}
        showCloseButton={showCloseButton}
      >
        <Command shouldFilter={shouldFilter}>
          <DialogHeader className="sr-only">
            <DialogTitle><LocalizedText>{title}</LocalizedText></DialogTitle>
            <DialogDescription><LocalizedText>{description}</LocalizedText></DialogDescription>
          </DialogHeader>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-12! rounded-[var(--tv-radius-lg)]! border-white/10 bg-white/8 px-1 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm text-[var(--tv-ink-primary)] outline-hidden placeholder:text-[var(--tv-ink-muted-aa)] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-[28rem] scroll-py-2 overflow-x-hidden overflow-y-auto p-1 outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-8 text-center text-sm text-[var(--tv-ink-secondary)]", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-[var(--tv-ink-primary)] **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[var(--tv-kicker-tracking)] **:[[cmdk-group-heading]]:text-[var(--tv-ink-muted-aa)]",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 my-1 h-px bg-white/10", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex min-h-11 cursor-default items-center gap-2 rounded-[var(--tv-radius-md)] px-3 py-2 text-sm text-[var(--tv-ink-secondary)] outline-hidden select-none in-data-[slot=dialog-content]:rounded-[var(--tv-radius-md)]! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-[var(--tv-surface-selected)] data-selected:text-[var(--tv-ink-primary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-[var(--tv-ink-primary)]",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
